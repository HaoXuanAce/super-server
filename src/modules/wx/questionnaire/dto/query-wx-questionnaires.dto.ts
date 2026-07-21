import { IsIn, IsOptional } from 'class-validator'
import { WxPaginationDto } from '../../common/dto/wx-pagination.dto'
import type { WxQuestionnaireStatus } from '../../common/wx-domain.types'
import { WX_QUESTIONNAIRE_STATUSES } from '../../wx.constants'

export class QueryWxQuestionnairesDto extends WxPaginationDto {
	@IsOptional()
	@IsIn(WX_QUESTIONNAIRE_STATUSES)
	status?: WxQuestionnaireStatus
}
