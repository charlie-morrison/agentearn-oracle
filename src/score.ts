/**
 * AgentEarn scoring — the "verified opportunity → the agent's fit/EV read" transform, the sellable
 * insight behind the `score` verb in `service.ts`. Pure except for an optional LLM call, which is
 * injectable so the deterministic read is unit-testable and the module runs with NO api key.
 *
 * What it sells, honestly: a raw AGENT_ALLOWED listing is just numbers (reward, subs, daysLeft). The
 * product is a grounded read — competition-adjusted expected value + a one-line plain-language call —
 * so a buyer agent can decide *which* honest lane to spend a submission credit on. We never inflate:
 * EV is reward / max(subs,1) discounted for time pressure, and the read names the real risk.
 *
 * Mirrors the kit's `analyzeEdge()` (agent/edge.ts): verified input in, `{call, ...}` read out,
 * deterministic first, LLM second.
 */

export interface OpportunityInput {
  slug: string
  title: string
  reward: number | null
  token: string
  subs: number
  daysLeft: number | null
  agentAccess: string
  /** public brief (no auth) — optional grounding for the LLM read. */
  brief?: string
}

export interface OpportunityRead {
  slug: string
  title: string
  reward: number | null
  token: string
  subs: number
  daysLeft: number | null
  /** competition-adjusted expected value, USD: reward / max(subs,1), time-discounted. */
  evUsd: number
  /** 0–100 heuristic: higher = better honest shot (low subs, real runway, real reward). */
  fitScore: number
  analysis: { call: string; risk: string }
}

/** Optional LLM hook — same shape as the kit's injectable `complete()`. Returns a JSON string. */
export type Llm = (prompt: string) => Promise<string>

/** Deterministic read — no network, always available (the tested fallback). */
export function analyzeDeterministic(o: OpportunityInput): OpportunityRead {
  const subs = Math.max(o.subs ?? 0, 1)
  const reward = o.reward ?? 0
  const days = o.daysLeft ?? 0
  // time pressure discount: <2 days left halves EV (can't iterate), >7 days no discount.
  const timeFactor = days <= 0 ? 0.4 : days < 2 ? 0.5 : days < 4 ? 0.8 : 1
  const evUsd = Math.round(((reward / subs) * timeFactor) * 100) / 100
  // fit: reward matters, but low competition matters more; runway is a bonus.
  const compScore = Math.max(0, 60 - subs) // 0 subs → 60, 60+ subs → 0
  const rewardScore = Math.min(25, reward / 40) // $1000 → 25
  const runwayScore = Math.min(15, Math.max(0, days)) // up to 15
  const fitScore = Math.round(Math.min(100, compScore + rewardScore + runwayScore))
  const call =
    fitScore >= 55
      ? `Strong honest shot: ${subs} entries for ${reward} ${o.token}, ${days}d runway — bid.`
      : fitScore >= 30
        ? `Playable but contested: ${subs} entries — worth a credit only on exact capability match.`
        : `Low EV: ${subs} entries dilute a ${reward} ${o.token} pool — skip unless uniquely fit.`
  const risk =
    days <= 1
      ? 'Deadline imminent — no time to iterate on feedback.'
      : subs > 60
        ? 'Heavily contested — winner-take-most odds are thin.'
        : 'Judging is subjective (sponsor content review); reach/quality still decides.'
  return {
    slug: o.slug,
    title: o.title,
    reward: o.reward,
    token: o.token,
    subs: o.subs,
    daysLeft: o.daysLeft,
    evUsd,
    fitScore,
    analysis: { call, risk },
  }
}

/**
 * Full read: deterministic first (always correct + testable), then—if an LLM is supplied—an optional
 * plain-language overlay grounded in the verified row + public brief. The numbers never come from the
 * LLM; only the prose `call` may be refined. Matches the kit's "deterministic fallback, LLM overlay".
 */
export async function analyzeOpportunity(o: OpportunityInput, llm?: Llm): Promise<OpportunityRead> {
  const base = analyzeDeterministic(o)
  if (!llm) return base
  try {
    const prompt =
      `You are scoring an AGENT_ALLOWED earning opportunity for an AI worker agent. ` +
      `Verified row: reward=${o.reward} ${o.token}, submissions=${o.subs}, daysLeft=${o.daysLeft}. ` +
      `Brief: ${(o.brief ?? '').slice(0, 800)}. ` +
      `Return JSON {"call": "<one honest sentence: bid or skip and why>"} — do not invent numbers.`
    const raw = await llm(prompt)
    const parsed = JSON.parse(raw) as { call?: string }
    if (parsed.call) base.analysis.call = parsed.call
  } catch {
    /* LLM overlay is best-effort; the deterministic read stands. */
  }
  return base
}
