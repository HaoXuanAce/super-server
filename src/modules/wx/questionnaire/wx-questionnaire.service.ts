import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
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
import type { CreateWxQuestionnaireDto } from './dto/create-wx-questionnaire.dto'
import type { QueryWxQuestionnairesDto } from './dto/query-wx-questionnaires.dto'
import type { SaveAsWxTemplateDto } from './dto/save-as-wx-template.dto'
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
	) {}

	async findAll(userId: string, query: QueryWxQuestionnairesDto) {
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
			.getRawMany<{ questionnaireId: string; answerCount: string }>()
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

	findOne(userId: string, questionnaireId: string) {
		return this.findOwnedQuestionnaire(userId, questionnaireId)
	}

	async create(userId: string, dto: CreateWxQuestionnaireDto) {
		const template = dto.sourceTemplateId
			? await this.findAccessibleTemplate(userId, dto.sourceTemplateId)
			: null
		const title = dto.title?.trim() || template?.name
		const content = dto.content ?? template?.content

		if (!title || !content) {
			throw new BadRequestException(
				'请选择一个模板，或同时提交问卷标题和内容',
			)
		}

		return this.questionnaireRepository.save(
			this.questionnaireRepository.create({
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
	}

	async update(
		userId: string,
		questionnaireId: string,
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

	async remove(userId: string, questionnaireId: string) {
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

	async saveAsTemplate(
		userId: string,
		questionnaireId: string,
		dto: SaveAsWxTemplateDto,
	) {
		const questionnaire = await this.findOwnedQuestionnaire(
			userId,
			questionnaireId,
		)

		return this.templateRepository.save(
			this.templateRepository.create({
				ownerUserId: userId,
				name: dto.name?.trim() || questionnaire.title,
				description:
					dto.description !== undefined
						? dto.description?.trim() || null
						: questionnaire.description,
				coverUrl: dto.coverUrl ?? null,
				content: questionnaire.content,
				isSystem: false,
				isPublic: false,
			}),
		)
	}

	async createShare(
		userId: string,
		questionnaireId: string,
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
		userId: string,
		questionnaireId: string,
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

	private async findAccessibleTemplate(userId: string, templateId: string) {
		const template = await this.templateRepository
			.createQueryBuilder('template')
			.where('template.id = :templateId', { templateId })
			.andWhere('template.deletedAt IS NULL')
			.andWhere(
				new Brackets((where) => {
					where
						.where('template.ownerUserId = :userId', { userId })
						.orWhere('template.isSystem = :isSystem', {
							isSystem: true,
						})
						.orWhere('template.isPublic = :isPublic', {
							isPublic: true,
						})
				}),
			)
			.getOne()

		if (!template) throw new NotFoundException('模板不存在或无权使用')
		return template
	}
}
