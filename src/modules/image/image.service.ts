import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectDataSource } from '@nestjs/typeorm'
import axios from 'axios'
import { randomUUID } from 'node:crypto'
import type {
	ImageGenerateResult,
	ImagePollResult,
	ImageProviderName,
	NormalizedImageRequest,
} from 'src/common/interface/image.interface'
import { DataSource, MoreThanOrEqual, Not } from 'typeorm'
import { TaskEntity } from '../task/entities/task.entity'
import { UserEntity } from '../user/entities/user.entity'
import type { CreateImageDto } from './dto/create-image.dto'
import { BalanceLedgerEntity } from './entities/balance-ledger.entity'
import { ImageQueueService } from './image-queue.service'

@Injectable()
export class ImageService {
	private readonly logger = new Logger(ImageService.name)

	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
		private readonly configService: ConfigService,
		private readonly imageQueueService: ImageQueueService,
	) {}

	async submit(userId: string, dto: CreateImageDto) {
		const normalizeData = this.normalizeParams(dto)
		const price = this.calculatePrice(normalizeData)
		const taskId = randomUUID()

		const task = await this.dataSource.transaction(async (manager) => {
			const userRepository = manager.getRepository(UserEntity)
			const deduction = await userRepository.decrement(
				{
					id: userId,
					balance: MoreThanOrEqual(String(price)),
				},
				'balance',
				price,
			)

			if (deduction.affected !== 1) {
				throw new BadRequestException('余额不足')
			}

			const user = await userRepository.findOneBy({ id: userId })
			if (!user) {
				throw new BadRequestException('用户不存在')
			}

			const balanceAfter = Number(user.balance)
			const balanceBefore = balanceAfter + price

			await manager.save(BalanceLedgerEntity, {
				userId,
				type: 'image_charge',
				amount: String(price),
				balanceBefore: String(balanceBefore),
				balanceAfter: String(balanceAfter),
				referenceType: 'image_task',
				referenceId: taskId,
				reason: null,
			})

			return manager.save(
				manager.create(TaskEntity, {
					id: taskId,
					type: 'image',
					status: 'pending',
					userId,
					provider: normalizeData.provider,
					model: normalizeData.model,
					input: normalizeData,
					chargeAmount: price,
					billingStatus: 'charged',
					pricingSnapshot: {
						price,
						model: normalizeData.model,
						resolution: normalizeData.resolution,
						quality: normalizeData.quality,
						imageCount: normalizeData.imageCount,
						outputImageCount: normalizeData.output_image_count,
					},
					providerTaskId: null,
					result: null,
					errorMessage: null,
					refundedAt: null,
				}),
			)
		})

		try {
			await this.imageQueueService.enqueue(taskId)
		} catch (error) {
			const reason =
				error instanceof Error ? error.message : '任务创建或入队失败'

			try {
				await this.failTaskAndRefund(taskId, `队列投递失败：${reason}`)
			} catch (refundError) {
				this.logger.error(
					`提交失败后的退款处理失败: ${taskId}`,
					refundError instanceof Error
						? refundError.stack
						: String(refundError),
				)
			}

			throw error
		}

		return this.toSubmitResult(task)
	}

	normalizeParams(oldParams: CreateImageDto): NormalizedImageRequest {
		let model: string
		if (oldParams.model === 'gpt') {
			model = `chatGTPImage2_${oldParams.quality}-${oldParams.resolution.toUpperCase()}`
		} else {
			model = 'doubao-seedream-5-0-lite-250228'
		}

		const matches = oldParams.prompt.match(/\{\{Image\d+\}\}/g) || []

		return {
			...oldParams,
			provider: oldParams.model,
			model,
			imageCount: matches.length,
		}
	}

	calculatePrice(normalizeData: NormalizedImageRequest): number {
		const { model, resolution, quality, imageCount, output_image_count } =
			normalizeData

		if (model.startsWith('chatGTP')) {
			const priceTable = {
				'1k': {
					low: 0.05,
					medium: 0.4,
					high: 1.6,
				},
				'2k': {
					low: 0.09,
					medium: 0.8,
					high: 3.2,
				},
				'4k': {
					low: 0.15,
					medium: 1.4,
					high: 5.4,
				},
			}

			const basePrice = priceTable[resolution][quality]
			const price = Math.round(
				(basePrice + 0.1 * imageCount + 0.02) *
					100 *
					output_image_count,
			)

			return price
		}

		throw new BadRequestException('豆包模型暂未配置价格')
	}

	create(request: NormalizedImageRequest): Promise<ImageGenerateResult> {
		if (request.provider === 'gpt') {
			return this.generateWithGpt(request)
		}

		return this.generateWithDoubao(request)
	}

	pollTask(
		provider: ImageProviderName,
		providerTaskId: string,
	): Promise<ImagePollResult> {
		if (provider === 'gpt') {
			return this.pollGptTask(providerTaskId)
		}

		throw new BadRequestException(`图片供应商 ${provider} 不需要轮询`)
	}

	async failTaskAndRefund(
		taskId: string,
		errorMessage: string,
		result?: object,
	): Promise<void> {
		await this.dataSource.transaction(async (manager) => {
			const taskRepository = manager.getRepository(TaskEntity)
			const userRepository = manager.getRepository(UserEntity)
			const task = await taskRepository.findOneBy({ id: taskId })
			if (!task) {
				throw new BadRequestException('任务不存在')
			}

			if (
				task.status === 'completed' ||
				task.billingStatus === 'refunded'
			) {
				return
			}

			if (task.billingStatus !== 'charged' || !task.userId) {
				await taskRepository.update(taskId, {
					status: 'failed',
					errorMessage,
					result: result ?? task.result,
				})
				return
			}

			const refundAmount = Number(task.chargeAmount)
			if (!Number.isFinite(refundAmount)) {
				throw new Error('退款金额格式错误')
			}

			const refundedAt = new Date()
			const claim = await taskRepository.update(
				{
					id: taskId,
					billingStatus: 'charged',
					status: Not('completed'),
				},
				{
					status: 'failed',
					billingStatus: 'refunded',
					errorMessage,
					result: result ?? task.result,
					refundedAt,
				},
			)

			if (claim.affected !== 1) {
				return
			}

			const credit = await userRepository.increment(
				{ id: task.userId },
				'balance',
				refundAmount,
			)

			if (credit.affected !== 1) {
				throw new BadRequestException('退款用户不存在')
			}

			const user = await userRepository.findOneBy({ id: task.userId })
			if (!user) {
				throw new BadRequestException('退款用户不存在')
			}

			const balanceAfter = Number(user.balance)
			const balanceBefore = balanceAfter - refundAmount

			await manager.save(BalanceLedgerEntity, {
				userId: task.userId,
				type: 'image_refund',
				amount: String(refundAmount),
				balanceBefore: String(balanceBefore),
				balanceAfter: String(balanceAfter),
				referenceType: 'image_task',
				referenceId: taskId,
				reason: errorMessage.slice(0, 191),
			})
		})
	}

	private async generateWithGpt(
		request: NormalizedImageRequest,
	): Promise<ImageGenerateResult> {
		const url =
			this.configService.getOrThrow<string>('JDTS-baseUrl') +
			this.configService.getOrThrow<string>('JDTS-imageUrl')
		const response = await axios.post(
			url,
			{
				model: request.model,
				prompt: request.prompt,
				images: request.images,
				metadata: {
					aspect_ratio: request.ratio,
					enhance_prompt: 'Enabled',
					output_image_count: String(request.output_image_count),
				},
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.configService.getOrThrow<string>('JDTS-apiKey')}`,
				},
			},
		)
		const providerTaskId = response.data.data?.[0]?.task_id as
			string | undefined

		if (!providerTaskId) {
			throw new BadRequestException('图片生成任务创建失败')
		}

		return { status: 'processing', providerTaskId }
	}

	private async pollGptTask(
		providerTaskId: string,
	): Promise<ImagePollResult> {
		const url =
			this.configService.getOrThrow<string>('JDTS-baseUrl') +
			this.configService.getOrThrow<string>('JDTS-imagePoll')
		const response = await axios.post(
			url,
			{ task_id: providerTaskId },
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.configService.getOrThrow<string>('JDTS-apiKey')}`,
				},
			},
		)
		const result = response.data.data

		return {
			status:
				result.status === 'failed'
					? 'failed'
					: result.url
						? 'completed'
						: 'processing',
			providerTaskId: result.task_id,
			url: result.url,
			result,
		}
	}

	private generateWithDoubao(
		request: NormalizedImageRequest,
	): Promise<ImageGenerateResult> {
		// TODO: 在这里替换成真实豆包图片接口请求。
		console.log('[ImageService] 模拟豆包图片请求', request)

		return Promise.resolve({
			status: 'completed',
			result: {
				id: `doubao_mock_${Date.now()}`,
				url: 'https://placeholder.example/doubao-output.png',
			},
		})
	}

	private toSubmitResult(task: TaskEntity) {
		return {
			taskId: task.id,
			status: task.status,
			provider: task.provider,
			chargedAmount: task.chargeAmount,
			currency: 'CNY',
		}
	}
}
