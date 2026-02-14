import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return jsonResponse({ success: false, error: "Não autenticado" }, 401);
    }

    console.log("Usuário autenticado:", user.id, user.email);

    // 2. Admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Validate Super Admin role
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["raiz", "admin_global"])
      .maybeSingle();

    if (!callerRole) {
      console.warn("Acesso negado para usuário:", user.id);
      return jsonResponse(
        { success: false, error: "Acesso negado. Apenas Super Admin pode criar empresas." },
        403
      );
    }

    console.log("Permissão confirmada. Role:", callerRole.role);

    // 4. Parse and validate input
    const body = await req.json();
    const {
      company_name,
      cnpj,
      company_email,
      company_phone,
      responsavel,
      plano,
      admin_email,
      admin_password,
      admin_name,
    } = body;

    if (!company_name || !cnpj || !admin_email || !admin_password || !admin_name) {
      return jsonResponse(
        { success: false, error: "Campos obrigatórios: nome da empresa, CNPJ, email/senha/nome do admin" },
        400
      );
    }

    // 5. Check CNPJ uniqueness
    const cleanCnpj = cnpj.replace(/\D/g, "");
    const { data: existingCompany } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .eq("cnpj", cleanCnpj)
      .maybeSingle();

    if (existingCompany) {
      console.warn("CNPJ duplicado:", cleanCnpj, "Empresa:", existingCompany.name);
      return jsonResponse(
        { success: false, error: `CNPJ já cadastrado para a empresa: ${existingCompany.name}` },
        400
      );
    }

    // 6. Create company
    console.log("Criando empresa:", company_name);
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: company_name,
        cnpj: cleanCnpj,
        email: company_email || null,
        phone: company_phone?.replace(/\D/g, "") || null,
        responsavel: responsavel || null,
        plano: plano || "basico",
      })
      .select()
      .single();

    if (companyError) {
      console.error("Erro ao criar empresa:", companyError);
      return jsonResponse(
        { success: false, error: `Erro ao criar empresa: ${companyError.message}` },
        500
      );
    }

    console.log("Empresa criada:", company.id, company.name);

    // 7. Create admin user
    console.log("Criando admin:", admin_email);
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    });

    if (createError) {
      console.error("Erro ao criar admin:", createError);
      // Rollback: delete the company
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      console.log("Rollback: empresa removida");
      return jsonResponse(
        { success: false, error: `Erro ao criar administrador: ${createError.message}` },
        400
      );
    }

    if (!newUser?.user) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return jsonResponse({ success: false, error: "Falha ao criar usuário administrador" }, 500);
    }

    console.log("Admin criado:", newUser.user.id);

    // 8. Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "administrador",
      company_id: company.id,
    });

    if (roleError) {
      console.error("Erro ao atribuir role:", roleError);
    }

    // 9. Create/update profile with company_id
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", newUser.user.id)
      .maybeSingle();

    if (!existingProfile) {
      console.log("Criando perfil manualmente");
      await supabaseAdmin.from("profiles").insert({
        user_id: newUser.user.id,
        email: admin_email,
        full_name: admin_name,
        company_id: company.id,
      });
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({ company_id: company.id })
        .eq("user_id", newUser.user.id);
    }

    console.log("Empresa e admin criados com sucesso:", {
      company_id: company.id,
      company_name: company.name,
      admin_id: newUser.user.id,
    });

    return jsonResponse({
      success: true,
      message: `Empresa "${company_name}" criada com sucesso. Admin: ${admin_email}`,
      data: {
        company_id: company.id,
        company_name: company.name,
        admin_email,
      },
    });
  } catch (error) {
    console.error("Erro inesperado:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno inesperado",
      },
      500
    );
  }
});
