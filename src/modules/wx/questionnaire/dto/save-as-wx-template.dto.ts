import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

export class SaveAsWxTemplateDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(191)
	name?: string

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string | null

	@IsOptional()
	@IsUrl({ require_protocol: true })
	@MaxLength(2048)
	coverUrl?: string | null
}
