import { ConflictException, Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import type {
	CreateUserInput,
	UserProfile,
} from 'src/common/interface/user.interface'
import { DataSource, Repository } from 'typeorm'
import { CanvasEntity } from '../canvas/entities/canvas.entity'
import { UserEntity } from './entities/user.entity'

@Injectable()
export class UserService {
	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async create(input: CreateUserInput): Promise<UserEntity> {
		try {
			return await this.dataSource.transaction(async (manager) => {
				const user = await manager.save(UserEntity, {
					email: input.email ?? null,
					phone: input.phone ?? null,
					passwordHash: input.passwordHash ?? null,
					wechatOpenId: null,
					balance: '100.00',
				})

				await manager.save(CanvasEntity, {
					ownerUserId: user.id,
					name: '我的画布',
					currentVersion: '0',
				})

				return user
			})
		} catch (error) {
			if (this.isDuplicateEntryError(error)) {
				throw new ConflictException('邮箱或手机号已注册')
			}

			throw error
		}
	}

	findById(id: string): Promise<UserEntity | null> {
		return this.userRepository.findOneBy({ id })
	}

	findByPhone(phone: string): Promise<UserEntity | null> {
		return this.userRepository.findOneBy({ phone })
	}

	findByEmailWithPassword(email: string): Promise<UserEntity | null> {
		return this.userRepository
			.createQueryBuilder('user')
			.addSelect('user.passwordHash')
			.where('user.email = :email', { email })
			.getOne()
	}

	toProfile(user: UserEntity): UserProfile {
		return {
			id: user.id,
			email: user.email,
			phone: user.phone,
			balance: user.balance,
			createdAt: user.createdAt,
		}
	}

	private isDuplicateEntryError(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			(error as { code?: string }).code === 'ER_DUP_ENTRY'
		)
	}
}
