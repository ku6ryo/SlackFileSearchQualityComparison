import { getEnv } from "../EnvVarManager"
import { QdrantStorage } from "../storage/QdrantStorage"
import readline from "readline/promises"


async function main() {
  const qdrantUrl = getEnv().qdrantUrl()
  const qdrantApiKey = getEnv().qdrantApiKey()
  const indexName = "02c59477-f149-4cda-93c6-51561db357e9"
  const storage = new QdrantStorage(qdrantUrl, qdrantApiKey, indexName)
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