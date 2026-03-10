import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify caller is authenticated
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !callingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin (any admin role)
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .in("role", ["administrador", "raiz", "admin_global", "admin_empresa"])
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores podem remover usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const removeUserSchema = z.object({
      user_id: z.string().uuid("ID do usuário inválido"),
    });

    let validatedInput;
    try {
      validatedInput = removeUserSchema.parse(await req.json());
    } catch (e) {
      const zodError = e as z.ZodError;
      const message = zodError.errors?.map((err) => err.message).join(", ") || "Dados inválidos";
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id } = validatedInput;
    console.log(`Attempting to remove user: ${user_id}`);

    // Prevent removing self
    if (user_id === callingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Você não pode remover a si mesmo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if target user is an admin - only super admins (raiz, admin_global) can remove admins
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user_id)
      .in("role", ["administrador", "raiz", "admin_global", "admin_empresa"])
      .maybeSingle();

    if (targetRole) {
      // Allow super admins to remove regular admins, but never remove raiz/admin_global
      const targetIsSuper = targetRole.role === "raiz" || targetRole.role === "admin_global";
      const callerIsSuper = callerRole.role === "raiz" || callerRole.role === "admin_global";

      if (targetIsSuper) {
        return new Response(
          JSON.stringify({ success: false, error: "Não é permitido remover um super administrador" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!callerIsSuper) {
        return new Response(
          JSON.stringify({ success: false, error: "Apenas super administradores podem remover administradores" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if this user is the last admin of their company
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (targetProfile?.company_id && targetRole?.role === "administrador") {
      const { count: adminCount } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("company_id", targetProfile.company_id)
        .in("role", ["administrador", "admin_empresa"]);

      if ((adminCount ?? 0) <= 1) {
        return new Response(
          JSON.stringify({ success: false, error: "Não é possível remover o último administrador da empresa. Promova outro usuário a administrador antes." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Delete user role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    console.log(`Roles deleted for user: ${user_id}`);

    // Deactivate profile (soft delete)
    await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("user_id", user_id);
    console.log(`Profile deactivated for user: ${user_id}`);

    // Delete from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error("Delete auth user error:", deleteError);
      return new Response(
        JSON.stringify({ success: false, error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user_id} removed successfully`);
    return new Response(
      JSON.stringify({ success: true, message: "Usuário removido com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
