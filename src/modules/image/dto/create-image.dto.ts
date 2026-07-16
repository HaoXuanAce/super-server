export type ImageModelType =
	| 'chatGTPImage2_low-1K'
	| 'chatGTPImage2_low-2K'
	| 'chatGTPImage2_low-4K'
	| 'chatGTPImage2_medium-1K'
	| 'chatGTPImage2_medium-2K'
	| 'chatGTPImage2_medium-4K'
	| 'chatGTPImage2_high-1K'
	| 'chatGTPImage2_high-2K'
	| 'chatGTPImage2_high-4K'
	| 'doubao-seedream-5-0-lite-250228'

export class CreateImageDto {
	model!: ImageModelType
	resolution!: '1k' | '2k' | '4k'
	ratio!: '16:9' | '9:16' | '1:1' | '3:4' | '4:3' | '21:9'
	prompt!: string
	images?: string[]
	output_image_count?: number
	filter!: string
}
