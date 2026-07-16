import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class PasswordLoginDto {
	@IsEmail()
	@MaxLength(191)
	email!: string

	@IsString()
	@MinLength(8)
	@MaxLength(72)
	password!: string
}
