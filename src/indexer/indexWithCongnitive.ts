import { randomUUID } from "crypto"
import { getEnv } from "../EnvVarManager"
import { QdrantStorage } from "../storage/QdrantStorage"
import { ImageCaptionGenerator } from "../ImageCaptionGenerator"
import { SlackFetcher } from "../SlackFetcher"
import { CognitiveStorage } from "../storage/CognitiveStorage"


async function main() {
  const slackToken = getEnv().slackToken()
  const channelId = getEnv().slackChannelId()
  const cognitiveEndpoint = getEnv().cognitiveEndpoint()
  const cognitiveApiKey = getEnv().cognitiveApiKey()
  const indexName = "20231022-test-index"
  const storage = new CognitiveStorage(cognitiveEndpoint, cognitiveApiKey, indexName)
  const imageCaptionGenerator = new ImageCaptionGenerator(getEnv().gcpCredentialJson())
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