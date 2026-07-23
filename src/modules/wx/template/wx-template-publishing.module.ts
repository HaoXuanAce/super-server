import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WxTemplatePublishingService } from './wx-template-publishing.service'

@Module({
	imports: [TypeOrmModule.forFeature([WxTemplateEntity, WxUserEntity])],
	providers: [WxTemplatePublishingService],
	exports: [WxTemplatePublishingService],
})
export class WxTemplatePublishingModule {}
