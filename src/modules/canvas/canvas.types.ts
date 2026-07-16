export interface CanvasPoint {
	x: number
	y: number
}

export interface CanvasNodePayload {
	id: string
	type: string
	position: CanvasPoint
	data: object
	style?: object | null
	width?: number | null
	height?: number | null
}

export interface CanvasEdgePayload {
	id: string
	source: string
	target: string
	sourceHandle?: string | null
	targetHandle?: string | null
	type?: string | null
	data?: object | null
}

export type CanvasNodeUpdatePayload = {
	nodeId: string
} & Partial<Omit<CanvasNodePayload, 'id'>>

export type CanvasEdgeUpdatePayload = {
	edgeId: string
} & Partial<Omit<CanvasEdgePayload, 'id'>>

export interface CanvasNodeChanges {
	create?: CanvasNodePayload[]
	update?: CanvasNodeUpdatePayload[]
	delete?: string[]
}

export interface CanvasEdgeChanges {
	create?: CanvasEdgePayload[]
	update?: CanvasEdgeUpdatePayload[]
	delete?: string[]
}

export interface CanvasChanges {
	nodes?: CanvasNodeChanges
	edges?: CanvasEdgeChanges
}

export interface SaveCanvasChangesInput {
	canvasId: string
	baseVersion: number
	changes: CanvasChanges
	userId: string
}

export interface SaveCanvasChangesResult {
	canvasId: string
	version: number
}
