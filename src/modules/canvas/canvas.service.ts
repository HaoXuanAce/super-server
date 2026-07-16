import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, EntityManager, In, IsNull } from 'typeorm'
import {
	CanvasChanges,
	CanvasEdgePayload,
	CanvasEdgeUpdatePayload,
	CanvasNodePayload,
	CanvasNodeUpdatePayload,
	SaveCanvasChangesInput,
	SaveCanvasChangesResult,
} from './canvas.types'
import { CanvasEdgeEntity } from './entities/canvas-edge.entity'
import { CanvasEntity } from './entities/canvas.entity'
import { CanvasNodeEntity } from './entities/canvas-node.entity'
import { CanvasVersionEntity } from './entities/canvas-version.entity'

@Injectable()
export class CanvasService {
	constructor(
		@InjectDataSource()
		private readonly dataSource: DataSource,
	) {}

	saveChanges(
		input: SaveCanvasChangesInput,
	): Promise<SaveCanvasChangesResult> {
		this.validateChanges(input.changes)

		return this.dataSource.transaction(async (manager) => {
			const canvas = await manager.findOne(CanvasEntity, {
				where: { id: input.canvasId, ownerUserId: input.userId },
				lock: { mode: 'pessimistic_write' },
			})

			if (!canvas) {
				throw new NotFoundException('画布不存在或无权访问')
			}

			const currentVersion = Number(canvas.currentVersion)
			if (currentVersion !== input.baseVersion) {
				throw new ConflictException('画布版本冲突，请刷新后重试')
			}

			const nextVersion = currentVersion + 1
			await this.applyChanges(
				manager,
				input.canvasId,
				nextVersion,
				input.changes,
			)

			await manager.save(CanvasVersionEntity, {
				canvasId: input.canvasId,
				version: String(nextVersion),
				baseVersion: String(input.baseVersion),
				operation: input.changes,
				snapshot: null,
				createdByUserId: input.userId,
			})

			await manager.update(CanvasEntity, input.canvasId, {
				currentVersion: String(nextVersion),
			})

			return {
				canvasId: input.canvasId,
				version: nextVersion,
			}
		})
	}

	private async applyChanges(
		manager: EntityManager,
		canvasId: string,
		version: number,
		changes: CanvasChanges,
	): Promise<void> {
		const nodeChanges = changes.nodes ?? {}
		const edgeChanges = changes.edges ?? {}
		const nodeCreates = nodeChanges.create ?? []
		const nodeUpdates = nodeChanges.update ?? []
		const nodeDeletes = nodeChanges.delete ?? []
		const edgeCreates = edgeChanges.create ?? []
		const edgeUpdates = edgeChanges.update ?? []
		const edgeDeletes = edgeChanges.delete ?? []

		await this.createNodes(manager, canvasId, version, nodeCreates)
		await this.updateNodes(manager, canvasId, version, nodeUpdates)

		await this.ensureReferencedNodesExist(
			manager,
			canvasId,
			edgeCreates,
			edgeUpdates,
			nodeDeletes,
		)
		await this.createEdges(manager, canvasId, version, edgeCreates)
		await this.updateEdges(manager, canvasId, version, edgeUpdates)
		await this.deleteEdges(manager, canvasId, version, edgeDeletes)
		await this.deleteNodes(manager, canvasId, version, nodeDeletes)
	}

	private validateChanges(changes: CanvasChanges): void {
		const nodeChanges = changes.nodes ?? {}
		const edgeChanges = changes.edges ?? {}
		const nodeIds = [
			...(nodeChanges.create ?? []).map((node) => node.id),
			...(nodeChanges.update ?? []).map((node) => node.nodeId),
			...(nodeChanges.delete ?? []),
		]
		const edgeIds = [
			...(edgeChanges.create ?? []).map((edge) => edge.id),
			...(edgeChanges.update ?? []).map((edge) => edge.edgeId),
			...(edgeChanges.delete ?? []),
		]

		if (!nodeIds.length && !edgeIds.length) {
			throw new BadRequestException('至少需要提交一个节点或边的变更')
		}

		this.assertUniqueIds('节点', nodeIds)
		this.assertUniqueIds('边', edgeIds)

		for (const node of nodeChanges.update ?? []) {
			if (!this.hasNodePatch(node)) {
				throw new BadRequestException(`节点 ${node.nodeId} 没有可更新的数据`)
			}
		}

		for (const edge of edgeChanges.update ?? []) {
			if (!this.hasEdgePatch(edge)) {
				throw new BadRequestException(`边 ${edge.edgeId} 没有可更新的数据`)
			}
		}
	}

	private assertUniqueIds(label: string, ids: string[]): void {
		if (new Set(ids).size !== ids.length) {
			throw new BadRequestException(
				`同一批变更中，同一个${label}只能执行一次操作`,
			)
		}
	}

	private async createNodes(
		manager: EntityManager,
		canvasId: string,
		version: number,
		nodes: CanvasNodePayload[],
	): Promise<void> {
		if (!nodes.length) return

		await this.ensureNodesDoNotExist(
			manager,
			canvasId,
			nodes.map((node) => node.id),
		)
		await manager.insert(
			CanvasNodeEntity,
			nodes.map((node) => this.toNodeEntity(canvasId, version, node)),
		)
	}

	private async updateNodes(
		manager: EntityManager,
		canvasId: string,
		version: number,
		nodes: CanvasNodeUpdatePayload[],
	): Promise<void> {
		for (const node of nodes) {
			const result = await manager.update(
				CanvasNodeEntity,
				{ canvasId, nodeId: node.nodeId, deletedAt: IsNull() },
				this.toNodePatch(version, node),
			)

			if (result.affected !== 1) {
				throw new NotFoundException(`节点不存在或已删除：${node.nodeId}`)
			}
		}
	}

	private async createEdges(
		manager: EntityManager,
		canvasId: string,
		version: number,
		edges: CanvasEdgePayload[],
	): Promise<void> {
		if (!edges.length) return

		await this.ensureEdgesDoNotExist(
			manager,
			canvasId,
			edges.map((edge) => edge.id),
		)
		await manager.insert(
			CanvasEdgeEntity,
			edges.map((edge) => this.toEdgeEntity(canvasId, version, edge)),
		)
	}

	private async updateEdges(
		manager: EntityManager,
		canvasId: string,
		version: number,
		edges: CanvasEdgeUpdatePayload[],
	): Promise<void> {
		for (const edge of edges) {
			const result = await manager.update(
				CanvasEdgeEntity,
				{ canvasId, edgeId: edge.edgeId, deletedAt: IsNull() },
				this.toEdgePatch(version, edge),
			)

			if (result.affected !== 1) {
				throw new NotFoundException(`边不存在或已删除：${edge.edgeId}`)
			}
		}
	}

	private async deleteEdges(
		manager: EntityManager,
		canvasId: string,
		version: number,
		edgeIds: string[],
	): Promise<void> {
		if (!edgeIds.length) return

		const result = await manager.update(
			CanvasEdgeEntity,
			{ canvasId, edgeId: In(edgeIds), deletedAt: IsNull() },
			{ deletedAt: new Date(), updatedVersion: String(version) },
		)

		if (result.affected !== edgeIds.length) {
			throw new NotFoundException('存在不存在或已删除的边')
		}
	}

	private async deleteNodes(
		manager: EntityManager,
		canvasId: string,
		version: number,
		nodeIds: string[],
	): Promise<void> {
		if (!nodeIds.length) return

		const deletedAt = new Date()
		const result = await manager.update(
			CanvasNodeEntity,
			{ canvasId, nodeId: In(nodeIds), deletedAt: IsNull() },
			{ deletedAt, updatedVersion: String(version) },
		)

		if (result.affected !== nodeIds.length) {
			throw new NotFoundException('存在不存在或已删除的节点')
		}

		await manager.update(
			CanvasEdgeEntity,
			{ canvasId, sourceNodeId: In(nodeIds), deletedAt: IsNull() },
			{ deletedAt, updatedVersion: String(version) },
		)
		await manager.update(
			CanvasEdgeEntity,
			{ canvasId, targetNodeId: In(nodeIds), deletedAt: IsNull() },
			{ deletedAt, updatedVersion: String(version) },
		)
	}

	private async ensureReferencedNodesExist(
		manager: EntityManager,
		canvasId: string,
		edgeCreates: CanvasEdgePayload[],
		edgeUpdates: CanvasEdgeUpdatePayload[],
		deletedNodeIds: string[],
	): Promise<void> {
		const nodeIds = [
			...edgeCreates.flatMap((edge) => [edge.source, edge.target]),
			...edgeUpdates.flatMap((edge) =>
				[edge.source, edge.target].filter(
					(nodeId): nodeId is string => nodeId !== undefined,
				),
			),
		]

		if (!nodeIds.length) return

		if (nodeIds.some((nodeId) => deletedNodeIds.includes(nodeId))) {
			throw new BadRequestException('边不能关联同一批中删除的节点')
		}

		const uniqueNodeIds = [...new Set(nodeIds)]
		const nodes = await manager.find(CanvasNodeEntity, {
			where: { canvasId, nodeId: In(uniqueNodeIds), deletedAt: IsNull() },
		})

		if (nodes.length !== uniqueNodeIds.length) {
			throw new BadRequestException('边关联的节点不存在或已删除')
		}
	}

	private async ensureNodesDoNotExist(
		manager: EntityManager,
		canvasId: string,
		nodeIds: string[],
	): Promise<void> {
		const nodes = await manager.find(CanvasNodeEntity, {
			where: { canvasId, nodeId: In(nodeIds) },
			withDeleted: true,
		})

		if (nodes.length) {
			throw new ConflictException(`节点 ID 已存在：${nodes[0].nodeId}`)
		}
	}

	private async ensureEdgesDoNotExist(
		manager: EntityManager,
		canvasId: string,
		edgeIds: string[],
	): Promise<void> {
		const edges = await manager.find(CanvasEdgeEntity, {
			where: { canvasId, edgeId: In(edgeIds) },
			withDeleted: true,
		})

		if (edges.length) {
			throw new ConflictException(`边 ID 已存在：${edges[0].edgeId}`)
		}
	}

	private toNodeEntity(
		canvasId: string,
		version: number,
		node: CanvasNodePayload,
	): CanvasNodeEntity {
		return {
			canvasId,
			nodeId: node.id,
			type: node.type,
			positionX: String(node.position.x),
			positionY: String(node.position.y),
			data: node.data,
			style: node.style ?? null,
			width: this.toNullableDecimal(node.width),
			height: this.toNullableDecimal(node.height),
			createdVersion: String(version),
			updatedVersion: String(version),
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
	}

	private toNodePatch(
		version: number,
		node: CanvasNodeUpdatePayload,
	): Partial<CanvasNodeEntity> {
		const values: Partial<CanvasNodeEntity> = {
			updatedVersion: String(version),
		}

		if (node.type !== undefined) values.type = node.type
		if (node.position !== undefined) {
			values.positionX = String(node.position.x)
			values.positionY = String(node.position.y)
		}
		if (node.data !== undefined) values.data = node.data
		if (node.style !== undefined) values.style = node.style
		if (node.width !== undefined)
			values.width = this.toNullableDecimal(node.width)
		if (node.height !== undefined)
			values.height = this.toNullableDecimal(node.height)

		return values
	}

	private toEdgeEntity(
		canvasId: string,
		version: number,
		edge: CanvasEdgePayload,
	): CanvasEdgeEntity {
		return {
			canvasId,
			edgeId: edge.id,
			sourceNodeId: edge.source,
			targetNodeId: edge.target,
			sourceHandle: edge.sourceHandle ?? null,
			targetHandle: edge.targetHandle ?? null,
			type: edge.type ?? null,
			data: edge.data ?? null,
			createdVersion: String(version),
			updatedVersion: String(version),
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
	}

	private toEdgePatch(
		version: number,
		edge: CanvasEdgeUpdatePayload,
	): Partial<CanvasEdgeEntity> {
		const values: Partial<CanvasEdgeEntity> = {
			updatedVersion: String(version),
		}

		if (edge.source !== undefined) values.sourceNodeId = edge.source
		if (edge.target !== undefined) values.targetNodeId = edge.target
		if (edge.sourceHandle !== undefined)
			values.sourceHandle = edge.sourceHandle
		if (edge.targetHandle !== undefined)
			values.targetHandle = edge.targetHandle
		if (edge.type !== undefined) values.type = edge.type
		if (edge.data !== undefined) values.data = edge.data

		return values
	}

	private hasNodePatch(node: CanvasNodeUpdatePayload): boolean {
		return (
			node.type !== undefined ||
			node.position !== undefined ||
			node.data !== undefined ||
			node.style !== undefined ||
			node.width !== undefined ||
			node.height !== undefined
		)
	}

	private hasEdgePatch(edge: CanvasEdgeUpdatePayload): boolean {
		return (
			edge.source !== undefined ||
			edge.target !== undefined ||
			edge.sourceHandle !== undefined ||
			edge.targetHandle !== undefined ||
			edge.type !== undefined ||
			edge.data !== undefined
		)
	}

	private toNullableDecimal(value: number | null | undefined): string | null {
		if (value === null || value === undefined) {
			return null
		}

		return String(value)
	}
}
