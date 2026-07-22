import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CopyWxTemplateDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	@MaxLength(191)
	name?: string
}
