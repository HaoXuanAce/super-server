# Canvas 画布增量保存接口

画布数据分为四张表：

```text
canvas          画布主信息、所属用户和当前版本号
canvas_node     当前节点状态
canvas_edge     当前边状态
canvas_version  每一批增量变更的历史记录
```

节点和边不保存完整快照。前端只提交本次变更的节点、边，后端在一个事务中增量写入。这样即使画布节点很多，每次网络请求和数据库更新也只处理发生变化的数据。

## 接口

```text
PATCH /api/canvases/:canvasId/changes
Authorization: Bearer <token>
Content-Type: application/json
```

`canvasId` 是 URL 参数。后端从 JWT 中获取当前用户 ID，并要求 `canvas.ownerUserId` 等于当前用户；不能在请求体里传 `userId`，也不能修改别人的画布。

请求体：

```ts
{
	baseVersion: 12,
	nodes: {
		create: [
			{
				id: 'node_3',
				type: 'prompt',
				position: { x: 240, y: 160 },
				data: { label: '提示词' },
				style: { width: 280 },
				width: 280,
				height: 120,
			},
		],
		update: [
			{
				nodeId: 'node_1',
				position: { x: 360, y: 200 },
				data: { label: '新的标题' },
			},
		],
		delete: ['node_2'],
	},
	edges: {
		create: [
			{
				id: 'edge_3',
				source: 'node_1',
				target: 'node_3',
				type: 'default',
				data: {},
			},
		],
		update: [
			{
				edgeId: 'edge_1',
				target: 'node_3',
			},
		],
		delete: ['edge_2'],
	},
}
```

`nodes` 和 `edges` 都是可选的；其中 `create`、`update`、`delete` 也都可选。至少要包含一项实际变更。

成功返回：

```json
{
	"canvasId": "canvas-id",
	"version": 13
}
```

前端必须用返回的 `version` 更新本地版本号，作为下一次请求的 `baseVersion`。

## 字段说明

```text
nodes.create  新建完整节点，id、type、position、data 必填
nodes.update  修改节点。nodeId 必填，其他字段按需传入
nodes.delete  要删除的 nodeId 数组

edges.create  新建完整边，id、source、target 必填
edges.update  修改边。edgeId 必填，其他字段按需传入
edges.delete  要删除的 edgeId 数组
```

删除节点时，后端会自动软删除所有连接到该节点的边。创建或修改边时，`source`、`target` 指向的节点必须存在且未删除。

同一批请求中，同一个 `nodeId` 或 `edgeId` 只能出现在一个操作中。例如不能既更新又删除 `node_1`；前端应当先合并本地操作后再发送。

## 写入顺序和一致性

后端会在同一个数据库事务内按如下顺序执行：

```text
1. 对当前用户的 canvas 行加 FOR UPDATE 锁
2. 校验 currentVersion === baseVersion
3. 创建节点、更新节点
4. 校验边引用的节点存在，创建边、更新边、删除边
5. 删除节点和关联边
6. 写入 canvas_version
7. canvas.currentVersion 加 1
8. 提交事务
```

任意一步报错，整批创建、更新、删除都会回滚。版本不一致时返回 `409 Conflict`，前端需要重新获取最新画布数据后再提交。

## 前端串行调用

同一画布短时间内多次操作时，继续使用 Promise 队列，确保下一次请求使用上一次成功返回的版本号：

```ts
let saveQueue = Promise.resolve()
let currentVersion = 0

function saveChanges(changes: object) {
	const task = saveQueue.then(async () => {
		const response = await api.patch(`/canvases/${canvasId}/changes`, {
			baseVersion: currentVersion,
			...changes,
		})

		currentVersion = response.data.version
		return response.data
	})

	saveQueue = task.catch(() => undefined)
	return task
}
```

拖动节点时不要每一帧都调用接口。拖动结束后将本次位置变化合并到 `nodes.update` 再提交；新增、删除节点或边可以立即提交。

## 相关代码

```text
src/modules/canvas/canvas.controller.ts
src/modules/canvas/dto/save-canvas-changes.dto.ts
src/modules/canvas/canvas.service.ts
```
