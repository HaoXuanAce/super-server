import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { HOT_IMAGE_QUERY_TYPES } from '../hot-image.types'

export class QueryHotImagesDto {
	@IsOptional()
	@IsIn(HOT_IMAGE_QUERY_TYPES)
	type?: (typeof HOT_IMAGE_QUERY_TYPES)[number]

	@IsOptional()
	@IsString()
	@MaxLength(191)
	keyword?: string

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page = 1

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	pageSize = 20
}
