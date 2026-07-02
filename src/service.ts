/**
 * AgentEarn service — a self-contained reference for selling a verified, scored feed of
 * "agent-allowed earning opportunities" for SOL. The `deliverService()` fork point for the
 * Imperial AI Agent Hackathon (Solana × CoralOS track). Wire in as:
 *   case 'earn': return deliverAgentEarn(payload)
 *
 * Request grammar (the buyer agent's request string after the `earn` keyword):
 *   "feed"            -> top fresh AGENT_ALLOWED opportunities                  (data only)
 *   "feed <skill>"    -> filtered to a skill (writing|dev|security|content)     (data only)
 *   "score <slug>"    -> verified row + LLM fit/EV read                         (all three pillars)
 *
 * Pillars in play:
 *   - Data     live Superteam Earn listings, filtered to genuine AGENT_ALLOWED in code (honesty rule).
 *   - LLM      turns a raw opportunity into a fit/competition/EV read in the `score` verb.
 *   - Solana   the buyer escrow settles delivery on-chain (kit's ../server/proxy.ts `/api/settle`).
 */
import { analyzeOpportunity } from './score.js'

const SUPERTEAM_LISTINGS = 'https://superteam.fun/api/listings?type=bounty&take=100'
const SUPERTEAM_DETAIL = 'https://superteam.fun/api/listings/details/'

interface Opportunity {
  slug: string
  title: string
  reward: number | null
  token: string
  subs: number
  daysLeft: number | null
  agentAccess: string
}

const SKILL_HINTS: Record<string, string[]> = {
  writing: ['write', 'thread', 'content', 'article'],
  content: ['content', 'thread', 'twitter', 'post'],
  dev: ['build', 'agent', 'code', 'sdk', 'api', 'hackathon'],
  security: ['audit', 'security', 'review', 'owasp'],
}

/** Pull live listings and keep ONLY genuine AGENT_ALLOWED rows — the honesty rule, enforced in code. */
async function fetchAgentAllowed(): Promise<Opportunity[]> {
  const res = await fetch(SUPERTEAM_LISTINGS, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`listings ${res.status}`)
  const rows = (await res.json()) as any[]
  const now = Date.now()
  return rows
    // never sell a HUMAN_ONLY lane as agent-eligible; and only OPEN listings are submittable
    .filter((r) => r?.agentAccess === 'AGENT_ALLOWED' && r?.status === 'OPEN')
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      reward: r.usdValue ?? r.rewardAmount ?? null,
      token: r.token ?? 'USDC',
      subs: r.submissionCount ?? r._count?.Submission ?? 0,
      daysLeft: r.deadline ? Math.ceil((new Date(r.deadline).getTime() - now) / 86_400_000) : null,
      agentAccess: r.agentAccess,
    }))
}

export async function deliverAgentEarn(request: string): Promise<string> {
  const tokens = request.trim().split(/\s+/).filter(Boolean)
  const verb = (tokens[0] ?? 'feed').toLowerCase()
  const arg = tokens[1]

  try {
    switch (verb) {
      case 'feed': {
        let rows = await fetchAgentAllowed()
        if (arg && SKILL_HINTS[arg.toLowerCase()]) {
          const hints = SKILL_HINTS[arg.toLowerCase()]
          rows = rows.filter((r) => hints.some((h) => r.title.toLowerCase().includes(h)))
        }
        // freshest + least-contested first: low subs and more daysLeft rank higher
        rows.sort((a, b) => a.subs - b.subs || (b.daysLeft ?? 0) - (a.daysLeft ?? 0))
        return JSON.stringify({
          service: 'agentearn-feed',
          skill: arg ?? 'all',
          count: rows.length,
          opportunities: rows.slice(0, 10),
          timestamp: new Date().toISOString(),
        })
      }

      // The on-thesis product: verified opportunity in, LLM fit/EV read out, paid in SOL.
      case 'score': {
        if (!arg) return JSON.stringify({ error: 'usage: score <slug>' })
        const rows = await fetchAgentAllowed()
        const row = rows.find((r) => r.slug === arg)
        if (!row) return JSON.stringify({ error: `slug not in AGENT_ALLOWED feed: ${arg}` })
        // enrich with the public brief (no auth) so the read is grounded, not guessed
        let brief = ''
        try {
          const d = await fetch(SUPERTEAM_DETAIL + arg, { headers: { 'User-Agent': 'Mozilla/5.0' } })
          if (d.ok) brief = ((await d.json()) as any).description ?? ''
        } catch {
          /* brief is optional; score still works on the verified row */
        }
        const read = await analyzeOpportunity({ ...row, brief })
        return JSON.stringify({ service: 'agentearn-score', ...read, timestamp: new Date().toISOString() })
      }

      default:
        return JSON.stringify({ error: `unknown earn verb: ${verb} (try: feed | score)` })
    }
  } catch (e) {
    // Match the kit convention: failures come back as a readable string, not a throw.
    return JSON.stringify({ error: `agentearn delivery failed: ${(e as Error).message}` })
  }
}
