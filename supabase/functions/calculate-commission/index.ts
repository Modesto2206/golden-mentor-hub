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

// Progressive commission brackets
const BRACKETS = [
  { min: 70000, max: 80000, rate: 0.003 },
  { min: 80001, max: 90000, rate: 0.0035 },
  { min: 90001, max: 100000, rate: 0.004 },
  { min: 100001, max: 110000, rate: 0.0045 },
  { min: 110001, max: 120000, rate: 0.005 },
  { min: 120001, max: 130000, rate: 0.0055 },
  { min: 130001, max: 140000, rate: 0.006 },
  { min: 140001, max: 150000, rate: 0.0065 },
  { min: 150001, max: 160000, rate: 0.007 },
  { min: 160001, max: 170000, rate: 0.0075 },
  { min: 170001, max: 180000, rate: 0.008 },
  { min: 180001, max: 190000, rate: 0.0085 },
  { min: 190001, max: 200000, rate: 0.009 },
];

function getAppliedRate(volume: number): number {
  if (volume < 70000) return 0;
  for (let i = BRACKETS.length - 1; i >= 0; i--) {
    if (volume >= BRACKETS[i].min) return BRACKETS[i].rate;
  }
  return 0;
}

function getBracketLabel(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
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

    // Get seller's company
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.company_id) return jsonResponse({ error: "Perfil não encontrado" }, 400);

    // Get seller's role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Current month range
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthReference = monthStart.toISOString().split("T")[0];

    // Calculate total approved volume for this seller this month
    const { data: sales } = await supabaseAdmin
      .from("sales")
      .select("released_value")
      .eq("seller_id", user.id)
      .eq("status", "pago")
      .gte("sale_date", monthStart.toISOString().split("T")[0])
      .lte("sale_date", monthEnd.toISOString().split("T")[0]);

    const totalVolume = (sales ?? []).reduce((sum, s) => sum + Number(s.released_value), 0);
    const appliedRate = getAppliedRate(totalVolume);
    const commissionValue = totalVolume * appliedRate;

    // Get existing commission record
    const { data: existing } = await supabaseAdmin
      .from("seller_commissions")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("seller_id", user.id)
      .eq("month_reference", monthReference)
      .maybeSingle();

    const previousCelebratedRanges: string[] = existing?.celebrated_ranges as string[] ?? [];
    const currentBracketLabel = appliedRate > 0 ? getBracketLabel(appliedRate) : null;

    // Determine if we should trigger celebration
    let shouldCelebrate = false;
    let celebrationMessage = "";

    if (currentBracketLabel && !previousCelebratedRanges.includes(currentBracketLabel)) {
      shouldCelebrate = true;
      celebrationMessage = `Parabéns! 🎉 Você alcançou a faixa de comissão de ${currentBracketLabel}!`;
    }

    // Update celebrated ranges
    const newCelebratedRanges = shouldCelebrate && currentBracketLabel
      ? [...previousCelebratedRanges, currentBracketLabel]
      : previousCelebratedRanges;

    // Upsert commission record
    if (existing) {
      await supabaseAdmin
        .from("seller_commissions")
        .update({
          total_volume: totalVolume,
          applied_rate: appliedRate,
          commission_value: commissionValue,
          celebrated_ranges: newCelebratedRanges,
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin
        .from("seller_commissions")
        .insert({
          company_id: profile.company_id,
          seller_id: user.id,
          month_reference: monthReference,
          total_volume: totalVolume,
          applied_rate: appliedRate,
          commission_value: commissionValue,
          celebrated_ranges: newCelebratedRanges,
        });
    }

    // Find next bracket
    let nextBracket = null;
    if (totalVolume < 70000) {
      nextBracket = { min: 70000, rate: 0.003, missing: 70000 - totalVolume };
    } else {
      const currentIdx = BRACKETS.findIndex((b) => totalVolume >= b.min && totalVolume <= b.max);
      if (currentIdx >= 0 && currentIdx < BRACKETS.length - 1) {
        const next = BRACKETS[currentIdx + 1];
        nextBracket = { min: next.min, rate: next.rate, missing: next.min - totalVolume };
      }
    }

    return jsonResponse({
      success: true,
      data: {
        total_volume: totalVolume,
        applied_rate: appliedRate,
        commission_value: commissionValue,
        current_bracket: currentBracketLabel,
        next_bracket: nextBracket ? {
          rate: getBracketLabel(nextBracket.rate),
          missing: nextBracket.missing,
          min_volume: nextBracket.min,
        } : null,
        should_celebrate: shouldCelebrate,
        celebration_message: celebrationMessage,
        celebrated_ranges: newCelebratedRanges,
        brackets: BRACKETS.map((b) => ({
          min: b.min,
          max: b.max,
          rate: getBracketLabel(b.rate),
          active: totalVolume >= b.min && totalVolume <= b.max,
          reached: totalVolume >= b.min,
        })),
      },
    });
  } catch (error) {
    console.error("Erro:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
