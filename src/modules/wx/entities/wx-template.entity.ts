import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'
import type {
	WxJsonContent,
	WxTemplateCategory,
} from '../common/wx-domain.types'
import { WX_TEMPLATE_CATEGORIES } from '../wx.constants'

@Entity('wx_questionnaire_template')
@Index(['ownerUserId', 'createdAt'])
@Index(['ownerUserId', 'publishedAt'])
@Index(['isPublic', 'category', 'heat', 'publishedAt'])
export class WxTemplateEntity {
	@PrimaryGeneratedColumn({ type: 'int', unsigned: true })
	id!: number

	@Column({
		name: 'owner_user_id',
		type: 'int',
		unsigned: true,
		nullable: true,
	})
	ownerUserId!: number | null

	@Column({
		name: 'preset_key',
		type: 'varchar',
		length: 64,
		nullable: true,
		unique: true,
	})
	presetKey!: string | null

	@Column({
		name: 'source_template_id',
		type: 'int',
		unsigned: true,
		nullable: true,
	})
	sourceTemplateId!: number | null

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

	@Column({
		type: 'enum',
		enum: WX_TEMPLATE_CATEGORIES,
		nullable: true,
	})
	category!: WxTemplateCategory | null

	@Column({ name: 'is_system', type: 'boolean', default: false })
	isSystem!: boolean

	@Column({ name: 'is_public', type: 'boolean', default: false })
	isPublic!: boolean

	@Column({ name: 'published_at', type: 'datetime', nullable: true })
	publishedAt!: Date | null

	@Column({ type: 'int', unsigned: true, default: 0 })
	heat!: number

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deleted_at', nullable: true })
	deletedAt!: Date | null
}
