import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm'
import type { WxShareType } from '../common/wx-domain.types'
import { WX_SHARE_TYPES } from '../wx.constants'

@Entity('wx_share')
@Index(['creatorUserId', 'createdAt'])
export class WxShareEntity {
	@PrimaryGeneratedColumn({ type: 'int', unsigned: true })
	id!: number

	@Column({ type: 'varchar', length: 64, unique: true })
	token!: string

	@Column({ type: 'enum', enum: WX_SHARE_TYPES })
	type!: WxShareType

	@Column({ name: 'creator_user_id', type: 'int', unsigned: true })
	creatorUserId!: number

	@Column({
		name: 'questionnaire_id',
		type: 'int',
		unsigned: true,
		nullable: true,
	})
	questionnaireId!: number | null

	@Column({
		name: 'answer_id',
		type: 'int',
		unsigned: true,
		nullable: true,
	})
	answerId!: number | null

	@Column({ name: 'expires_at', type: 'datetime', nullable: true })
	expiresAt!: Date | null

	@Column({ name: 'revoked_at', type: 'datetime', nullable: true })
	revokedAt!: Date | null

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date
}
