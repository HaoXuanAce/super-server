import { IsIn, IsOptional } from 'class-validator'
import { WxPaginationDto } from '../../common/dto/wx-pagination.dto'

const WX_ANSWER_SCOPES = ['submitted', 'received'] as const

export class QueryWxAnswersDto extends WxPaginationDto {
	@IsOptional()
	@IsIn(WX_ANSWER_SCOPES)
	scope: (typeof WX_ANSWER_SCOPES)[number] = 'submitted'
}
