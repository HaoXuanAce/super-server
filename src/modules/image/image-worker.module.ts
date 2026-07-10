import { Module } from '@nestjs/common'
import { QueueModule } from 'src/core/queue/queue.module'
import { TaskModule } from 'src/modules/task/task.module'
import { ImageModule } from './image.module'
import { ImageGenerationProcessor } from './processors/image-generation.processor'

@Module({
	imports: [ImageModule, QueueModule, TaskModule],
	providers: [ImageGenerationProcessor],
})
export class ImageWorkerModule {}
