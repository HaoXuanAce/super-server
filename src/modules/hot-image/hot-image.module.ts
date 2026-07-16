import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HotImageController } from './hot-image.controller'
import { HotImageEntity } from './entities/hot-image.entity'
import { HotImageService } from './hot-image.service'

@Module({
	imports: [TypeOrmModule.forFeature([HotImageEntity])],
	controllers: [HotImageController],
	providers: [HotImageService],
})
export class HotImageModule {}
