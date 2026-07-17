import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TaskEntity } from '../task/entities/task.entity'
import { UserEntity } from '../user/entities/user.entity'
import { ImageController } from './image.controller'
import { BalanceLedgerEntity } from './entities/balance-ledger.entity'
import { ImageQueueService } from './image-queue.service'
import { ImageService } from './image.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([BalanceLedgerEntity, TaskEntity, UserEntity]),
	],
	controllers: [ImageController],
	providers: [ImageService, ImageQueueService],
	exports: [ImageService, ImageQueueService],
})
export class ImageModule {}
