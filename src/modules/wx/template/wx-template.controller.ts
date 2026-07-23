import {
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { WxAuthenticatedRequest } from '../auth/wx-auth.types'
import { WxJwtAuthGuard } from '../auth/wx-jwt-auth.guard'
import { QueryWxTemplatesDto } from './dto/query-wx-templates.dto'
import { WxTemplateService } from './wx-template.service'

@Controller()
@UseGuards(WxJwtAuthGuard)
export class WxTemplateController {
	constructor(private readonly templateService: WxTemplateService) {}

	@Get()
	findAll(@Query() query: QueryWxTemplatesDto) {
		return this.templateService.findAll(query)
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
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.templateService.findOne(id)
	}

	@Delete(':id')
	remove(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.templateService.remove(request.user.id, id)
	}
}
