import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { WxPaginationDto } from '../../common/dto/wx-pagination.dto'

const WX_TEMPLATE_SCOPES = ['all', 'system', 'mine'] as const

export class QueryWxTemplatesDto extends WxPaginationDto {
	@IsOptional()
	@IsIn(WX_TEMPLATE_SCOPES)
	scope: (typeof WX_TEMPLATE_SCOPES)[number] = 'all'

	@IsOptional()
	@IsString()
	@MaxLength(191)
	keyword?: string
}
