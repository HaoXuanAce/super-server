import { Type } from 'class-transformer'
import {
	ArrayMaxSize,
	IsArray,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from 'class-validator'
import type {
	ImageProviderName,
	ImageQuality,
	ImageRatio,
	ImageResolution,
} from 'src/common/interface/image.interface'

const IMAGE_PROVIDERS: ImageProviderName[] = ['gpt', 'doubao']
const IMAGE_RESOLUTIONS: ImageResolution[] = ['1k', '2k', '4k']
const IMAGE_QUALITIES: ImageQuality[] = ['low', 'medium', 'high']
const IMAGE_RATIOS: ImageRatio[] = ['16:9', '9:16', '1:1', '3:4', '4:3', '21:9']

export class CreateImageDto {
	@IsIn(IMAGE_PROVIDERS)
	model!: ImageProviderName

	@IsIn(IMAGE_RESOLUTIONS)
	resolution!: ImageResolution

	@IsIn(IMAGE_QUALITIES)
	quality!: ImageQuality

	@IsIn(IMAGE_RATIOS)
	ratio!: ImageRatio

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
}
