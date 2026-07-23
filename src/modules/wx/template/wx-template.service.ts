import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { createWxPageResult } from '../common/wx-pagination.util'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WX_TEMPLATE_CATEGORY_OPTIONS } from '../wx.constants'
import type { QueryWxTemplatesDto } from './dto/query-wx-templates.dto'
import { WxTemplatePublishingService } from './wx-template-publishing.service'

@Injectable()
export class WxTemplateService {
	constructor(
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
		private readonly templatePublishingService: WxTemplatePublishingService,
	) {}

	getCategories() {
		return WX_TEMPLATE_CATEGORY_OPTIONS
	}

	getUploadQuota(userId: number) {
		return this.templatePublishingService.getUploadQuota(userId)
	}

	async findAll(query: QueryWxTemplatesDto) {
		const builder = this.templateRepository
			.createQueryBuilder('template')
			.where('template.deletedAt IS NULL')

		if (query.scope === 'system') {
			builder.andWhere('template.isSystem = :isSystem', { isSystem: true })
		} else {
			builder.andWhere('template.isPublic = :isPublic', { isPublic: true })
			if (query.scope === 'public') {
				builder.andWhere('template.isSystem = :isSystem', {
					isSystem: false,
				})
			}
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

	async findOne(templateId: number) {
		const template = await this.templateRepository.findOneBy({
			id: templateId,
			isPublic: true,
		})
		if (!template) throw new NotFoundException('题库不存在或已下架')
		return (await this.withPublishers([template]))[0]
	}

	async remove(userId: number, templateId: number) {
		const template = await this.templateRepository.findOneBy({
			id: templateId,
			ownerUserId: userId,
			isPublic: true,
			isSystem: false,
		})
		if (!template) {
			throw new NotFoundException('公开题库不存在或无权操作')
		}
		await this.templateRepository.softRemove(template)
		return { id: templateId }
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
