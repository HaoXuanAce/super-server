import { Type } from 'class-transformer'
import {
	ArrayMaxSize,
	IsArray,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min,
} from 'class-validator'

export const IMAGE_MODEL_TYPES = [
	'chatGTPImage2_low-1K',
	'chatGTPImage2_low-2K',
	'chatGTPImage2_low-4K',
	'chatGTPImage2_medium-1K',
	'chatGTPImage2_medium-2K',
	'chatGTPImage2_medium-4K',
	'chatGTPImage2_high-1K',
	'chatGTPImage2_high-2K',
	'chatGTPImage2_high-4K',
	'doubao-seedream-5-0-lite-250228',
] as const

export type ImageModelType = (typeof IMAGE_MODEL_TYPES)[number]

export class CreateImageDto {
	@IsIn(IMAGE_MODEL_TYPES)
	model!: ImageModelType

	@IsIn(['1k', '2k', '4k'])
	resolution!: '1k' | '2k' | '4k'

	@IsIn(['16:9', '9:16', '1:1', '3:4', '4:3', '21:9'])
	ratio!: '16:9' | '9:16' | '1:1' | '3:4' | '4:3' | '21:9'

	@IsString()
	@MaxLength(4000)
	prompt!: string

	@IsOptional()
	@IsArray()
	@ArrayMaxSize(10)
	@IsString({ each: true })
	images?: string[]

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(4)
	output_image_count = 1

	@IsOptional()
	@IsString()
	@MaxLength(128)
	filter?: string

	@IsOptional()
	@IsUUID()
	clientRequestId?: string
}
