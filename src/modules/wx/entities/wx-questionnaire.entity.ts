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
	WxQuestionnaireStatus,
} from '../common/wx-domain.types'
import { WX_QUESTIONNAIRE_STATUSES } from '../wx.constants'

@Entity('wx_questionnaire')
@Index(['ownerUserId', 'createdAt'])
export class WxQuestionnaireEntity {
	@PrimaryGeneratedColumn({ type: 'int', unsigned: true })
	id!: number

	@Column({ name: 'owner_user_id', type: 'int', unsigned: true })
	ownerUserId!: number

	@Column({
		name: 'source_template_id',
		type: 'int',
		unsigned: true,
		nullable: true,
	})
	sourceTemplateId!: number | null

	@Column({ type: 'varchar', length: 191 })
	title!: string

	@Column({ type: 'text', nullable: true })
	description!: string | null

	@Column({ type: 'json' })
	content!: WxJsonContent

	@Column({
		type: 'enum',
		enum: WX_QUESTIONNAIRE_STATUSES,
		default: 'draft',
	})
	status!: WxQuestionnaireStatus

	@Column({ name: 'published_at', type: 'datetime', nullable: true })
	publishedAt!: Date | null

	@CreateDateColumn({ name: 'created_at' })
	createdAt!: Date

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt!: Date

	@DeleteDateColumn({ name: 'deleted_at', nullable: true })
	deletedAt!: Date | null
}
