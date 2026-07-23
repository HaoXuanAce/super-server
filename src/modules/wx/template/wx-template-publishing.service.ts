import {
	BadRequestException,
	HttpException,
	HttpStatus,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { cloneWxJsonContent } from '../common/wx-json.util'
import type {
	WxJsonContent,
	WxTemplateCategory,
} from '../common/wx-domain.types'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxUserEntity } from '../entities/wx-user.entity'

const DAILY_UPLOAD_LIMIT = 3

interface PublishWxTemplateSnapshotInput {
	sourceTemplateId: number | null
	name: string
	description: string | null
	coverUrl?: string | null
	content: WxJsonContent
	category: WxTemplateCategory
}

@Injectable()
export class WxTemplatePublishingService {
	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
	) {}

	async getUploadQuota(userId: number) {
		const used = await this.countTodayUploads(
			this.dataSource.getRepository(WxTemplateEntity),
			userId,
		)
		return this.createQuota(used)
	}

	async publishSnapshot(
		userId: number,
		input: PublishWxTemplateSnapshotInput,
	) {
		this.assertPublishable(input.content)

		return this.dataSource.transaction(async (manager) => {
			const user = await manager.findOne(WxUserEntity, {
				where: { id: userId },
				lock: { mode: 'pessimistic_write' },
			})
			if (!user) throw new NotFoundException('小程序用户不存在')

			const repository = manager.getRepository(WxTemplateEntity)
			const used = await this.countTodayUploads(repository, userId)
			if (used >= DAILY_UPLOAD_LIMIT) {
				throw new HttpException(
					'每天最多上传 3 套题库',
					HttpStatus.TOO_MANY_REQUESTS,
				)
			}

			const template = await repository.save(
				repository.create({
					ownerUserId: userId,
					presetKey: null,
					sourceTemplateId: input.sourceTemplateId,
					name: input.name.trim(),
					description: input.description?.trim() || null,
					coverUrl: input.coverUrl ?? null,
					content: cloneWxJsonContent(input.content),
					category: input.category,
					isSystem: false,
					isPublic: true,
					publishedAt: new Date(),
					heat: 0,
				}),
			)

			return {
				template: {
					...template,
					publisher: {
						id: user.id,
						nickname: user.nickname,
						avatarUrl: user.avatarUrl,
					},
				},
				quota: this.createQuota(used + 1),
			}
		})
	}

	private createQuota(used: number) {
		return {
			limit: DAILY_UPLOAD_LIMIT,
			used,
			remaining: Math.max(DAILY_UPLOAD_LIMIT - used, 0),
		}
	}

	private async countTodayUploads(
		repository: Repository<WxTemplateEntity>,
		userId: number,
	): Promise<number> {
		const start = new Date()
		start.setHours(0, 0, 0, 0)
		const end = new Date(start)
		end.setDate(end.getDate() + 1)

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

	private assertPublishable(content: WxJsonContent): void {
		if (!Array.isArray(content.questions) || content.questions.length === 0) {
			throw new BadRequestException('空试卷不能上传到题库广场')
		}
	}
}
