import { getEnv } from "../EnvVarManager"
import { CognitiveStorage } from "../storage/CognitiveStorage"
import readline from "readline/promises"


async function main() {
  const cognitiveEndpoint = getEnv().cognitiveEndpoint()
  const cognitiveApiKey = getEnv().cognitiveApiKey()
  const indexName = "20231022-test-index"
  const storage = new CognitiveStorage(cognitiveEndpoint, cognitiveApiKey, indexName)
  console.log("index: " + indexName)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  while(true) {
    const query = await rl.question(`query: `)
    console.log(await storage.search(query))
  }
}

main()