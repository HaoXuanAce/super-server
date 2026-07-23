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
import { CreateWxShareDto } from '../share/dto/create-wx-share.dto'
import { CreateWxQuestionnaireDto } from './dto/create-wx-questionnaire.dto'
import { PublishWxQuestionnaireDto } from './dto/publish-wx-questionnaire.dto'
import { QueryWxQuestionnairesDto } from './dto/query-wx-questionnaires.dto'
import { UpdateWxQuestionnaireDto } from './dto/update-wx-questionnaire.dto'
import { WxQuestionnaireService } from './wx-questionnaire.service'

@Controller()
@UseGuards(WxJwtAuthGuard)
export class WxQuestionnaireController {
	constructor(
		private readonly questionnaireService: WxQuestionnaireService,
	) {}

	@Get()
	findAll(
		@Req() request: WxAuthenticatedRequest,
		@Query() query: QueryWxQuestionnairesDto,
	) {
		return this.questionnaireService.findAll(request.user.id, query)
	}

	@Get(':id')
	findOne(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.questionnaireService.findOne(request.user.id, id)
	}

	@Post()
	create(
		@Req() request: WxAuthenticatedRequest,
		@Body() dto: CreateWxQuestionnaireDto,
	) {
		return this.questionnaireService.create(request.user.id, dto)
	}

	@Put(':id')
	update(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateWxQuestionnaireDto,
	) {
		return this.questionnaireService.update(request.user.id, id, dto)
	}

	@Delete(':id')
	remove(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.questionnaireService.remove(request.user.id, id)
	}

	@Post(':id/publish-to-library')
	publishToLibrary(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: PublishWxQuestionnaireDto,
	) {
		return this.questionnaireService.publishToLibrary(
			request.user.id,
			id,
			dto,
		)
	}

	@Post(':id/shares')
	createShare(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: CreateWxShareDto,
	) {
		return this.questionnaireService.createShare(
			request.user.id,
			id,
			dto,
		)
	}
}
