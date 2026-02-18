import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT with anon client
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check existing profile and role
    const [profileResult, roleResult] = await Promise.all([
      adminClient.from("profiles").select("id, company_id").eq("user_id", user.id).maybeSingle(),
      adminClient.from("user_roles").select("id, role").eq("user_id", user.id).maybeSingle(),
    ]);

    const hasCompleteProfile = profileResult.data?.id && profileResult.data?.company_id;
    const hasRole = !!roleResult.data?.id;

    // If everything is already set up, return early
    if (hasCompleteProfile && hasRole) {
      return new Response(JSON.stringify({ message: "already_provisioned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";

    // Determine company_id: use existing if available, otherwise create new
    let companyId = profileResult.data?.company_id;

    if (!companyId) {
      const { data: company, error: companyError } = await adminClient
        .from("companies")
        .insert({
          name: `Empresa de ${fullName}`,
          email: user.email,
          is_active: true,
        })
        .select()
        .single();

      if (companyError) throw companyError;
      companyId = company.id;
    }

    // Create or update profile with company_id
    if (!profileResult.data?.id) {
      // No profile at all - create one
      const { error: profileError } = await adminClient
        .from("profiles")
        .insert({
          user_id: user.id,
          email: user.email!,
          full_name: fullName,
          company_id: companyId,
        });
      if (profileError) throw profileError;
    } else if (!profileResult.data.company_id) {
      // Profile exists but missing company_id - update it
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ company_id: companyId })
        .eq("user_id", user.id);
      if (updateError) throw updateError;
    }

    // Assign vendedor role if missing
    if (!hasRole) {
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "vendedor",
          company_id: companyId,
        });
      if (roleError) throw roleError;
    }

    return new Response(JSON.stringify({ success: true, company_id: companyId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("setup-new-user error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
