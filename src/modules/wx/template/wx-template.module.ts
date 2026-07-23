import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxAuthModule } from '../auth/wx-auth.module'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WxTemplateController } from './wx-template.controller'
import { WxTemplatePublishingModule } from './wx-template-publishing.module'
import { WxTemplateSeedService } from './wx-template.seed'
import { WxTemplateService } from './wx-template.service'

@Module({
	imports: [
		WxAuthModule,
		WxTemplatePublishingModule,
		TypeOrmModule.forFeature([WxTemplateEntity, WxUserEntity]),
	],
	controllers: [WxTemplateController],
	providers: [WxTemplateService, WxTemplateSeedService],
})
export class WxTemplateModule {}
