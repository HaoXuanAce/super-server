import { Type } from 'class-transformer'
import {
	IsInt,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	MaxLength,
	Min,
} from 'class-validator'
import type { WxJsonContent } from '../../common/wx-domain.types'

export class CreateWxQuestionnaireDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	sourceTemplateId?: number

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
