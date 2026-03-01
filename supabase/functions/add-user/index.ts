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
    // Verify the calling user is an admin
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

    // Verify caller is admin
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

    // Check if caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .in("role", ["administrador", "raiz", "admin_global", "admin_empresa"])
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores podem criar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get caller's company_id
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", callingUser.id)
      .maybeSingle();

    const callerCompanyId = callerProfile?.company_id;

    if (!callerCompanyId) {
      return new Response(
        JSON.stringify({ success: false, error: "Empresa não encontrada para o administrador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check plan user limit
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("max_users, status")
      .eq("id", callerCompanyId)
      .single();

    if (company?.status === "suspended") {
      return new Response(
        JSON.stringify({ success: false, error: "Empresa suspensa. Não é possível adicionar colaboradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (company?.status === "canceled") {
      return new Response(
        JSON.stringify({ success: false, error: "Empresa cancelada. Não é possível adicionar colaboradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { count: currentUserCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", callerCompanyId)
      .eq("is_active", true);

    if (company?.max_users && (currentUserCount ?? 0) >= company.max_users) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "O limite de usuários do seu plano foi atingido. Faça upgrade do plano para adicionar mais colaboradores." 
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userInputSchema = z.object({
      email: z.string().trim().email("Email inválido").max(255),
      password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100),
      role: z.enum(["vendedor", "administrador"], { errorMap: () => ({ message: "Função inválida" }) }),
      full_name: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(200),
      phone: z.string().trim().max(20).optional().nullable(),
      company_id: z.string().uuid("ID da empresa inválido").optional().nullable(),
    });

    let validatedInput;
    try {
      validatedInput = userInputSchema.parse(await req.json());
    } catch (e) {
      const zodError = e as z.ZodError;
      const message = zodError.errors?.map((err) => err.message).join(", ") || "Dados inválidos";
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, role, full_name, phone } = validatedInput;
    // Always use the caller's company_id - never trust frontend
    const resolvedCompanyId = callerCompanyId;
    console.log(`Creating user: ${email} with role: ${role} for company: ${resolvedCompanyId}`);

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error("Create user error:", createError);
      return new Response(
        JSON.stringify({ success: false, error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newUser?.user) {
      console.log(`User created: ${newUser.user.id}`);

      // The handle_new_user trigger should create the profile automatically
      // But let's ensure the role is assigned
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role,
        company_id: resolvedCompanyId,
      });

      if (roleError) {
        console.error("Role assignment error:", roleError);
        // Don't fail the whole operation, user was created
      }

      // Wait a moment for trigger to fire, then verify profile exists
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", newUser.user.id)
        .maybeSingle();

      if (!profile) {
        console.log("Profile not found via trigger, creating manually");
        await supabaseAdmin.from("profiles").insert({
          user_id: newUser.user.id,
          email,
          full_name,
          phone: phone || null,
          company_id: resolvedCompanyId,
        });
      } else {
        // Update profile with company_id and phone if provided
        const updates: Record<string, any> = { company_id: resolvedCompanyId };
        if (phone) updates.phone = phone;
        if (Object.keys(updates).length > 0) {
          await supabaseAdmin.from("profiles").update(updates).eq("user_id", newUser.user.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: `Usuário ${email} criado com função: ${role}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Falha ao criar usuário" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
