import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import type { WxUserStatus } from '../common/wx-domain.types'
import { WX_USER_STATUSES } from '../wx.constants'

@Entity('wx_user')
export class WxUserEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ name: 'open_id', type: 'varchar', length: 128, unique: true })
	openId!: string

	@Index()
	@Column({
		name: 'union_id',
		type: 'varchar',
		length: 128,
		nullable: true,
	})
	unionId!: string | null

	@Column({ type: 'varchar', length: 100, nullable: true })
	nickname!: string | null

	@Column({ name: 'avatar_url', type: 'varchar', length: 2048, nullable: true })
	avatarUrl!: string | null

	@Column({
		type: 'enum',
		enum: WX_USER_STATUSES,
		default: 'active',
	})
	status!: WxUserStatus

	@Column({ name: 'last_login_at', type: 'datetime' })
	lastLoginAt!: Date

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date
}
