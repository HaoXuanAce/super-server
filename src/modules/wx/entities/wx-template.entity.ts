import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import type { WxJsonContent } from '../common/wx-domain.types'

@Entity('wx_questionnaire_template')
@Index(['ownerUserId', 'createdAt'])
export class WxTemplateEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({
		name: 'owner_user_id',
		type: 'varchar',
		length: 36,
		nullable: true,
	})
	ownerUserId!: string | null

	@Column({ type: 'varchar', length: 191 })
	name!: string

	@Column({ type: 'text', nullable: true })
	description!: string | null

	@Column({
		name: 'cover_url',
		type: 'varchar',
		length: 2048,
		nullable: true,
	})
	coverUrl!: string | null

	@Column({ type: 'json' })
	content!: WxJsonContent

	@Column({ name: 'is_system', type: 'boolean', default: false })
	isSystem!: boolean

	@Column({ name: 'is_public', type: 'boolean', default: false })
	isPublic!: boolean

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deleted_at', nullable: true })
	deletedAt!: Date | null
}
