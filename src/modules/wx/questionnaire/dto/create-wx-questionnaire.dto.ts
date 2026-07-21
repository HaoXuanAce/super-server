import {
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
} from 'class-validator'
import type { WxJsonContent } from '../../common/wx-domain.types'

export class CreateWxQuestionnaireDto {
	@IsOptional()
	@IsUUID()
	sourceTemplateId?: string

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(191)
	title?: string

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string | null

	@IsOptional()
	@IsObject()
	content?: WxJsonContent
}
