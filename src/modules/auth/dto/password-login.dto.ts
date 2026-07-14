import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

export class PasswordLoginDto {
	@ApiProperty({ example: 'user@example.com' })
	@IsEmail()
	@MaxLength(191)
	email!: string

	@ApiProperty({ example: 'MySecurePassword123' })
	@IsString()
	@MinLength(8)
	@MaxLength(72)
	password!: string
}
