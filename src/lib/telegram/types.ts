export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
}

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

export interface TelegramDocument {
  file_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramMessage {
  message_id: number
  chat: TelegramChat
  from?: TelegramUser
  date: number
  text?: string
  caption?: string
  document?: TelegramDocument
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export interface TelegramFile {
  file_id: string
  file_path?: string
  file_size?: number
}
