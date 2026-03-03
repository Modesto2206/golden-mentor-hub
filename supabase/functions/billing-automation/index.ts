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

    // ===== MARK OVERDUE =====
    if (action === "mark_overdue") {
      const today = new Date().toISOString().split("T")[0];
      const { data: overdue, error } = await supabaseAdmin
        .from("company_billing")
        .update({ status: "overdue" })
        .eq("status", "pending")
        .lt("due_date", today)
        .is("paid_at", null)
        .select("id, company_id");

      if (error) return jsonResponse({ error: error.message }, 500);

      // Log each overdue
      for (const bill of overdue || []) {
        await supabaseAdmin.from("audit_logs").insert({
          user_id: user.id,
          action: "billing_overdue",
          resource: "company_billing",
          resource_id: bill.id,
          new_data: { company_id: bill.company_id, status: "overdue" },
        });
      }

      return jsonResponse({ success: true, overdue_count: overdue?.length || 0 });
    }

    // ===== CONFIRM PAYMENT =====
    if (action === "confirm_payment") {
      const { billing_id } = body;
      if (!billing_id) return jsonResponse({ error: "billing_id obrigatório" }, 400);

      const { data: bill, error: fetchErr } = await supabaseAdmin
        .from("company_billing")
        .select("*")
        .eq("id", billing_id)
        .single();

      if (fetchErr || !bill) return jsonResponse({ error: "Billing não encontrado" }, 404);

      const now = new Date().toISOString();
      // Mark as paid
      await supabaseAdmin
        .from("company_billing")
        .update({ status: "paid", paid_at: now })
        .eq("id", billing_id);

      // Auto-renew: create next billing
      const nextDue = new Date(bill.due_date);
      nextDue.setDate(nextDue.getDate() + 30);
      await supabaseAdmin.from("company_billing").insert({
        company_id: bill.company_id,
        plan_type: bill.plan_type,
        amount: bill.amount,
        due_date: nextDue.toISOString().split("T")[0],
        status: "pending",
      });

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        user_id: user.id,
        action: "billing_payment_confirmed",
        resource: "company_billing",
        resource_id: billing_id,
        new_data: { company_id: bill.company_id, paid_at: now },
      });

      return jsonResponse({ success: true, message: "Pagamento confirmado e próxima cobrança gerada." });
    }

    // ===== GENERATE BILLING FOR COMPANY =====
    if (action === "generate_billing") {
      const { company_id, plan_type, amount } = body;
      if (!company_id) return jsonResponse({ error: "company_id obrigatório" }, 400);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await supabaseAdmin.from("company_billing").insert({
        company_id,
        plan_type: plan_type || "basico",
        amount: amount || 0,
        due_date: dueDate.toISOString().split("T")[0],
        status: "pending",
      });

      return jsonResponse({ success: true, message: "Billing gerado." });
    }

    // ===== GET BILLING STATUS =====
    if (action === "get_status") {
      const { company_id } = body;
      if (!company_id) return jsonResponse({ error: "company_id obrigatório" }, 400);

      const { data } = await supabaseAdmin
        .from("company_billing")
        .select("*")
        .eq("company_id", company_id)
        .order("due_date", { ascending: false })
        .limit(5);

      const hasOverdue = data?.some((b: any) => b.status === "overdue") || false;
      return jsonResponse({ success: true, billing: data || [], has_overdue: hasOverdue });
    }

    // ===== FINANCIAL SUMMARY (Super Admin) =====
    if (action === "financial_summary") {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

      // All billing
      const { data: allBilling } = await supabaseAdmin
        .from("company_billing")
        .select("*");

      // Companies (non-ghost)
      const { data: companies } = await supabaseAdmin
        .from("companies")
        .select("id, plano, status, created_at, cancelled_at")
        .neq("plano", "ghost");

      const planPrices: Record<string, number> = { basico: 97, profissional: 197, enterprise: 497 };

      const activeCompanies = companies?.filter((c: any) => c.status === "active") || [];
      const mrrTeorico = activeCompanies.reduce((sum: number, c: any) => sum + (planPrices[c.plano || "basico"] || 0), 0);

      const paidThisMonth = (allBilling || []).filter((b: any) => {
        if (b.status !== "paid" || !b.paid_at) return false;
        const paidDate = b.paid_at.split("T")[0];
        return paidDate >= monthStart && paidDate < monthEnd;
      });
      const mrrRecebido = paidThisMonth.reduce((sum: number, b: any) => sum + Number(b.amount), 0);

      const pendingBills = (allBilling || []).filter((b: any) => b.status === "pending");
      const overdueBills = (allBilling || []).filter((b: any) => b.status === "overdue");
      const totalPending = pendingBills.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
      const totalOverdue = overdueBills.reduce((sum: number, b: any) => sum + Number(b.amount), 0);

      // Overdue company IDs
      const overdueCompanyIds = [...new Set(overdueBills.map((b: any) => b.company_id))];

      // Yearly revenue
      const yearStart = `${currentYear}-01-01`;
      const yearlyPaid = (allBilling || []).filter((b: any) => {
        if (b.status !== "paid" || !b.paid_at) return false;
        return b.paid_at.split("T")[0] >= yearStart;
      });
      const yearlyRevenue = yearlyPaid.reduce((sum: number, b: any) => sum + Number(b.amount), 0);

      const ticketMedio = activeCompanies.length > 0 ? mrrTeorico / activeCompanies.length : 0;

      // Churn
      const cancelledThisMonth = (companies || []).filter((c: any) => {
        if (!c.cancelled_at) return false;
        const d = c.cancelled_at.split("T")[0];
        return d >= monthStart && d < monthEnd;
      }).length;

      const activeAtStart = (companies || []).filter((c: any) => {
        return new Date(c.created_at) < new Date(monthStart) && c.status !== "canceled";
      }).length || 1;

      const churnRate = (cancelledThisMonth / activeAtStart) * 100;

      // Revenue projection (simple: MRR * months - churn loss)
      const avgChurn = churnRate / 100;
      const projection3 = mrrTeorico * 3 * (1 - avgChurn);
      const projection6 = mrrTeorico * 6 * (1 - avgChurn * 1.5);
      const projection12 = mrrTeorico * 12 * (1 - avgChurn * 2);

      return jsonResponse({
        success: true,
        data: {
          mrr_teorico: mrrTeorico,
          mrr_recebido: mrrRecebido,
          total_pending: totalPending,
          total_overdue: totalOverdue,
          overdue_company_count: overdueCompanyIds.length,
          yearly_revenue: yearlyRevenue,
          ticket_medio: ticketMedio,
          churn_count: cancelledThisMonth,
          churn_rate: Math.round(churnRate * 100) / 100,
          active_companies: activeCompanies.length,
          projection_3m: Math.round(projection3),
          projection_6m: Math.round(projection6),
          projection_12m: Math.round(projection12),
        },
      });
    }

    return jsonResponse({ error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("Erro:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
