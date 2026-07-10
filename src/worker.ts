import { NestFactory } from '@nestjs/core'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { WorkerModule } from './worker.module'

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(WorkerModule, {
		bufferLogs: true,
	})
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
	app.enableShutdownHooks()
}
bootstrap()
