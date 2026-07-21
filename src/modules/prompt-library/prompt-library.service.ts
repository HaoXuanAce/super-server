import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { HotImageEntity } from '../hot-image/entities/hot-image.entity'
import { FilterPromptEntity } from './entities/filter-prompt.entity'
import { ToolPromptEntity } from './entities/tool-prompt.entity'
import type { PromptLibraryOptions } from './prompt-library.types'

@Injectable()
export class PromptLibraryService {
	constructor(
		@InjectRepository(FilterPromptEntity)
		private readonly filterPromptRepository: Repository<FilterPromptEntity>,
		@InjectRepository(ToolPromptEntity)
		private readonly toolPromptRepository: Repository<ToolPromptEntity>,
		@InjectRepository(HotImageEntity)
		private readonly hotImageRepository: Repository<HotImageEntity>,
	) {}

	async findOptions(): Promise<PromptLibraryOptions> {
		const [filters, tools, hotImages] = await Promise.all([
			this.filterPromptRepository.find({
				select: { id: true, name: true },
				where: { isActive: true },
				order: { sortOrder: 'ASC' },
			}),
			this.toolPromptRepository.find({
				select: { id: true, name: true },
				where: { isActive: true },
				order: { sortOrder: 'ASC' },
			}),
			this.hotImageRepository.find({
				select: { id: true, name: true },
				order: { name: 'ASC' },
			}),
		])

		return { filters, tools, hotImages }
	}

	async findFilterPrompt(id: string): Promise<FilterPromptEntity> {
		const filter = await this.filterPromptRepository.findOneBy({
			id,
			isActive: true,
		})
		if (!filter) {
			throw new NotFoundException(`滤镜不存在：${id}`)
		}

		return filter
	}

	async findToolPrompt(id: string): Promise<ToolPromptEntity> {
		const tool = await this.toolPromptRepository.findOneBy({
			id,
			isActive: true,
		})
		if (!tool) {
			throw new NotFoundException(`工具不存在：${id}`)
		}

		return tool
	}

	async findHotImage(id: string): Promise<HotImageEntity> {
		const hotImage = await this.hotImageRepository.findOneBy({ id })
		if (!hotImage) {
			throw new NotFoundException(`热门图片不存在：${id}`)
		}

		return hotImage
	}
}
