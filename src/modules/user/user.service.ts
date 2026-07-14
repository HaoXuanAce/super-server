import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'

export interface CreateUserInput {
	email?: string
	phone?: string
	passwordHash?: string
}

export interface UserProfile {
	id: string
	email: string | null
	phone: string | null
	balance: string
	createdAt: Date
}

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
	) {}

	async create(input: CreateUserInput): Promise<UserEntity> {
		try {
			return await this.userRepository.save({
				email: input.email ?? null,
				phone: input.phone ?? null,
				passwordHash: input.passwordHash ?? null,
				wechatOpenId: null,
				balance: '0.00',
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
