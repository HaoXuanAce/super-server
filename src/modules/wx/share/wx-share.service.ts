import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	GoneException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxQuestionnaireEntity } from '../entities/wx-questionnaire.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import type { SubmitWxAnswerDto } from './dto/submit-wx-answer.dto'

@Injectable()
export class WxShareService {
	constructor(
		@InjectRepository(WxShareEntity)
		private readonly shareRepository: Repository<WxShareEntity>,
		@InjectRepository(WxQuestionnaireEntity)
		private readonly questionnaireRepository: Repository<WxQuestionnaireEntity>,
		@InjectRepository(WxAnswerEntity)
		private readonly answerRepository: Repository<WxAnswerEntity>,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
	) {}

	async findByToken(userId: string, token: string) {
		const share = await this.findActiveShare(token)
		if (share.type === 'questionnaire') {
			return this.getSharedQuestionnaire(share)
		}

		return this.getSharedAnswer(userId, share)
	}

	async submitAnswer(
		userId: string,
		token: string,
		dto: SubmitWxAnswerDto,
	) {
		const share = await this.findActiveShare(token)
		if (share.type !== 'questionnaire' || !share.questionnaireId) {
			throw new BadRequestException('该分享链接不是问卷链接')
		}

		const questionnaire = await this.questionnaireRepository.findOneBy({
			id: share.questionnaireId,
			status: 'published',
		})
		if (!questionnaire) {
			throw new GoneException('问卷不存在或已停止收集')
		}
		if (questionnaire.ownerUserId === userId) {
			throw new BadRequestException('出题者不能提交自己的问卷')
		}

		const answer = this.answerRepository.create({
			questionnaireId: questionnaire.id,
			respondentUserId: userId,
			questionnaireOwnerUserId: questionnaire.ownerUserId,
			questionnaireSnapshot: {
				id: questionnaire.id,
				title: questionnaire.title,
				description: questionnaire.description,
				content: questionnaire.content,
				publishedAt: questionnaire.publishedAt,
			},
			answers: dto.answers,
		})

		try {
			return await this.answerRepository.save(answer)
		} catch (error) {
			if (this.isDuplicateEntryError(error)) {
				throw new ConflictException('你已经提交过该问卷')
			}
			throw error
		}
	}

	async revoke(userId: string, shareId: string) {
		const share = await this.shareRepository.findOneBy({
			id: shareId,
			creatorUserId: userId,
			revokedAt: IsNull(),
		})
		if (!share) throw new NotFoundException('分享记录不存在或无权撤销')

		share.revokedAt = new Date()
		await this.shareRepository.save(share)
		return { id: shareId }
	}

	private async getSharedQuestionnaire(share: WxShareEntity) {
		if (!share.questionnaireId) {
			throw new GoneException('分享的问卷已失效')
		}
		const questionnaire = await this.questionnaireRepository.findOneBy({
			id: share.questionnaireId,
			status: 'published',
		})
		if (!questionnaire) {
			throw new GoneException('问卷不存在或已停止收集')
		}
		const owner = await this.userRepository.findOneBy({
			id: questionnaire.ownerUserId,
		})

		return {
			share: this.toShareInfo(share),
			questionnaire,
			owner: owner
				? {
						id: owner.id,
						nickname: owner.nickname,
						avatarUrl: owner.avatarUrl,
					}
				: null,
		}
	}

	private async getSharedAnswer(userId: string, share: WxShareEntity) {
		if (!share.answerId) throw new GoneException('分享的答卷已失效')
		const answer = await this.answerRepository.findOneBy({ id: share.answerId })
		if (!answer) throw new GoneException('答卷不存在或已失效')
		if (
			userId !== answer.questionnaireOwnerUserId &&
			userId !== answer.respondentUserId
		) {
			throw new ForbiddenException('只有出题者和答题者可以查看该答卷')
		}
		const respondent = await this.userRepository.findOneBy({
			id: answer.respondentUserId,
		})

		return {
			share: this.toShareInfo(share),
			answer,
			respondent: respondent
				? {
						id: respondent.id,
						nickname: respondent.nickname,
						avatarUrl: respondent.avatarUrl,
					}
				: null,
		}
	}

	private async findActiveShare(token: string): Promise<WxShareEntity> {
		const share = await this.shareRepository.findOneBy({
			token,
			revokedAt: IsNull(),
		})
		if (!share) throw new NotFoundException('分享链接不存在或已撤销')
		if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
			throw new GoneException('分享链接已过期')
		}
		return share
	}

	private toShareInfo(share: WxShareEntity) {
		return {
			id: share.id,
			type: share.type,
			expiresAt: share.expiresAt,
			createdAt: share.createdAt,
		}
	}

	private isDuplicateEntryError(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			(error as { code?: string }).code === 'ER_DUP_ENTRY'
		)
	}
}
