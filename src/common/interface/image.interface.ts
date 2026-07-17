export type ImageProviderName = 'gpt' | 'doubao'
export type ImageResolution = '1k' | '2k' | '4k'
export type ImageQuality = 'low' | 'medium' | 'high'
export type ImageRatio = '16:9' | '9:16' | '1:1' | '3:4' | '4:3' | '21:9'

export interface NormalizedImageRequest {
	provider: ImageProviderName
	model: string
	resolution: ImageResolution
	quality: ImageQuality
	ratio: ImageRatio
	prompt: string
	images?: string[]
	output_image_count: number
	filter?: string
	imageCount: number
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
