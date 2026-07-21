export type ChatStreamEventType =
	| 'start'
	| 'message.delta'
	| 'done'
	| 'error'

export interface ChatStreamEventPayload extends Record<string, unknown> {
	turnId: string
	seq: number
}
