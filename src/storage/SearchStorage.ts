import { FileInfo } from "../types/FileInfo"

export interface SearchStorage {
  index(infos: FileInfo[]): Promise<void>
  search(query: string): Promise<FileInfo[]>
}