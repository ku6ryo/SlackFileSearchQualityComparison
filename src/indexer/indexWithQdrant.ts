import { randomUUID } from "crypto"
import { getEnv } from "../EnvVarManager"
import { QdrantStorage } from "../storage/QdrantStorage"
import { ImageCaptionGenerator } from "../ImageCaptionGenerator"
import { SlackFetcher } from "../SlackFetcher"


async function main() {
  const slackToken = getEnv().slackToken()
  const channelId = getEnv().slackChannelId()
  const qdrantUrl = getEnv().qdrantUrl()
  const qdrantApiKey = getEnv().qdrantApiKey()
  const indexName = randomUUID()
  const storage = new QdrantStorage(qdrantUrl, qdrantApiKey, indexName)
  const imageCaptionGenerator = new ImageCaptionGenerator(getEnv().gcpCredentialJson())
  await storage.createIndex()
  await imageCaptionGenerator.init()
  const fetcher = new SlackFetcher(
    slackToken,
    channelId,
    storage,
    imageCaptionGenerator,
  )
  console.log("index: " + indexName)
  await fetcher.fetch()
  console.log("index: " + indexName)
}

main()