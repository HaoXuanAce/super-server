import {
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
	MaxLength,
} from 'class-validator'
import type { WxJsonContent } from '../../common/wx-domain.types'

export class CreateWxTemplateDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(191)
	name!: string

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string | null

	@IsOptional()
	@IsUrl({ require_protocol: true })
	@MaxLength(2048)
	coverUrl?: string | null

	@IsObject()
	content!: WxJsonContent
}
