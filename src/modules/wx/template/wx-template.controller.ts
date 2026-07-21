import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Put,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { WxAuthenticatedRequest } from '../auth/wx-auth.types'
import { WxJwtAuthGuard } from '../auth/wx-jwt-auth.guard'
import { CreateWxTemplateDto } from './dto/create-wx-template.dto'
import { QueryWxTemplatesDto } from './dto/query-wx-templates.dto'
import { UpdateWxTemplateDto } from './dto/update-wx-template.dto'
import { WxTemplateService } from './wx-template.service'

@Controller()
@UseGuards(WxJwtAuthGuard)
export class WxTemplateController {
	constructor(private readonly templateService: WxTemplateService) {}

	@Get()
	findAll(
		@Req() request: WxAuthenticatedRequest,
		@Query() query: QueryWxTemplatesDto,
	) {
		return this.templateService.findAll(request.user.id, query)
	}

	@Get(':id')
	findOne(
		@Req() request: WxAuthenticatedRequest,
		@Param('id') id: string,
	) {
		return this.templateService.findOne(request.user.id, id)
	}

	@Post()
	create(
		@Req() request: WxAuthenticatedRequest,
		@Body() dto: CreateWxTemplateDto,
	) {
		return this.templateService.create(request.user.id, dto)
	}

	@Put(':id')
	update(
		@Req() request: WxAuthenticatedRequest,
		@Param('id') id: string,
		@Body() dto: UpdateWxTemplateDto,
	) {
		return this.templateService.update(request.user.id, id, dto)
	}

	@Delete(':id')
	remove(
		@Req() request: WxAuthenticatedRequest,
		@Param('id') id: string,
	) {
		return this.templateService.remove(request.user.id, id)
	}
}
