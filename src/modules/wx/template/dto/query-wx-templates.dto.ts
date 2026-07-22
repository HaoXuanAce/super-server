import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { WxPaginationDto } from '../../common/dto/wx-pagination.dto'
import type { WxTemplateCategory } from '../../common/wx-domain.types'
import { WX_TEMPLATE_CATEGORIES } from '../../wx.constants'

const WX_TEMPLATE_SCOPES = [
	'all',
	'library',
	'system',
	'public',
	'mine',
] as const

export class QueryWxTemplatesDto extends WxPaginationDto {
	@IsOptional()
	@IsIn(WX_TEMPLATE_SCOPES)
	scope: (typeof WX_TEMPLATE_SCOPES)[number] = 'all'

	@IsOptional()
	@IsIn(WX_TEMPLATE_CATEGORIES)
	category?: WxTemplateCategory

	@IsOptional()
	@IsString()
	@MaxLength(191)
	keyword?: string
}
