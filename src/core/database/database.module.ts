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
				// 应用启动时数据库暂时不可用，会每 3 秒重新连接，最多尝试 10 次。
				retryAttempts: 10,
				retryDelay: 3000,
				connectTimeout: 15000,
				poolSize: 30,
				extra: {
					// 保持 TCP 连接活跃；失效连接会被连接池移除，后续请求自动新建连接。
					enableKeepAlive: true,
					keepAliveInitialDelay: 0,
					maxIdle: 10,
					idleTimeout: 60000,
					queueLimit: 0,
				},
				autoLoadEntities: true,
				synchronize: true,
			}),
		}),
	],
})
export class DatabaseModule {}
