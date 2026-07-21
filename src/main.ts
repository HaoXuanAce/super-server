import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true,
	})
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER))
	app.enableCors({
		origin: (
			process.env.CORS_ORIGINS ??
			'http://localhost:5173,http://127.0.0.1:5173'
		).split(','),
	})
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
