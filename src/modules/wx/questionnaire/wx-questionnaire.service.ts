import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { cloneWxJsonContent } from '../common/wx-json.util'
import { createWxPageResult } from '../common/wx-pagination.util'
import {
	createWxShareExpiry,
	createWxShareToken,
} from '../common/wx-share.util'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxQuestionnaireEntity } from '../entities/wx-questionnaire.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import type { CreateWxShareDto } from '../share/dto/create-wx-share.dto'
import { WxTemplatePublishingService } from '../template/wx-template-publishing.service'
import type { CreateWxQuestionnaireDto } from './dto/create-wx-questionnaire.dto'
import type { PublishWxQuestionnaireDto } from './dto/publish-wx-questionnaire.dto'
import type { QueryWxQuestionnairesDto } from './dto/query-wx-questionnaires.dto'
import type { UpdateWxQuestionnaireDto } from './dto/update-wx-questionnaire.dto'

@Injectable()
export class WxQuestionnaireService {
	constructor(
		@InjectRepository(WxAnswerEntity)
		private readonly answerRepository: Repository<WxAnswerEntity>,
		@InjectRepository(WxQuestionnaireEntity)
		private readonly questionnaireRepository: Repository<WxQuestionnaireEntity>,
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
		@InjectRepository(WxShareEntity)
		private readonly shareRepository: Repository<WxShareEntity>,
		private readonly templatePublishingService: WxTemplatePublishingService,
	) {}

	async findAll(userId: number, query: QueryWxQuestionnairesDto) {
		const where = query.status
			? { ownerUserId: userId, status: query.status }
			: { ownerUserId: userId }
		const [items, total] = await this.questionnaireRepository.findAndCount({
			where,
			order: { updatedAt: 'DESC' },
			skip: (query.page - 1) * query.pageSize,
			take: query.pageSize,
		})

		if (items.length === 0) {
			return createWxPageResult(items, total, query.page, query.pageSize)
		}

		const answerCounts = await this.answerRepository
			.createQueryBuilder('answer')
			.select('answer.questionnaireId', 'questionnaireId')
			.addSelect('COUNT(answer.id)', 'answerCount')
			.where('answer.questionnaireId IN (:...questionnaireIds)', {
				questionnaireIds: items.map((item) => item.id),
			})
			.groupBy('answer.questionnaireId')
			.getRawMany<{ questionnaireId: number; answerCount: string }>()
		const answerCountMap = new Map(
			answerCounts.map((item) => [
				item.questionnaireId,
				Number(item.answerCount),
			]),
		)

		return createWxPageResult(
			items.map((item) => ({
				...item,
				answerCount: answerCountMap.get(item.id) ?? 0,
			})),
			total,
			query.page,
			query.pageSize,
		)
	}

	findOne(userId: number, questionnaireId: number) {
		return this.findOwnedQuestionnaire(userId, questionnaireId)
	}

	async create(userId: number, dto: CreateWxQuestionnaireDto) {
		const template = dto.sourceTemplateId
			? await this.findAccessibleTemplate(dto.sourceTemplateId)
			: null
		const title = dto.title?.trim() || template?.name
		const content =
			dto.content ??
			(template ? cloneWxJsonContent(template.content) : undefined)

		if (!title || !content) {
			throw new BadRequestException(
				'请选择一个模板，或同时提交问卷标题和内容',
			)
		}

		return this.questionnaireRepository.manager.transaction(
			async (manager) => {
				const questionnaireRepository =
					manager.getRepository(WxQuestionnaireEntity)
				const questionnaire = await questionnaireRepository.save(
					questionnaireRepository.create({
						ownerUserId: userId,
						sourceTemplateId: template?.id ?? null,
						title,
						description:
							dto.description !== undefined
								? dto.description?.trim() || null
								: (template?.description ?? null),
						content,
						status: 'draft',
						publishedAt: null,
					}),
				)

				if (template?.isPublic) {
					await manager
						.getRepository(WxTemplateEntity)
						.increment({ id: template.id }, 'heat', 1)
				}

				return questionnaire
			},
		)
	}

	async update(
		userId: number,
		questionnaireId: number,
		dto: UpdateWxQuestionnaireDto,
	) {
		if (!Object.values(dto).some((value) => value !== undefined)) {
			throw new BadRequestException('至少需要提交一个问卷修改项')
		}

		const questionnaire = await this.findOwnedQuestionnaire(
			userId,
			questionnaireId,
		)
		if (dto.title !== undefined) questionnaire.title = dto.title.trim()
		if (dto.description !== undefined) {
			questionnaire.description = dto.description?.trim() || null
		}
		if (dto.content !== undefined) questionnaire.content = dto.content
		if (dto.status !== undefined) {
			questionnaire.status = dto.status
			if (dto.status === 'draft') questionnaire.publishedAt = null
		}

		return this.questionnaireRepository.save(questionnaire)
	}

	async remove(userId: number, questionnaireId: number) {
		const questionnaire = await this.findOwnedQuestionnaire(
			userId,
			questionnaireId,
		)
		await this.questionnaireRepository.softRemove(questionnaire)
		await this.shareRepository.update(
			{ questionnaireId, creatorUserId: userId },
			{ revokedAt: new Date() },
		)
		return { id: questionnaireId }
	}

	async publishToLibrary(
		userId: number,
		questionnaireId: number,
		dto: PublishWxQuestionnaireDto,
	) {
		const questionnaire = await this.findOwnedQuestionnaire(
			userId,
			questionnaireId,
		)

		return this.templatePublishingService.publishSnapshot(userId, {
			sourceTemplateId: questionnaire.sourceTemplateId,
			name: questionnaire.title,
			description: questionnaire.description,
			content: questionnaire.content,
			category: dto.category,
		})
	}

	async createShare(
		userId: number,
		questionnaireId: number,
		dto: CreateWxShareDto,
	) {
		const questionnaire = await this.findOwnedQuestionnaire(
			userId,
			questionnaireId,
		)
		if (questionnaire.status === 'closed') {
			throw new BadRequestException('已关闭的问卷不能分享')
		}

		if (questionnaire.status !== 'published') {
			questionnaire.status = 'published'
			questionnaire.publishedAt = new Date()
			await this.questionnaireRepository.save(questionnaire)
		}

		return this.shareRepository.save(
			this.shareRepository.create({
				token: createWxShareToken(),
				type: 'questionnaire',
				creatorUserId: userId,
				questionnaireId,
				answerId: null,
				expiresAt: createWxShareExpiry(dto.expiresInDays),
				revokedAt: null,
			}),
		)
	}

	private async findOwnedQuestionnaire(
		userId: number,
		questionnaireId: number,
	): Promise<WxQuestionnaireEntity> {
		const questionnaire = await this.questionnaireRepository.findOneBy({
			id: questionnaireId,
			ownerUserId: userId,
		})
		if (!questionnaire) {
			throw new NotFoundException('问卷不存在或无权访问')
		}
		return questionnaire
	}

	private async findAccessibleTemplate(templateId: number) {
		const template = await this.templateRepository
			.createQueryBuilder('template')
			.where('template.id = :templateId', { templateId })
			.andWhere('template.deletedAt IS NULL')
			.andWhere('template.isPublic = :isPublic', { isPublic: true })
			.getOne()

		if (!template) throw new NotFoundException('模板不存在或无权使用')
		return template
	}
}
