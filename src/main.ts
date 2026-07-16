import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	})
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: false,
		}),
	)
	app.setGlobalPrefix('api')

	await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
