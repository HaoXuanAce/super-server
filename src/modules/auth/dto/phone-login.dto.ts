import { ApiProperty } from '@nestjs/swagger'
import { Matches } from 'class-validator'

export class PhoneLoginDto {
	@ApiProperty({ example: '13800138000' })
	@Matches(/^\+?[1-9]\d{6,14}$/, { message: '手机号格式不正确' })
	phone!: string

	@ApiProperty({ example: '123456' })
	@Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
	code!: string
}
