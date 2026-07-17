export type ImageProviderName = 'gpt' | 'doubao'

export interface NormalizedImageRequest {
	provider: ImageProviderName
	model: string
	payload: Record<string, unknown>
}

export interface ImageGenerateResult {
	status: 'processing' | 'completed'
	providerTaskId?: string
	result?: object
}

export interface ImagePollResult {
	status: 'processing' | 'completed' | 'failed'
	providerTaskId: string
	url?: string
	result?: object
}
