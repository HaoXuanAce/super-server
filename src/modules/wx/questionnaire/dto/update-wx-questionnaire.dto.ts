import {
	IsIn,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator'
import type {
	WxJsonContent,
	WxQuestionnaireStatus,
} from '../../common/wx-domain.types'

const WX_EDITABLE_QUESTIONNAIRE_STATUSES = ['draft', 'closed'] as const

export class UpdateWxQuestionnaireDto {
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

	@IsOptional()
	@IsIn(WX_EDITABLE_QUESTIONNAIRE_STATUSES)
	status?: Extract<WxQuestionnaireStatus, 'draft' | 'closed'>
}
