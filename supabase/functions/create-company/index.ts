import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

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
    const companyInputSchema = z.object({
      company_name: z.string().trim().min(2, "Nome da empresa obrigatório").max(200),
      cnpj: z.string().trim().min(11, "CNPJ inválido").max(20),
      company_email: z.string().trim().email("Email da empresa inválido").max(255).optional().nullable(),
      company_phone: z.string().trim().max(20).optional().nullable(),
      responsavel: z.string().trim().max(200).optional().nullable(),
      plano: z.enum(["basico", "profissional", "enterprise"]).optional().default("basico"),
      max_users: z.number().int().min(1).max(100).optional().default(2),
      admin_email: z.string().trim().email("Email do admin inválido").max(255),
      admin_password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").max(100),
      admin_name: z.string().trim().min(2, "Nome do admin obrigatório").max(200),
    });

    let validatedInput;
    try {
      validatedInput = companyInputSchema.parse(await req.json());
    } catch (e) {
      const zodError = e as z.ZodError;
      const message = zodError.errors?.map((err) => err.message).join(", ") || "Dados inválidos";
      return jsonResponse({ success: false, error: message }, 400);
    }

    const {
      company_name,
      cnpj,
      company_email,
      company_phone,
      responsavel,
      plano,
      max_users,
      admin_email,
      admin_password,
      admin_name,
    } = validatedInput;

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
        max_users: max_users || 2,
        status: "active",
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

    // 7. Create or find admin user
    console.log("Criando/buscando admin:", admin_email);
    let adminUserId: string;

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        console.log("Admin já existe, buscando usuário existente...");
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = usersData?.users?.find((u: any) => u.email === admin_email);
        if (!existingUser) {
          await supabaseAdmin.from("companies").delete().eq("id", company.id);
          return jsonResponse({ success: false, error: "Usuário admin não encontrado." }, 400);
        }
        adminUserId = existingUser.id;
        console.log("Admin existente vinculado:", adminUserId);
      } else {
        console.error("Erro ao criar admin:", createError);
        await supabaseAdmin.from("companies").delete().eq("id", company.id);
        return jsonResponse(
          { success: false, error: `Erro ao criar administrador: ${createError.message}` },
          400
        );
      }
    } else if (!newUser?.user) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      return jsonResponse({ success: false, error: "Falha ao criar usuário administrador" }, 500);
    } else {
      adminUserId = newUser.user.id;
      console.log("Admin criado:", adminUserId);
    }

    // 8. Assign role (upsert to avoid duplicates)
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({
      user_id: adminUserId,
      role: "administrador",
      company_id: company.id,
    }, { onConflict: "user_id" });

    if (roleError) {
      console.error("Erro ao atribuir role:", roleError);
    }

    // 9. Create/update profile with company_id
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", adminUserId)
      .maybeSingle();

    if (!existingProfile) {
      console.log("Criando perfil manualmente");
      await supabaseAdmin.from("profiles").insert({
        user_id: adminUserId,
        email: admin_email,
        full_name: admin_name,
        company_id: company.id,
      });
    } else {
      await supabaseAdmin
        .from("profiles")
        .update({ company_id: company.id })
        .eq("user_id", adminUserId);
    }

    console.log("Empresa e admin criados com sucesso:", {
      company_id: company.id,
      company_name: company.name,
      admin_id: adminUserId,
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
