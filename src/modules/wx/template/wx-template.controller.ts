import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Put,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { WxAuthenticatedRequest } from '../auth/wx-auth.types'
import { WxJwtAuthGuard } from '../auth/wx-jwt-auth.guard'
import { CopyWxTemplateDto } from './dto/copy-wx-template.dto'
import { CreateWxTemplateDto } from './dto/create-wx-template.dto'
import { PublishWxTemplateDto } from './dto/publish-wx-template.dto'
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

	@Get('categories')
	getCategories() {
		return this.templateService.getCategories()
	}

	@Get('upload-quota')
	getUploadQuota(@Req() request: WxAuthenticatedRequest) {
		return this.templateService.getUploadQuota(request.user.id)
	}

	@Get(':id')
	findOne(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
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

	@Post(':id/copy')
	copyToMine(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: CopyWxTemplateDto,
	) {
		return this.templateService.copyToMine(request.user.id, id, dto)
	}

	@Post(':id/publish')
	publish(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: PublishWxTemplateDto,
	) {
		return this.templateService.publish(request.user.id, id, dto)
	}

	@Put(':id')
	update(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateWxTemplateDto,
	) {
		return this.templateService.update(request.user.id, id, dto)
	}

	@Delete(':id')
	remove(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.templateService.remove(request.user.id, id)
	}
}
