import { randomUUID } from "crypto"
import { EMBEDDING_DIMENSION } from "../constants"
import { QdrantClient } from "@qdrant/js-client-rest"
import { SearchStorage } from "./SearchStorage"
import { FileInfo } from "../types/FileInfo"
import { getEmbedding } from "../openai"

export class QdrantStorage implements SearchStorage {

  private client: QdrantClient
  private dimention: number
  private indexId: string

  constructor(endpoint: string, apiKey: string | undefined, indexId: string) {
    this.client = new QdrantClient({
      url: endpoint,
      apiKey: apiKey,
    })
    this.dimention = EMBEDDING_DIMENSION
    this.indexId = indexId
  }

  async createIndex() {
    await this.client.createCollection(this.indexId, {
      vectors: {
        size: this.dimention,
        distance: "Cosine",
      }
    })
  }

  async index(infos: FileInfo[]) {
    if (infos.length === 0) {
      return
    }
    const vecs = await Promise.all(infos.map(i => getEmbedding(i.text)))
    console.log(infos)
    await this.client.upsert(this.indexId, {
      wait: true,
      points: infos.map((info, i) => ({
        id: randomUUID(),
        vector: vecs[i].vector,
        payload: {
          ...info,
        },
      }))
    })
  }

  async search(query: string) {
    const vec = await getEmbedding(query)
    const searchRes = await this.client.search(this.indexId, {
      vector: vec.vector,
      limit: 10,
    })
    return searchRes.map(d => {
      return d.payload as FileInfo
    }).filter(d => d !== null) as FileInfo[]
  }
}