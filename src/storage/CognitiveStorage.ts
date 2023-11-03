import { SearchIndexClient, AzureKeyCredential } from "@azure/search-documents"
import { FileInfo } from "../types/FileInfo"
import { randomUUID } from "crypto"
import { SearchStorage } from "./SearchStorage"

export class CognitiveStorage implements SearchStorage {
  indexClient: SearchIndexClient
  constructor(
    endpoint: string,
    apiKey: string,
    private indexName: string
  ) {
    const cre = new AzureKeyCredential(apiKey)
    this.indexClient = new SearchIndexClient(endpoint, cre)
  }

  async index(infos: FileInfo[]) {
    if (infos.length === 0) {
      return
    }
    const searchClient = this.indexClient.getSearchClient(this.indexName)
    const result = await searchClient.mergeOrUploadDocuments(infos.map((i) => {
      return {
        id: randomUUID(),
        url: i.url,
        text: i.text,
      }
    }))
    console.log(result)
  }

  async search(query: string) {
    const searchClient = this.indexClient.getSearchClient<FileInfo>(this.indexName)
    const result = await searchClient.search(query)
    const infos = [] as FileInfo[]
    for await (const r of result.results) {
      infos.push(r.document)
    }
    return infos
  }

  async clear() {
    const searchClient = this.indexClient.getSearchClient(this.indexName)
    while (await searchClient.getDocumentsCount() > 0) {
      const r = await searchClient.search("*")
      const docs = [] as Pick<unknown, never>[]
      for await (const result of r.results) {
        docs.push(result.document)
      }
      await searchClient.deleteDocuments(docs)
    }
  }
}