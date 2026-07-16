import { Matches } from 'class-validator'

export class RequestPhoneCodeDto {
	@Matches(/^\+?[1-9]\d{6,14}$/, { message: '手机号格式不正确' })
	phone!: string
}
