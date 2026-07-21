import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface'

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (
				configService: ConfigService,
			): TypeOrmModuleOptions => ({
				type: 'mysql',
				host: configService.get<string>('MYSQL_HOST'),
				port: Number(configService.get<string>('MYSQL_PORT')),
				username: configService.get<string>('MYSQL_USERNAME'),
				password: configService.get<string>('MYSQL_PASSWORD'),
				database: configService.get<string>('MYSQL_DATABASE'),
				autoLoadEntities: true,
				synchronize: true,
			}),
		}),
	],
})
export class DatabaseModule {}
