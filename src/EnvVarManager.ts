import "dotenv/config"

export function getEnv() {
  return EnvVarManager.instance || new EnvVarManager()
}

class EnvVarManager {
  static instance: EnvVarManager | null = null

  constructor() {
    if (EnvVarManager.instance) {
      throw new Error("instance already exits")
    }
    EnvVarManager.instance = this
  }

  private getVar(key: string) {
    const v = process.env[key]
    if (!v) {
      throw new Error(`${key} is undefined`)
    }
    return v
  }

  qdrantUrl() {
    return this.getVar("QDRANT_URL")
  }

  qdrantApiKey() {
    try {
      return this.getVar("QDRANT_API_KEY")
    } catch (e) {
      return undefined
    }
  }

  slackToken() {
    return this.getVar("SLACK_TOKEN")
  }

  slackChannelId() {
    return this.getVar("SLACK_CHANNEL_ID")
  }

  openaiApiKey() {
    return this.getVar("OPENAI_API_KEY")
  }

  gcpCredentialJson() {
    return JSON.parse(this.getVar("GCP_CREDENTIAL_JSON"))
  }

  googleSearchEngineId() {
    return this.getVar("GOOGLE_SEARCH_ENGINE_ID")
  }

  googleSearchApiKey() {
    return this.getVar("GOOGLE_SEARCH_API_KEY")
  }

  cognitiveEndpoint() {
    return this.getVar("COGNITIVE_ENDPOINT")
  }

  cognitiveApiKey() {
    return this.getVar("COGNITIVE_API_KEY")
  }
}