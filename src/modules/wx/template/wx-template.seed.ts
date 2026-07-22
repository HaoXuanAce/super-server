import { Injectable, type OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WX_SYSTEM_TEMPLATE_PRESETS } from './presets'
import type { WxSystemTemplatePreset } from './presets/wx-template-preset.types'

@Injectable()
export class WxTemplateSeedService implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		for (const preset of WX_SYSTEM_TEMPLATE_PRESETS) {
			await this.syncPreset(preset)
		}
	}

	private async syncPreset(preset: WxSystemTemplatePreset): Promise<void> {
		const template =
			(await this.templateRepository.findOne({
				where: { presetKey: preset.key },
				withDeleted: true,
			})) ?? new WxTemplateEntity()

		template.ownerUserId = null
		template.presetKey = preset.key
		template.sourceTemplateId = null
		template.name = preset.name
		template.description = preset.description
		template.coverUrl = preset.coverUrl
		template.content = structuredClone(preset.content)
		template.category = preset.category
		template.isSystem = true
		template.isPublic = true
		template.publishedAt ??= new Date()
		template.heat ??= 0
		template.deletedAt = null

		await this.templateRepository.save(template)
	}
}
