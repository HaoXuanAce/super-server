import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
	@IsEmail()
	@MaxLength(191)
	email!: string

	@IsString()
	@MinLength(8)
	@MaxLength(72)
	@Matches(/[A-Za-z]/, { message: '密码必须包含字母' })
	@Matches(/\d/, { message: '密码必须包含数字' })
	password!: string
}
