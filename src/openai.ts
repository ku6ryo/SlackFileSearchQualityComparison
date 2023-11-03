import { getEnv } from "./EnvVarManager"
import OpenAI from "openai"

export function buildClient() {
  return new OpenAI({
    apiKey: getEnv().openaiApiKey(),
  })
}

enum Model {
  EmbeddingAdaV2 = "text-embedding-ada-002",
  Gpt35Turbo = "gpt-3.5-turbo",
  Gpt35Turbo16K = "gpt-3.5-turbo-16k-0613",
}

const COST_PER_TOKEN = {
  [Model.EmbeddingAdaV2]: 100,
  [Model.Gpt35Turbo]: 2000,
  [Model.Gpt35Turbo16K]: 4000,
}

function calcCost(model: Model, tokens: number) {
  const costPerToken = COST_PER_TOKEN[model]
  if (!costPerToken) {
    throw new Error(`unknown model: ${model}`)
  }
  return costPerToken * tokens
}

export async function getEmbedding(text: string) {
  const openai = buildClient()
  const { data, usage } = await openai.embeddings.create({
    model: Model.EmbeddingAdaV2, 
    input: text,
  })
  return {
    vector: data[0].embedding,
    consumedCredits: calcCost(Model.EmbeddingAdaV2, usage.total_tokens)
  }
}

export async function getChatCompletion(messages: OpenAI.Chat.ChatCompletionMessage[], config?: {
  topP?: number,
  temparature?: number,
  functions?: OpenAI.Chat.ChatCompletionCreateParams.Function[],
}) {
  const openai = buildClient()
  const modelName = Model.Gpt35Turbo16K
  const { choices, usage } = await openai.chat.completions.create({
    model: modelName, 
    messages: messages,
    temperature: config ? config.temparature : undefined,
    top_p: config ? config.topP : undefined,
    functions: config ? config.functions : undefined,
  })
  if (!usage) {
    throw new Error("usage is null")
  }
  if (choices.length === 0 || !choices[0].message) {
    throw new Error("choices is empty")
  }
  return {
    content: choices[0].message.content || "",
    consumedCredits: calcCost(modelName, usage.total_tokens),
    functionCall: choices[0].message.function_call || null,
  }
}