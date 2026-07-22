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
	@PrimaryGeneratedColumn({ type: 'int', unsigned: true })
	id!: number

	@Column({ name: 'questionnaire_id', type: 'int', unsigned: true })
	questionnaireId!: number

	@Column({ name: 'respondent_user_id', type: 'int', unsigned: true })
	respondentUserId!: number

	@Column({
		name: 'questionnaire_owner_user_id',
		type: 'int',
		unsigned: true,
	})
	questionnaireOwnerUserId!: number

	@Column({ name: 'questionnaire_snapshot', type: 'json' })
	questionnaireSnapshot!: WxJsonContent

	@Column({ type: 'json' })
	answers!: WxJsonContent

	@CreateDateColumn({ name: 'submitted_at' })
	submittedAt!: Date
}
