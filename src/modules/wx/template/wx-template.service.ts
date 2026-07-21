import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Repository } from 'typeorm'
import { createWxPageResult } from '../common/wx-pagination.util'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import type { CreateWxTemplateDto } from './dto/create-wx-template.dto'
import type { QueryWxTemplatesDto } from './dto/query-wx-templates.dto'
import type { UpdateWxTemplateDto } from './dto/update-wx-template.dto'

@Injectable()
export class WxTemplateService {
	constructor(
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
	) {}

	async findAll(userId: string, query: QueryWxTemplatesDto) {
		const builder = this.templateRepository
			.createQueryBuilder('template')
			.where('template.deletedAt IS NULL')

		if (query.scope === 'mine') {
			builder.andWhere('template.ownerUserId = :userId', { userId })
		} else if (query.scope === 'system') {
			builder.andWhere(
				new Brackets((where) => {
					where
						.where('template.isSystem = :isSystem', {
							isSystem: true,
						})
						.orWhere('template.isPublic = :isPublic', {
							isPublic: true,
						})
				}),
			)
		} else {
			builder.andWhere(
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
		}

		if (query.keyword?.trim()) {
			builder.andWhere('template.name LIKE :keyword', {
				keyword: `%${query.keyword.trim()}%`,
			})
		}

		const [items, total] = await builder
			.orderBy('template.isSystem', 'DESC')
			.addOrderBy('template.createdAt', 'DESC')
			.skip((query.page - 1) * query.pageSize)
			.take(query.pageSize)
			.getManyAndCount()

		return createWxPageResult(items, total, query.page, query.pageSize)
	}

	findOne(userId: string, templateId: string): Promise<WxTemplateEntity> {
		return this.findAccessibleTemplate(userId, templateId)
	}

	create(userId: string, dto: CreateWxTemplateDto) {
		return this.templateRepository.save(
			this.templateRepository.create({
				ownerUserId: userId,
				name: dto.name.trim(),
				description: dto.description?.trim() || null,
				coverUrl: dto.coverUrl ?? null,
				content: dto.content,
				isSystem: false,
				isPublic: false,
			}),
		)
	}

	async update(
		userId: string,
		templateId: string,
		dto: UpdateWxTemplateDto,
	) {
		if (!Object.values(dto).some((value) => value !== undefined)) {
			throw new BadRequestException('至少需要提交一个模板修改项')
		}

		const template = await this.findOwnedTemplate(userId, templateId)
		if (dto.name !== undefined) template.name = dto.name.trim()
		if (dto.description !== undefined) {
			template.description = dto.description?.trim() || null
		}
		if (dto.coverUrl !== undefined) template.coverUrl = dto.coverUrl
		if (dto.content !== undefined) template.content = dto.content

		return this.templateRepository.save(template)
	}

	async remove(userId: string, templateId: string) {
		const template = await this.findOwnedTemplate(userId, templateId)
		await this.templateRepository.softRemove(template)
		return { id: templateId }
	}

	private async findAccessibleTemplate(
		userId: string,
		templateId: string,
	): Promise<WxTemplateEntity> {
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

		if (!template) throw new NotFoundException('模板不存在或无权访问')
		return template
	}

	private async findOwnedTemplate(
		userId: string,
		templateId: string,
	): Promise<WxTemplateEntity> {
		const template = await this.templateRepository.findOneBy({
			id: templateId,
			ownerUserId: userId,
		})
		if (!template || template.isSystem) {
			throw new NotFoundException('模板不存在或无权修改')
		}
		return template
	}
}
