import { Matches } from 'class-validator'

export class PhoneLoginDto {
	@Matches(/^\+?[1-9]\d{6,14}$/, { message: '手机号格式不正确' })
	phone!: string

	@Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
	code!: string
}
