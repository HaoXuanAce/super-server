import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

export class WxLoginDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(256)
	code!: string

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	nickname?: string

	@IsOptional()
	@IsUrl({ require_protocol: true })
	@MaxLength(2048)
	avatarUrl?: string
}
