import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { createWxPageResult } from '../common/wx-pagination.util'
import {
	createWxShareExpiry,
	createWxShareToken,
} from '../common/wx-share.util'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import type { CreateWxShareDto } from '../share/dto/create-wx-share.dto'
import type { QueryWxAnswersDto } from './dto/query-wx-answers.dto'

@Injectable()
export class WxAnswerService {
	constructor(
		@InjectRepository(WxAnswerEntity)
		private readonly answerRepository: Repository<WxAnswerEntity>,
		@InjectRepository(WxShareEntity)
		private readonly shareRepository: Repository<WxShareEntity>,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
	) {}

	async findMine(userId: string, query: QueryWxAnswersDto) {
		const [items, total] = await this.answerRepository.findAndCount({
			where:
				query.scope === 'received'
					? { questionnaireOwnerUserId: userId }
					: { respondentUserId: userId },
			order: { submittedAt: 'DESC' },
			skip: (query.page - 1) * query.pageSize,
			take: query.pageSize,
		})
		return createWxPageResult(
			await this.withRespondents(items),
			total,
			query.page,
			query.pageSize,
		)
	}

	async findOne(userId: string, answerId: string) {
		const answer = await this.answerRepository.findOne({
			where: [
				{ id: answerId, respondentUserId: userId },
				{ id: answerId, questionnaireOwnerUserId: userId },
			],
		})
		if (!answer) throw new NotFoundException('答卷不存在或无权访问')
		return (await this.withRespondents([answer]))[0]
	}

	async createShare(userId: string, answerId: string, dto: CreateWxShareDto) {
		await this.findSubmittedAnswer(userId, answerId)

		return this.shareRepository.save(
			this.shareRepository.create({
				token: createWxShareToken(),
				type: 'answer',
				creatorUserId: userId,
				questionnaireId: null,
				answerId,
				expiresAt: createWxShareExpiry(dto.expiresInDays),
				revokedAt: null,
			}),
		)
	}

	private async findSubmittedAnswer(userId: string, answerId: string) {
		const answer = await this.answerRepository.findOneBy({
			id: answerId,
			respondentUserId: userId,
		})
		if (!answer) throw new NotFoundException('答卷不存在或无权分享')
		return answer
	}

	private async withRespondents(answers: WxAnswerEntity[]) {
		const respondentIds = [
			...new Set(answers.map((item) => item.respondentUserId)),
		]
		if (respondentIds.length === 0) return []
		const users = await this.userRepository.findBy({
			id: In(respondentIds),
		})
		const userMap = new Map(users.map((user) => [user.id, user]))

		return answers.map((answer) => {
			const respondent = userMap.get(answer.respondentUserId)
			return {
				...answer,
				respondent: respondent
					? {
							id: respondent.id,
							nickname: respondent.nickname,
							avatarUrl: respondent.avatarUrl,
						}
					: null,
			}
		})
	}
}
