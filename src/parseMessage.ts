import { MessageElement } from "@slack/web-api/dist/response/ConversationsRepliesResponse"

export type Attachment = {
  title: string
  url: string
}

export type ParsedMessage = {
  id: string
  text: string
  attachments: Attachment[]
}

export function parseMessage(msg: MessageElement): ParsedMessage {
  const { text, ts, user, thread_ts, files, attachments } = msg
  if (
    text === undefined ||
    ts === undefined ||
    user === undefined
  ) {
    throw new Error("text, ts, or user is undefined")
  }
  const cleanAttachments: Attachment[] = []
  if (attachments) {
    for (const attachment of attachments) {
      if (attachment.original_url) {
        cleanAttachments.push({
          title: attachment.title || "",
          url: attachment.original_url
        })
      } else if (attachment.is_app_unfurl && attachment.app_unfurl_url) {
        cleanAttachments.push({
          title: attachment.title || "",
          url: attachment.app_unfurl_url
        })
      }
    }
  }
  if (files) {
    for (const file of files) {
      if (file.url_private) {
        cleanAttachments.push({
          title: file.title || "",
          url: file.url_private
        })
      }
    }
  }
  const mentionedUserIds = (() => {
    const m = text.match(/<@(U[A-Z0-9]+)>/g)
    if (!m) {
      return []
    }
    const ids = [] as string[]
    for (const match of m) {
      const id = match.match(/<@(U[A-Z0-9]+)>/)![1]
      ids.push(id)
    }
    return ids
  })()
  return {
    id: thread_ts ? `${thread_ts}/${ts}` : ts,
    text,
    attachments: cleanAttachments,
  }
}

