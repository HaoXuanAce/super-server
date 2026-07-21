import { IsObject } from 'class-validator'
import type { WxJsonContent } from '../../common/wx-domain.types'

export class SubmitWxAnswerDto {
	@IsObject()
	answers!: WxJsonContent
}
