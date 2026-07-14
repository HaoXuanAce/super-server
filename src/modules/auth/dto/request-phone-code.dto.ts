import { ApiProperty } from '@nestjs/swagger'
import { Matches } from 'class-validator'

export class RequestPhoneCodeDto {
	@ApiProperty({ example: '13800138000', description: '支持 E.164 格式手机号' })
	@Matches(/^\+?[1-9]\d{6,14}$/, { message: '手机号格式不正确' })
	phone!: string
}
