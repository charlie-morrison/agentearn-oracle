# AgentEarn Oracle — submission concept (Imperial AI Agent Hackathon)

**Bounty:** Imperial AI Agent Hackathon — Solana × CoralOS track. 5000 USDG, AGENT_ALLOWED,
deadline 2026-07-06. Only 7 subs at discovery. Judged on **GitHub repo + pitch deck + demo video**
(build quality, not social reach — our actual strength).

## The product (one line)
A **seller agent whose product is a verified, freshly-scored feed of "agent-allowed earning
opportunities"** — sold to other buyer-agents and settled trustlessly through the kit's Solana
escrow. An agent that helps other agents earn, paid on-chain.

## Why this wins the theme
The track theme is literally *"agents that earn — build the thing they buy, and how they compete
for it."* This experiment (`web3-bounties-v1`) has spent 12 days building exactly the upstream
intelligence: which marketplaces have an honest `AGENT_ALLOWED` lane, which tasks pay crypto-direct
to a wallet with no KYC, how competition/EV moves. That recon **is** a sellable product to any other
earning agent. So the submission isn't a contrived demo — it productizes a real, working pipeline.

## The three load-bearing pillars (mapped to the kit)
| Pillar | Kit's version (World Cup) | Our fork |
|--------|---------------------------|----------|
| **Verified data** | TxODDS de-margined odds | Live Superteam Earn `/api/listings` + dealwork `/jobs` pulls, filtered to genuine `AGENT_ALLOWED` / agent-native lanes (the honesty rule, enforced in code) |
| **LLM** | odds → fair line + read | opportunity → **fit/competition/EV score + one-line read** ("exact skill match, 7 subs, 6d left → high-EV") |
| **Solana escrow** | buyer-released / arbiter | unchanged — the kit's deployed devnet escrow binds `reference = sha256(slug·reward·deadline·nonce)` so the on-chain order provably is the feed sold |

## Request grammar (the buyer agent's request after the `earn` keyword)
- `feed`              → top N fresh AGENT_ALLOWED opportunities (data only)
- `feed <skill>`      → filtered to a skill (writing/dev/security/...)
- `score <slug>`      → verified row + **LLM fit/EV read** (all three pillars; the on-thesis product)

## Honest scope (what we claim vs not)
- We claim: a verified, de-duplicated, freshly-pulled feed + an LLM EV read. Grounded in live APIs.
- We do NOT claim: guaranteed payout, or that we win the listed bounties. The product is *intelligence*,
  same posture as the kit's "fair line, not a betting edge."

## Differentiation vs the starter
The starter sells sports data to a human-ish buyer. Ours sells **agent-economy meta-data to other
agents** — recursive, on-theme, and the data source is a pipeline we already operate (not a paid 3rd-party
feed). Judges see a working fork that answers the prompt literally.
