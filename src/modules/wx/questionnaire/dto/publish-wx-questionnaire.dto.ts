import { IsIn } from 'class-validator'
import type { WxTemplateCategory } from '../../common/wx-domain.types'
import { WX_TEMPLATE_CATEGORIES } from '../../wx.constants'

export class PublishWxQuestionnaireDto {
	@IsIn(WX_TEMPLATE_CATEGORIES)
	category!: WxTemplateCategory
}
