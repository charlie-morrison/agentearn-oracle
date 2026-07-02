# AgentEarn Oracle

**An agent that helps other agents earn — paid on-chain.**

Submission for the **Imperial AI Agent Hackathon** (Solana × CoralOS track). A seller agent whose
product is a *verified, freshly-scored feed of "agent-allowed earning opportunities"* — sold to other
buyer-agents and settled trustlessly through the CoralOS kit's Solana escrow.

> The theme is *"agents that earn — build the thing they buy, and how they compete for it."*
> AgentEarn Oracle sells the upstream intelligence every earning agent needs: **which marketplaces
> have an honest `AGENT_ALLOWED` lane, which tasks pay crypto-direct to a wallet with no KYC, and
> where the expected value actually is.**

## Why it's not a contrived demo

The feed is a real pipeline. Behind it sits a live scout that pulls Superteam Earn `/api/listings`
and agent-native job boards, filters to genuine `AGENT_ALLOWED` lanes in code (the honesty rule), and
scores each row for fit / competition / EV. That recon *is* a sellable product to any other earning
agent — so this fork productizes a working system, not a mock.

## Three load-bearing pillars (mapped to the kit)

| Pillar | Kit's version (World Cup Oracle) | AgentEarn fork |
|--------|----------------------------------|----------------|
| **Verified data** | TxODDS de-margined odds | Live Superteam Earn `/api/listings` pulls, filtered to genuine `AGENT_ALLOWED` in code |
| **LLM** | odds → fair line + read | opportunity → **fit / competition / EV score + one-line read** |
| **Solana escrow** | buyer-released / arbiter | unchanged — binds `reference = sha256(slug·reward·deadline·nonce)` so the on-chain order provably is the feed sold |

## Request grammar

The buyer agent's request string after the `earn` keyword:

```
feed            → top fresh AGENT_ALLOWED opportunities            (data only)
feed <skill>    → filtered to a skill (writing|dev|security|...)   (data only)
score <slug>    → verified row + LLM fit/EV read                   (all three pillars)
```

## Quick start

```bash
npm install
npx tsx run_demo.ts
```

`run_demo.ts` proves the `feed` + `score` verbs return **real JSON from live Superteam data** — no
Solana stack and no API key required (the scorer has a deterministic fallback; set `ANTHROPIC_API_KEY`
for the LLM overlay). See [`DEMO-OUTPUT.txt`](./DEMO-OUTPUT.txt) for a captured run.

## Honest scope

- **We claim:** a verified, de-duplicated, freshly-pulled feed + an LLM EV read, grounded in live APIs.
- **We do NOT claim:** guaranteed payout, or that we win the listed bounties. The product is
  *intelligence* — same posture as the kit's "fair line, not a betting edge."

## Layout

```
src/service.ts   the `earn` fork point — feed | score verbs, returns JSON string
src/score.ts     analyzeOpportunity() — deterministic EV/fit scorer + optional LLM overlay
run_demo.ts      standalone runner: live feed → score, no chain, no key
CONCEPT.md       full design write-up
DEMO-OUTPUT.txt  captured real run
```

## Credit

Forked from the CoralOS hackathon starter (`trilltino/solana_coralOS`) per its license — the escrow
and dispatcher scaffolding are the kit's; `src/service.ts` + `src/score.ts` are this project's fork of
the `deliverService()` / `analyzeEdge()` points.

_Built by Charlie Morrison ([@CharlieMor6296](https://x.com/CharlieMor6296))._
