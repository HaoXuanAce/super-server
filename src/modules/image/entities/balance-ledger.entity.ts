import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm'

@Entity('balance_ledger')
@Index(['referenceType', 'referenceId', 'type'], { unique: true })
export class BalanceLedgerEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@Column({ type: 'varchar', length: 36 })
	userId!: string

	@Column({ type: 'varchar', length: 32 })
	type!: 'image_charge' | 'image_refund'

	@Column({ type: 'decimal', precision: 15, scale: 2 })
	amount!: string

	@Column({ type: 'decimal', precision: 15, scale: 2 })
	balanceBefore!: string

	@Column({ type: 'decimal', precision: 15, scale: 2 })
	balanceAfter!: string

	@Column({ type: 'varchar', length: 32 })
	referenceType!: string

	@Column({ type: 'varchar', length: 36 })
	referenceId!: string

	@Column({ type: 'varchar', length: 191, nullable: true })
	reason!: string | null

	@CreateDateColumn()
	createdAt!: Date
}
