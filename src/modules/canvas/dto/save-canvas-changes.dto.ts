import { Type } from 'class-transformer'
import {
	IsArray,
	IsInt,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	Min,
	ValidateNested,
} from 'class-validator'

class CanvasPositionDto {
	@IsNumber({ allowNaN: false, allowInfinity: false })
	x!: number

	@IsNumber({ allowNaN: false, allowInfinity: false })
	y!: number
}

class CanvasNodeCreateDto {
	@IsString()
	id!: string

	@IsString()
	type!: string

	@ValidateNested()
	@Type(() => CanvasPositionDto)
	position!: CanvasPositionDto

	@IsObject()
	data!: object

	@IsOptional()
	@IsObject()
	style?: object | null

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	width?: number | null

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	height?: number | null
}

class CanvasNodeUpdateDto {
	@IsString()
	nodeId!: string

	@IsOptional()
	@IsString()
	type?: string

	@IsOptional()
	@ValidateNested()
	@Type(() => CanvasPositionDto)
	position?: CanvasPositionDto

	@IsOptional()
	@IsObject()
	data?: object

	@IsOptional()
	@IsObject()
	style?: object | null

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	width?: number | null

	@IsOptional()
	@IsNumber({ allowNaN: false, allowInfinity: false })
	height?: number | null
}

class CanvasEdgeCreateDto {
	@IsString()
	id!: string

	@IsString()
	source!: string

	@IsString()
	target!: string

	@IsOptional()
	@IsString()
	sourceHandle?: string | null

	@IsOptional()
	@IsString()
	targetHandle?: string | null

	@IsOptional()
	@IsString()
	type?: string | null

	@IsOptional()
	@IsObject()
	data?: object | null
}

class CanvasEdgeUpdateDto {
	@IsString()
	edgeId!: string

	@IsOptional()
	@IsString()
	source?: string

	@IsOptional()
	@IsString()
	target?: string

	@IsOptional()
	@IsString()
	sourceHandle?: string | null

	@IsOptional()
	@IsString()
	targetHandle?: string | null

	@IsOptional()
	@IsString()
	type?: string | null

	@IsOptional()
	@IsObject()
	data?: object | null
}

class CanvasNodeChangesDto {
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CanvasNodeCreateDto)
	create?: CanvasNodeCreateDto[]

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CanvasNodeUpdateDto)
	update?: CanvasNodeUpdateDto[]

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	delete?: string[]
}

class CanvasEdgeChangesDto {
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CanvasEdgeCreateDto)
	create?: CanvasEdgeCreateDto[]

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CanvasEdgeUpdateDto)
	update?: CanvasEdgeUpdateDto[]

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	delete?: string[]
}

export class SaveCanvasChangesDto {
	@IsInt()
	@Min(0)
	baseVersion!: number

	@IsOptional()
	@ValidateNested()
	@Type(() => CanvasNodeChangesDto)
	nodes?: CanvasNodeChangesDto

	@IsOptional()
	@ValidateNested()
	@Type(() => CanvasEdgeChangesDto)
	edges?: CanvasEdgeChangesDto
}
