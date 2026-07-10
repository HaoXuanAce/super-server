import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { QueueConnectionService } from './queue-connection.service'
import { QueueService } from './queue.service'

@Module({
	imports: [ConfigModule],
	providers: [QueueConnectionService, QueueService],
	exports: [QueueConnectionService, QueueService],
})
export class QueueModule {}
