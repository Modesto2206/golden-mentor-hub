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

const planLimits: Record<string, number> = {
  basico: 2,
  profissional: 5,
  enterprise: 10,
  ghost: 999,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Não autenticado" }, 401);

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } }, auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Não autenticado" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify super admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["raiz", "admin_global"])
      .maybeSingle();

    if (!callerRole) return jsonResponse({ error: "Acesso negado" }, 403);

    const body = await req.json();
    const { action } = body;

    // ===== EDIT COMPANY =====
    if (action === "edit") {
      const schema = z.object({
        company_id: z.string().uuid(),
        name: z.string().trim().min(2).max(200).optional(),
        cnpj: z.string().trim().max(20).optional(),
        email: z.string().email().max(255).optional().nullable(),
        phone: z.string().max(20).optional().nullable(),
        responsavel: z.string().max(200).optional().nullable(),
        plano: z.enum(["basico", "profissional", "enterprise", "ghost"]).optional(),
        max_users: z.number().int().min(1).max(999).optional(),
        status: z.enum(["active", "suspended", "canceled"]).optional(),
      });

      const input = schema.parse(body);
      const { company_id, ...updateData } = input;

      // If plan changes, auto-update max_users
      if (updateData.plano && !updateData.max_users) {
        updateData.max_users = planLimits[updateData.plano] || 2;
      }

      // If status changes to suspended, log it
      const statusChanging = updateData.status;
      const suspendFields: Record<string, unknown> = {};
      if (statusChanging === "suspended") {
        suspendFields.suspended_at = new Date().toISOString();
        suspendFields.suspended_by = user.id;
      } else if (statusChanging === "active") {
        suspendFields.suspended_at = null;
        suspendFields.suspended_by = null;
      }

      const { error } = await supabaseAdmin
        .from("companies")
        .update({ ...updateData, ...suspendFields })
        .eq("id", company_id);

      if (error) return jsonResponse({ error: error.message }, 500);

      // Log audit
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: statusChanging === "suspended" ? "suspend_company" : "edit_company",
        resource: "companies",
        resource_id: company_id,
        new_data: { ...updateData, ...suspendFields },
      });

      return jsonResponse({ success: true, message: "Empresa atualizada com sucesso" });
    }

    // ===== SOFT DELETE COMPANY =====
    if (action === "delete") {
      const schema = z.object({
        company_id: z.string().uuid(),
        hard_delete: z.boolean().optional().default(false),
      });

      const input = schema.parse(body);

      if (input.hard_delete) {
        // Check for financial records
        const { count: salesCount } = await supabaseAdmin
          .from("sales")
          .select("id", { count: "exact", head: true })
          .eq("company_id", input.company_id);

        const { count: proposalCount } = await supabaseAdmin
          .from("proposals")
          .select("id", { count: "exact", head: true })
          .eq("company_id", input.company_id);

        if ((salesCount ?? 0) > 0 || (proposalCount ?? 0) > 0) {
          return jsonResponse({
            error: "Não é possível excluir permanentemente. Existem registros financeiros. Use exclusão suave.",
          }, 400);
        }

        // Hard delete
        await supabaseAdmin.from("companies").delete().eq("id", input.company_id);
      } else {
        // Soft delete
        await supabaseAdmin
          .from("companies")
          .update({
            status: "canceled",
            is_active: false,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", input.company_id);
      }

      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: input.hard_delete ? "hard_delete_company" : "soft_delete_company",
        resource: "companies",
        resource_id: input.company_id,
      });

      return jsonResponse({ success: true, message: "Empresa removida com sucesso" });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.errors.map((e) => e.message).join(", ") }, 400);
    }
    console.error("Erro:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
