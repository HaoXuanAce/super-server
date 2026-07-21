import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm'
import type { WxJsonContent } from '../common/wx-domain.types'

@Entity('wx_answer')
@Index(['questionnaireId', 'respondentUserId'], { unique: true })
@Index(['respondentUserId', 'submittedAt'])
@Index(['questionnaireOwnerUserId', 'submittedAt'])
export class WxAnswerEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ name: 'questionnaire_id', type: 'varchar', length: 36 })
	questionnaireId!: string

	@Column({ name: 'respondent_user_id', type: 'varchar', length: 36 })
	respondentUserId!: string

	@Column({
		name: 'questionnaire_owner_user_id',
		type: 'varchar',
		length: 36,
	})
	questionnaireOwnerUserId!: string

	@Column({ name: 'questionnaire_snapshot', type: 'json' })
	questionnaireSnapshot!: WxJsonContent

	@Column({ type: 'json' })
	answers!: WxJsonContent

	@CreateDateColumn({ name: 'submitted_at' })
	submittedAt!: Date
}
