import { WebClient } from "@slack/web-api"
import { SearchStorage } from "./storage/SearchStorage"
import { ParsedMessage, parseMessage } from "./parseMessage"
import { ImageCaptionGenerator } from "./ImageCaptionGenerator"
import axios from "axios"
import { getWebpageContentText } from "./getWebPageContentText"
import { extractUrlsFromText } from "./extractUrlsFromText"
import { FileInfo } from "./types/FileInfo"

export class SlackFetcher {
  slack: WebClient

  constructor(
    private token: string,
    private channelId: string,
    private storage: SearchStorage,
    private imageCaptionGenerator: ImageCaptionGenerator
  ) {
    this.slack = new WebClient(this.token)
  }

  async fetch() {
    let cursor: string | null = null
    let hasMore = true

    while (hasMore) {
      const result = await this.slack.conversations.history({
        channel: this.channelId,
        cursor: cursor || undefined,
      });
      const { messages, has_more, response_metadata } = result
      if (response_metadata === undefined) {
        throw new Error("response_metadata is undefined")
      }
      if (messages === undefined) {
        continue
      }
      const filtered = messages.filter((msg) => {
        return msg.type === "message" && msg.subtype === undefined
      })
      hasMore = !!has_more
      cursor = response_metadata.next_cursor || null
      for (const msg of filtered) {
        if (msg.ts) {
          await this.indexReplies(
            this.channelId,
            msg.ts
          )
        }
      }
    }
    console.log("Completed without error")
  }

  async indexReplies(
    channelId: string,
    ts: string
  ) {
    let cursor: string | null = null;
    let hasMore = true
    while (hasMore) {
      const result = await this.slack.conversations.replies({
        channel: channelId,
        ts: ts,
        cursor: cursor || undefined,
      })
      const { messages, has_more, response_metadata } = result
      if (response_metadata === undefined) {
        throw new Error("response_metadata is undefined")
      }
      if (messages === undefined) {
        throw new Error("messages is undefined")
      }
      const filtered = messages.filter((msg) => {
        return msg.type === "message"
      })
      for (const msg of filtered) {
        const { text, ts, user, thread_ts } = msg
        if (
          text === undefined ||
          ts === undefined ||
          user === undefined
        ) {
          continue
        }
        await this.indexMessage(channelId, thread_ts || ts, ts)
      }
      hasMore = !!has_more
      cursor = response_metadata.next_cursor || null
    }
  }

  async indexMessage(channelId: string, threadTs: string, ts?: string) {
    const result = await this.slack.conversations.replies({
      channel: channelId,
      ts: ts || threadTs,
      latest: ts || threadTs,
      limit: 1,
    })
    const { messages, response_metadata } = result
    if (response_metadata === undefined) {
      throw new Error("response_metadata is undefined")
    }
    if (messages === undefined) {
      throw new Error("messages is undefined")
    }
    const filtered = messages.filter((msg) => {
      return msg.type === "message"
    })
    if (filtered.length === 0) {
      return
    }
    const msg = filtered[0]
    const parsedMessage = parseMessage(msg)
    const docJsons = [parsedMessage] as ParsedMessage[]
    for (const att of parsedMessage.attachments) {
      if (att.url.endsWith(".jpg") || att.url.endsWith(".jpeg") || att.url.endsWith(".png")) {
        console.log("Image detected")
        try {
         const { data: imgData } = await axios.get(
          att.url,
          {
            headers: {
              "Authorization": "Bearer " + this.token
            },
            responseType: "arraybuffer"
          })
         const captions = await this.imageCaptionGenerator.generateCaptions(Buffer.from(imgData as ArrayBuffer))
         docJsons.push({ id: parsedMessage.id, text: captions.join("\n"), attachments: [{ title: att.title, url: att.url }] })
        } catch (e) {
          // pass
        }
      } else {
        try {
          const { text } = await getWebpageContentText(att.url, 1000)
          docJsons.push({ id: parsedMessage.id, text, attachments: [{ title: att.title, url: att.url }] })
        } catch (e) {
          // Just ignore
        }
      }
    }
    const embeddedUrls = extractUrlsFromText(parsedMessage.text)
    for (const url of embeddedUrls) {
      if (parsedMessage.attachments.find((a: any) => a.url === url)) {
        continue
      }
      try {
        const { text, title } = await getWebpageContentText(url, 1000)
        docJsons.push({ id: parsedMessage.id, text, attachments: [{ title, url }] })
      } catch (e) {
        // Just ignore
      }
    }
    const fileInfos = [] as FileInfo[]
    for (const doc of docJsons) {
      for (const a of doc.attachments) {
        fileInfos.push({
          url: a.url,
          name: a.title,
          text: doc.text
        })
      }
    }
    this.storage.index(fileInfos)
  }
}