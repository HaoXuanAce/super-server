import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
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

	const swaggerConfig = new DocumentBuilder()
		.setTitle('Super Server API')
		.setDescription('Super Server 接口文档')
		.setVersion('1.0')
		.build()
	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('api-docs', app, document, {
		useGlobalPrefix: true,
		jsonDocumentUrl: 'api-docs-json',
	})

	await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
