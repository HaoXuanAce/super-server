import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

export class UpdateWxProfileDto {
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
