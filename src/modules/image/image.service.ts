import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { randomUUID } from 'node:crypto'
import type {
	ImageGenerateResult,
	ImagePollResult,
	ImageProviderName,
	NormalizedImageRequest,
} from 'src/common/interface/image.interface'
import type { TaskEntity } from '../task/entities/task.entity'
import { TaskService } from '../task/task.service'
import type { CreateImageDto } from './dto/create-image.dto'
import { ImageQueueService } from './image-queue.service'

@Injectable()
export class ImageService {
	private readonly logger = new Logger(ImageService.name)

	constructor(
		private readonly configService: ConfigService,
		private readonly taskService: TaskService,
		private readonly imageQueueService: ImageQueueService,
	) {}

	async submit(userId: string, dto: CreateImageDto) {
		if (dto.clientRequestId) {
			const existingTask = await this.taskService.findByClientRequestId(
				userId,
				dto.clientRequestId,
			)
			if (existingTask) {
				return this.toSubmitResult(existingTask, true)
			}
		}

		const request = this.normalizeRequest(dto)
		const price = this.calculatePrice(dto)
		const taskId = randomUUID()
		let taskCreated = false

		// TODO: 改成真实事务：锁定用户余额、扣费、写流水、创建任务和 outbox。
		await this.chargeBalance(userId, taskId, price.amount)

		try {
			const task = await this.taskService.create({
				id: taskId,
				type: 'image',
				userId,
				provider: request.provider,
				model: request.model,
				input: request,
				chargeAmount: price.amount,
				pricingSnapshot: price.snapshot,
				clientRequestId: dto.clientRequestId,
			})
			taskCreated = true

			await this.taskService.update(taskId, { billingStatus: 'charged' })
			await this.imageQueueService.enqueue(taskId)

			return this.toSubmitResult(task, false)
		} catch (error) {
			const reason =
				error instanceof Error ? error.message : '任务创建或入队失败'

			try {
				await this.refundBalance(userId, taskId, price.amount, reason)
				if (taskCreated) {
					await this.taskService.update(taskId, {
						status: 'failed',
						billingStatus: 'refunded',
						errorMessage: reason,
						refundedAt: new Date(),
					})
				}
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
		const task = await this.taskService.find(taskId)
		if (task.status === 'completed' || task.billingStatus === 'refunded') {
			return
		}

		await this.taskService.update(taskId, {
			status: 'failed',
			errorMessage,
			result: result ?? task.result,
		})

		if (task.billingStatus !== 'charged' || !task.userId) {
			return
		}

		await this.refundBalance(
			task.userId,
			taskId,
			task.chargeAmount,
			errorMessage,
		)
		await this.taskService.update(taskId, {
			billingStatus: 'refunded',
			refundedAt: new Date(),
		})
	}

	private normalizeRequest(dto: CreateImageDto): NormalizedImageRequest {
		if (dto.model.startsWith('chatGTPImage2')) {
			return {
				provider: 'gpt',
				model: dto.model,
				payload: {
					model: dto.model,
					prompt: dto.prompt,
					images: dto.images,
					metadata: {
						aspect_ratio: dto.ratio,
						enhance_prompt: 'Enabled',
						output_image_count: String(dto.output_image_count),
					},
				},
			}
		}

		if (dto.model.startsWith('doubao')) {
			return {
				provider: 'doubao',
				model: dto.model,
				payload: {
					model: dto.model,
					prompt: dto.prompt,
					size: dto.resolution,
					aspectRatio: dto.ratio,
					imageUrls: dto.images ?? [],
					count: dto.output_image_count,
				},
			}
		}

		throw new BadRequestException(`不支持的图片模型：${dto.model}`)
	}

	private calculatePrice(dto: CreateImageDto) {
		const unitPriceMap: Record<string, number> = {
			chatGTPImage2_low: 100,
			chatGTPImage2_medium: 200,
			chatGTPImage2_high: 300,
			doubao: 150,
		}
		const priceKey = Object.keys(unitPriceMap).find((key) =>
			dto.model.startsWith(key),
		)
		const unitPriceCents = priceKey ? unitPriceMap[priceKey] : 100
		const amountCents = unitPriceCents * dto.output_image_count

		console.log('[ImageService] 模拟计算价格', {
			model: dto.model,
			unitPriceCents,
			amountCents,
		})

		return {
			amount: (amountCents / 100).toFixed(2),
			snapshot: {
				model: dto.model,
				resolution: dto.resolution,
				outputImageCount: dto.output_image_count,
				unitPriceCents,
			},
		}
	}

	private chargeBalance(
		userId: string,
		taskId: string,
		amount: string,
	): Promise<void> {
		// TODO: 校验余额并原子扣除 users.balance，同时写 balance_ledger。
		console.log('[ImageService] 模拟余额校验和扣费', {
			userId,
			taskId,
			amount,
		})
		return Promise.resolve()
	}

	private refundBalance(
		userId: string,
		taskId: string,
		amount: string,
		reason: string,
	): Promise<void> {
		// TODO: 通过账务流水唯一约束实现幂等退款。
		console.log('[ImageService] 模拟退款', {
			userId,
			taskId,
			amount,
			reason,
		})
		return Promise.resolve()
	}

	private async generateWithGpt(
		request: NormalizedImageRequest,
	): Promise<ImageGenerateResult> {
		const url =
			this.configService.getOrThrow<string>('JDTS-baseUrl') +
			this.configService.getOrThrow<string>('JDTS-imageUrl')
		const response = await axios.post(url, request.payload, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.configService.getOrThrow<string>('JDTS-apiKey')}`,
			},
		})
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
		console.log('[ImageService] 模拟豆包图片请求', request.payload)

		return Promise.resolve({
			status: 'completed',
			result: {
				id: `doubao_mock_${Date.now()}`,
				url: 'https://placeholder.example/doubao-output.png',
			},
		})
	}

	private toSubmitResult(task: TaskEntity, idempotent: boolean) {
		return {
			taskId: task.id,
			status: task.status,
			provider: task.provider,
			chargedAmount: task.chargeAmount,
			currency: 'CNY',
			idempotent,
		}
	}
}
