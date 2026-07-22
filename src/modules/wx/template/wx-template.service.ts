import {
	BadRequestException,
	HttpException,
	HttpStatus,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { Brackets, DataSource, In, Repository } from 'typeorm'
import { cloneWxJsonContent } from '../common/wx-json.util'
import { createWxPageResult } from '../common/wx-pagination.util'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WX_TEMPLATE_CATEGORY_OPTIONS } from '../wx.constants'
import type { CopyWxTemplateDto } from './dto/copy-wx-template.dto'
import type { CreateWxTemplateDto } from './dto/create-wx-template.dto'
import type { PublishWxTemplateDto } from './dto/publish-wx-template.dto'
import type { QueryWxTemplatesDto } from './dto/query-wx-templates.dto'
import type { UpdateWxTemplateDto } from './dto/update-wx-template.dto'

const DAILY_UPLOAD_LIMIT = 3

@Injectable()
export class WxTemplateService {
	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
	) {}

	getCategories() {
		return WX_TEMPLATE_CATEGORY_OPTIONS
	}

	async getUploadQuota(userId: number) {
		const used = await this.countTodayUploads(
			this.templateRepository,
			userId,
		)
		return {
			limit: DAILY_UPLOAD_LIMIT,
			used,
			remaining: Math.max(DAILY_UPLOAD_LIMIT - used, 0),
		}
	}

	async findAll(userId: number, query: QueryWxTemplatesDto) {
		const builder = this.templateRepository
			.createQueryBuilder('template')
			.where('template.deletedAt IS NULL')

		if (query.scope === 'mine') {
			builder.andWhere('template.ownerUserId = :userId', { userId })
		} else if (query.scope === 'library') {
			builder.andWhere('template.isPublic = :isPublic', {
				isPublic: true,
			})
		} else if (query.scope === 'system') {
			builder.andWhere('template.isSystem = :isSystem', {
				isSystem: true,
			})
		} else if (query.scope === 'public') {
			builder
				.andWhere('template.isPublic = :isPublic', { isPublic: true })
				.andWhere('template.isSystem = :isSystem', { isSystem: false })
		} else {
			builder.andWhere(
				new Brackets((where) => {
					where
						.where('template.ownerUserId = :userId', { userId })
						.orWhere('template.isPublic = :isPublic', {
							isPublic: true,
						})
				}),
			)
		}

		if (query.category) {
			builder.andWhere('template.category = :category', {
				category: query.category,
			})
		}

		if (query.keyword?.trim()) {
			builder.andWhere('template.name LIKE :keyword', {
				keyword: `%${query.keyword.trim()}%`,
			})
		}

		const [items, total] = await builder
			.orderBy('template.heat', 'DESC')
			.addOrderBy('template.isSystem', 'DESC')
			.addOrderBy('template.publishedAt', 'DESC')
			.addOrderBy('template.createdAt', 'DESC')
			.addOrderBy('template.id', 'DESC')
			.skip((query.page - 1) * query.pageSize)
			.take(query.pageSize)
			.getManyAndCount()

		return createWxPageResult(
			await this.withPublishers(items),
			total,
			query.page,
			query.pageSize,
		)
	}

	async findOne(userId: number, templateId: number) {
		const template = await this.findAccessibleTemplate(userId, templateId)
		return (await this.withPublishers([template]))[0]
	}

	create(userId: number, dto: CreateWxTemplateDto) {
		return this.templateRepository.save(
			this.templateRepository.create({
				ownerUserId: userId,
				presetKey: null,
				sourceTemplateId: null,
				name: dto.name.trim(),
				description: dto.description?.trim() || null,
				coverUrl: dto.coverUrl ?? null,
				content: dto.content,
				category: null,
				isSystem: false,
				isPublic: false,
				publishedAt: null,
				heat: 0,
			}),
		)
	}

	async copyToMine(
		userId: number,
		templateId: number,
		dto: CopyWxTemplateDto,
	) {
		const sourceTemplate = await this.findAccessibleTemplate(
			userId,
			templateId,
		)

		return this.dataSource.transaction(async (manager) => {
			const repository = manager.getRepository(WxTemplateEntity)
			const copiedTemplate = await repository.save(
				repository.create({
					ownerUserId: userId,
					presetKey: null,
					sourceTemplateId: sourceTemplate.id,
					name:
						dto.name?.trim() || `${sourceTemplate.name}（我的）`,
					description: sourceTemplate.description,
					coverUrl: sourceTemplate.coverUrl,
					content: cloneWxJsonContent(sourceTemplate.content),
					category: sourceTemplate.category,
					isSystem: false,
					isPublic: false,
					publishedAt: null,
					heat: 0,
				}),
			)

			if (sourceTemplate.isPublic) {
				await repository.increment({ id: sourceTemplate.id }, 'heat', 1)
			}

			return copiedTemplate
		})
	}

	async publish(
		userId: number,
		templateId: number,
		dto: PublishWxTemplateDto,
	) {
		return this.dataSource.transaction(async (manager) => {
			const user = await manager.findOne(WxUserEntity, {
				where: { id: userId },
				lock: { mode: 'pessimistic_write' },
			})
			if (!user) throw new NotFoundException('小程序用户不存在')

			const sourceTemplate = await manager.findOne(WxTemplateEntity, {
				where: { id: templateId, ownerUserId: userId },
			})
			if (
				!sourceTemplate ||
				sourceTemplate.isSystem ||
				sourceTemplate.isPublic
			) {
				throw new NotFoundException('只能上传自己的私人题库')
			}
			this.assertPublishable(sourceTemplate)

			const repository = manager.getRepository(WxTemplateEntity)
			const used = await this.countTodayUploads(repository, userId)
			if (used >= DAILY_UPLOAD_LIMIT) {
				throw new HttpException(
					'每天最多上传 3 套题库',
					HttpStatus.TOO_MANY_REQUESTS,
				)
			}

			const publicTemplate = await repository.save(
				repository.create({
					ownerUserId: userId,
					presetKey: null,
					sourceTemplateId: sourceTemplate.id,
					name: sourceTemplate.name,
					description: sourceTemplate.description,
					coverUrl: sourceTemplate.coverUrl,
					content: cloneWxJsonContent(sourceTemplate.content),
					category: dto.category,
					isSystem: false,
					isPublic: true,
					publishedAt: new Date(),
					heat: 0,
				}),
			)

			return {
				template: {
					...publicTemplate,
					publisher: this.toPublisher(user),
				},
				quota: {
					limit: DAILY_UPLOAD_LIMIT,
					used: used + 1,
					remaining: Math.max(DAILY_UPLOAD_LIMIT - used - 1, 0),
				},
			}
		})
	}

	async update(userId: number, templateId: number, dto: UpdateWxTemplateDto) {
		if (!Object.values(dto).some((value) => value !== undefined)) {
			throw new BadRequestException('至少需要提交一个模板修改项')
		}

		const template = await this.findOwnedTemplate(userId, templateId)
		if (template.isPublic) {
			throw new BadRequestException(
				'已上传的公开题库不能直接修改，请修改私人题库后重新上传',
			)
		}
		if (dto.name !== undefined) template.name = dto.name.trim()
		if (dto.description !== undefined) {
			template.description = dto.description?.trim() || null
		}
		if (dto.coverUrl !== undefined) template.coverUrl = dto.coverUrl
		if (dto.content !== undefined) template.content = dto.content

		return this.templateRepository.save(template)
	}

	async remove(userId: number, templateId: number) {
		const template = await this.findOwnedTemplate(userId, templateId)
		await this.templateRepository.softRemove(template)
		return { id: templateId }
	}

	private async findAccessibleTemplate(
		userId: number,
		templateId: number,
	): Promise<WxTemplateEntity> {
		const template = await this.templateRepository
			.createQueryBuilder('template')
			.where('template.id = :templateId', { templateId })
			.andWhere('template.deletedAt IS NULL')
			.andWhere(
				new Brackets((where) => {
					where
						.where('template.ownerUserId = :userId', { userId })
						.orWhere('template.isPublic = :isPublic', {
							isPublic: true,
						})
				}),
			)
			.getOne()

		if (!template) throw new NotFoundException('模板不存在或无权访问')
		return template
	}

	private async findOwnedTemplate(
		userId: number,
		templateId: number,
	): Promise<WxTemplateEntity> {
		const template = await this.templateRepository.findOneBy({
			id: templateId,
			ownerUserId: userId,
		})
		if (!template || template.isSystem) {
			throw new NotFoundException('模板不存在或无权操作')
		}
		return template
	}

	private async countTodayUploads(
		repository: Repository<WxTemplateEntity>,
		userId: number,
	): Promise<number> {
		const { start, end } = this.getTodayRange()
		return repository
			.createQueryBuilder('template')
			.withDeleted()
			.where('template.ownerUserId = :userId', { userId })
			.andWhere('template.isSystem = :isSystem', { isSystem: false })
			.andWhere('template.isPublic = :isPublic', { isPublic: true })
			.andWhere('template.publishedAt >= :start', { start })
			.andWhere('template.publishedAt < :end', { end })
			.getCount()
	}

	private getTodayRange() {
		const start = new Date()
		start.setHours(0, 0, 0, 0)
		const end = new Date(start)
		end.setDate(end.getDate() + 1)
		return { start, end }
	}

	private assertPublishable(template: WxTemplateEntity): void {
		const questions = template.content.questions
		if (!Array.isArray(questions) || questions.length === 0) {
			throw new BadRequestException('空题库不能上传')
		}
	}

	private async withPublishers(templates: WxTemplateEntity[]) {
		const publisherIds = [
			...new Set(
				templates
					.map((template) => template.ownerUserId)
					.filter((id): id is number => id !== null),
			),
		]
		if (publisherIds.length === 0) {
			return templates.map((template) => ({ ...template, publisher: null }))
		}

		const users = await this.userRepository.findBy({ id: In(publisherIds) })
		const userMap = new Map(users.map((user) => [user.id, user]))
		return templates.map((template) => ({
			...template,
			publisher: template.ownerUserId
				? this.toPublisher(userMap.get(template.ownerUserId) ?? null)
				: null,
		}))
	}

	private toPublisher(user: WxUserEntity | null) {
		return user
			? {
					id: user.id,
					nickname: user.nickname,
					avatarUrl: user.avatarUrl,
				}
			: null
	}
}
