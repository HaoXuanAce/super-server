export interface CreateTaskInput {
	id: string
	type: string
	userId: string
	provider: string
	model: string
	input: object
	chargeAmount: string
	pricingSnapshot: object
	clientRequestId?: string
}
