// Standalone demo runner: proves the AgentEarn `feed` + `score` verbs return real JSON
// from LIVE Superteam data, with NO Solana stack and NO api key (deterministic score).
import { deliverAgentEarn } from './src/service.js'

async function main() {
  console.log('=== earn feed ===')
  const feed = await deliverAgentEarn('feed')
  console.log(feed)
  const parsed = JSON.parse(feed)
  const first = parsed.opportunities?.[0]?.slug
  if (first) {
    console.log('\n=== earn score ' + first + ' ===')
    console.log(await deliverAgentEarn('score ' + first))
  }
}
main().catch((e) => { console.error('RUN ERROR', e); process.exit(1) })
