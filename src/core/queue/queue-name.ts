export const QueueName = {
	IMAGE_GENERATION: 'image-generation',
	COPYWRITING_GENERATION: 'copywriting-generation',
	VIDEO_GENERATION: 'video-generation',
} as const

export type QueueName = (typeof QueueName)[keyof typeof QueueName]
