import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TaskModule } from 'src/modules/task/task.module'
import { ImageController } from './image.controller'
import { BalanceLedgerEntity } from './entities/balance-ledger.entity'
import { ImageQueueService } from './image-queue.service'
import { ImageService } from './image.service'

@Module({
	imports: [TaskModule, TypeOrmModule.forFeature([BalanceLedgerEntity])],
	controllers: [ImageController],
	providers: [ImageService, ImageQueueService],
	exports: [ImageService, ImageQueueService],
})
export class ImageModule {}
