# AI 聊天 SSE：幂等、断线恢复、取消与历史持久化设计

## 1. 目标和结论

`/Users/haoxuan/Desktop/super-web/src/view/Creation/components/FloatingChatPanel.vue` 目前仅使用 `mockMessages`，还没有聊天接口、SSE、消息持久化或取消逻辑。后端目前有 OpenAI 客户端、Redis 和 BullMQ 图片队列，但也没有聊天流模块。

本设计新增独立的 `ChatModule`，并采用下面的通信方式：

```text
前端 POST 创建或复用一次 AI turn（普通 JSON）
前端 fetch GET 订阅该 turn 的 SSE 事件流
前端断线后携带最后连续处理的 seq 重连
前端主动 POST cancel 取消 turn
后端把每个业务事件先持久化，再广播到 SSE
```

不要让 `POST` 发起模型生成后直接成为唯一的 SSE 连接。那种设计在断线时没有稳定的 turn 标识，无法可靠重放，也难以判断“同一次重试”和“新的一次生成”。

该设计满足：

- 相同的业务请求返回已有结果，不重复执行模型。
- 临时断线后按序补回漏掉的事件，不丢文本，不重复文本。
- 文本增量、业务卡片、状态和结束信号在协议层使用不同事件类型。
- 关闭聊天面板或页面时，前端显式取消，后端中断模型、工具调用和排队任务。
- 用户消息、助手消息、流事件和最终状态都会持久化，刷新后可恢复历史。

## 2. 当前项目中的接入点

前端：

```text
super-web/src/view/Creation/components/FloatingChatPanel.vue
```

这个组件应从展示组件改为聊天容器：移除 `mockMessages`，使用服务端的 message id 和 message 状态渲染。`MessageScrollerItem` 已经使用稳定的 `message.id` 作为 key，这一点可以保留。

前端已有 `src/utils/request.ts`，它会自动添加 JWT，并把普通 JSON 响应解包；SSE 不要走它。SSE 必须直接使用 `fetch`，因为：

- 原生 `EventSource` 不能方便地携带当前项目使用的 `Authorization: Bearer <token>`。
- `fetch` 支持手动设置 Authorization、`AbortController` 和读取 `ReadableStream`。
- Axios 的 JSON 响应拦截器不适合处理增量 `text/event-stream`。

后端已有：

```text
src/modules/ai/ai.service.ts         OpenAI 客户端
src/core/redis/redis.service.ts      Redis 客户端
src/modules/image/image-queue.service.ts
src/modules/image/processors/*       BullMQ worker 的现有模式
src/modules/auth/jwt-auth.guard.ts   JWT 鉴权
```

聊天模块应模仿图片任务使用独立队列和 worker，但不要复用当前 `TaskEntity`。聊天需要会话、消息、turn、事件序号、幂等键和取消状态，单独建模更清楚。

## 3. 术语和状态

```text
conversation  一段用户对话，可关联一个 canvas
message       一条用户或助手消息
turn          一次“用户输入 -> AI 生成”的执行单元
event         turn 中一条可重放的 SSE 业务事件
seq           同一 turn 内严格递增的事件序号，从 1 开始
clientRequestId  前端为一次用户点击生成的 UUID，用于网络重试幂等
dedupeKey     业务去重键。这里可以使用用户输入的 name
inputHash     规范化后的全部执行输入的 SHA-256
```

turn 状态只允许按下列方向流转：

```text
queued -> streaming -> completed
queued -> cancelled
streaming -> cancelled
queued -> failed
streaming -> failed
```

前端额外有本地连接状态：`idle`、`connecting`、`connected`、`reconnecting`。SSE 连接关闭不等于 turn 完成；只有收到显式终态事件才可以把消息标为完成、失败或已取消。

## 4. 数据库设计

生产环境应使用 TypeORM migration。当前项目开启了 `synchronize: true`，本地开发可以自动建表，但不能把它当生产迁移方案。

### 4.1 chat_conversation

```text
id               uuid 主键
userId           varchar(36)，索引，所属用户
canvasId         varchar(36)，可空，索引，关联当前画布
title            varchar(191)，可空
createdAt
updatedAt
```

### 4.2 chat_message

```text
id               uuid 主键
conversationId   varchar(36)，索引
turnId           varchar(36)，可空，索引
role             enum: user | assistant | system
status           enum: completed | streaming | failed | cancelled
textContent      longtext，可空，助手最终聚合文本或当前检查点文本
blocks           json，可空，卡片与结构化内容的当前快照
lastEventSeq     bigint unsigned，默认 0
clientMessageId  varchar(64)，可空；用户消息可用于 UI 去重
createdAt
updatedAt
```

`textContent` 用于快速加载历史记录，`blocks` 用于渲染业务卡片。流式文本的绝对事实来源仍然是 `chat_stream_event`；服务端每累计一小段文本或每 200 到 500ms 更新一次 `textContent`，结束时写入完整内容。不要每收到一个 token 都执行一次 message update。

### 4.3 chat_turn

```text
id                    uuid 主键
userId                varchar(36)，索引
conversationId        varchar(36)，索引
userMessageId         varchar(36)，索引
assistantMessageId    varchar(36)，索引
clientRequestId       varchar(64)，前端 UUID
dedupeKey             varchar(191)，业务 name，可空
inputHash             char(64)，SHA-256
status                queued | streaming | completed | failed | cancelled
model                 varchar(128)
requestContext        json，图片、画布、模型参数等完整输入快照
nextSequence          bigint unsigned，默认 1
cancelRequestedAt     datetime，可空
cancelReason          varchar(64)，可空
errorCode             varchar(64)，可空
errorMessage          text，可空
startedAt             datetime，可空
finishedAt            datetime，可空
createdAt
updatedAt
```

必须有以下唯一约束：

```text
UNIQUE (userId, clientRequestId)
UNIQUE (userId, conversationId, dedupeKey)  -- dedupeKey 非空时使用
```

第二个约束是否要包含 `canvasId` 取决于产品语义。对于当前“修图画布”场景，推荐去重范围是 `userId + canvasId + dedupeKey`；这样同一用户在不同画布使用相同的 name 不会互相影响。

### 4.4 chat_stream_event

```text
turnId          varchar(36)
sequence        bigint unsigned
eventType       varchar(64)
payload         json
createdAt

PRIMARY KEY (turnId, sequence)
INDEX (turnId, createdAt)
```

每一条发送到客户端的业务事件都先写入这张表，再通过 Redis 发布。`(turnId, sequence)` 是断线恢复、防重复和顺序一致性的核心。

不需要把连接本身存数据库。活跃订阅者和取消通知放 Redis：

```text
chat:turn:{turnId}:cancel                    取消标记，带 TTL
chat:turn:{turnId}:subscribers               活跃 session 的租约集合
chat:turn:{turnId}:events                    Redis Pub/Sub 频道
```

## 5. 幂等策略

“name 相同就返回上一次结果”不能只比较文本 name。相同 name 但图片、模型、画布上下文、比例或系统提示词版本不同，结果可能不同。

客户端每次点击生成都要传两个字段：

```json
{
  "clientRequestId": "e3b0c442-98fc-4d99-b16b-f5c2eeec2160",
  "dedupeKey": "portrait-retouch-v1"
}
```

服务端对所有会影响模型输出的字段做稳定序列化后计算 `inputHash`。哈希输入至少包含：

```text
userId
conversationId / canvasId
用户文本、附件 URL 或对象 ID
选中的画布节点及其版本
模型名、清晰度、比例、随机种子
系统提示词版本、工具版本
```

处理规则：

```text
相同 userId + clientRequestId 且 inputHash 相同：返回原 turn
相同 userId + clientRequestId 但 inputHash 不同：409 IDEMPOTENCY_KEY_REUSED

相同去重范围 + dedupeKey 且 inputHash 相同：返回已有 turn
相同去重范围 + dedupeKey 但 inputHash 不同：409 DEDUPE_KEY_REUSED

两者都不存在：创建新 conversation/message/turn，并只入队一次
```

已有 turn 无论是 `queued`、`streaming` 或 `completed`，都返回它。前端随后订阅同一个 turn；已完成 turn 直接读取历史或重放事件，不重新调用模型。

对于 `failed` 或 `cancelled` 的 turn，不要用相同 `clientRequestId` 自动重跑。用户点击“重新生成”时生成新的 `clientRequestId` 和新的 `dedupeKey`，或者提供专门的 `POST /retry` 接口，避免重试语义含混。

## 6. HTTP API

所有接口都使用 `JwtAuthGuard`，并且所有查询条件都必须包含当前 JWT 的 `userId`。不要相信前端传来的 userId。

### 6.1 创建或复用 turn

```text
POST /api/chat/turns
Authorization: Bearer <token>
Content-Type: application/json
```

请求示例：

```json
{
  "conversationId": "可选，首次可不传",
  "canvasId": "canvas-id",
  "clientRequestId": "e3b0c442-98fc-4d99-b16b-f5c2eeec2160",
  "dedupeKey": "portrait-retouch-v1",
  "message": {
    "text": "帮我自然美白，脸小一点，保留皮肤纹理",
    "attachments": [
      { "kind": "image", "objectKey": "image/2026-07-16/a.jpg" }
    ]
  },
  "context": {
    "canvasVersion": 12,
    "selectedNodeIds": ["node-1"],
    "model": "gpt-image-1"
  }
}
```

成功响应是普通 JSON：

```json
{
  "conversationId": "conversation-id",
  "turnId": "turn-id",
  "assistantMessageId": "message-id",
  "status": "queued",
  "reused": false,
  "nextSequence": 1
}
```

同一请求返回已有 turn 时，`reused` 为 `true`，`status` 可能是 `streaming` 或 `completed`。

服务端必须在一个事务内完成：查找幂等记录、创建用户消息、创建助手占位消息、创建 turn、写入 `turn.accepted` 事件。事务提交成功后才将 `turnId` 作为 BullMQ job id 放入队列。BullMQ job id 使用 `turnId`，也能避免同一 turn 被重复入队。

### 6.2 订阅 SSE

```text
GET /api/chat/turns/:turnId/events?after=:lastAppliedSequence
Authorization: Bearer <token>
Accept: text/event-stream
```

这是 fetch SSE 接口，不走 Axios。`after` 是客户端已经连续应用的最大 seq，首次订阅传 `0`。

响应头：

```text
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

NestJS SSE controller 应直接使用 Express `Response` 写入，不能让全局 `ResponseInterceptor` 把事件包装成普通 `{ code, data, message }` JSON。连接建立后先 `flushHeaders()`，并每 15 秒发送 SSE 注释心跳：

```text
: ping

```

心跳不写入 `chat_stream_event`，也不增加 seq。

### 6.3 显式取消

```text
POST /api/chat/turns/:turnId/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

请求：

```json
{ "reason": "page_closed" }
```

服务端用条件更新确保只有一个终态：

```text
UPDATE chat_turn
SET cancelRequestedAt = NOW(), cancelReason = ?
WHERE id = ? AND status IN ('queued', 'streaming')
```

然后：

```text
queued：移除 BullMQ 等待任务，写入 turn.cancelled
streaming：写 Redis cancel 标记并发布 cancel 频道，worker AbortController.abort()
```

真正停止按钮调用这个接口时，取消整个 turn。页面关闭的自动取消需要带 `clientSessionId`；如果存在其他活跃页面订阅同一个 turn，服务端只移除当前 session 租约而不取消整个生成，避免一个旧标签页误杀正在使用的流。

### 6.4 历史和恢复接口

```text
GET /api/chat/conversations/:conversationId/messages?before=&limit=50
GET /api/chat/turns/:turnId
```

消息历史响应必须包含 `lastEventSeq` 与 `status`。页面刷新时先加载历史，再对所有 `queued` / `streaming` turn 从 `lastEventSeq` 订阅 SSE。不能只依赖浏览器内存或 localStorage 恢复聊天。

## 7. SSE 事件协议

每个业务事件都独立成一个 SSE frame。禁止在文本中插入特殊结束字符，也禁止用连接关闭判断完成。

统一封包：

```text
id: 8
event: message.delta
data: {"v":1,"turnId":"turn-id","messageId":"message-id","seq":8,"emittedAt":"2026-07-16T10:00:00.000Z","payload":{"delta":"自然美白"}}

```

`id` 和 JSON 中的 `seq` 都是同一个单调递增值。`id` 利用 SSE 标准，JSON 中保留 `seq` 方便 fetch parser 做严格校验。

事件类型：

| event | 是否持久化 | payload | 前端处理 |
| --- | --- | --- | --- |
| `turn.accepted` | 是 | conversationId、status | 创建/确认占位助手消息 |
| `turn.started` | 是 | model、status | 助手消息设为 streaming |
| `message.delta` | 是 | `{ delta }` | 仅追加文本，不解析业务语义 |
| `message.card.upsert` | 是 | `{ cardId, kind, status, data }` | 按 cardId 新建或整体替换卡片 |
| `message.status` | 是 | `{ code, label, progress? }` | 更新状态文案或进度 |
| `turn.completed` | 是 | `{ finishReason, usage? }` | 明确设 completed，停止重连 |
| `turn.failed` | 是 | `{ code, message, retryable }` | 明确设 failed，停止重连 |
| `turn.cancelled` | 是 | `{ reason }` | 明确设 cancelled，停止重连 |
| SSE 注释 ping | 否 | 无 | 只保活 |

卡片必须是结构化 JSON，而不是把卡片 JSON 拼进文本。例如生成图片任务：

```text
event: message.card.upsert
data: {"v":1,"turnId":"turn-id","messageId":"message-id","seq":15,"payload":{"cardId":"image-task-1","kind":"image-generation","status":"running","data":{"taskId":"task-id","prompt":"自然美白","progress":40}}}

```

同一 `cardId` 的后续事件使用完整卡片快照覆盖前端卡片，天然可重放和去重。文本、卡片和状态都不依赖内容分隔符。

终态约束：每一个 turn 必须恰好有一个 `turn.completed`、`turn.failed` 或 `turn.cancelled`。SSE 正常关闭前必须先发送并持久化其中一个事件；网络异常导致的关闭没有终态时，客户端必须进入 `reconnecting`，而不是猜测完成。

## 8. 后端事件写入与广播顺序

生成 worker 不能“先发给客户端，再写数据库”。正确顺序为：

```text
1. 读取并锁定 chat_turn.nextSequence
2. 生成 sequence
3. 在事务中写 chat_stream_event
4. 更新 chat_turn.nextSequence、chat_message 检查点和状态
5. 提交事务
6. Redis publish chat:turn:{turnId}:events
7. 每个 API 实例的 SSE hub 将事件写给本机订阅者
```

这样某个 API 实例宕机、Redis Pub/Sub 临时丢广播或客户端掉线时，事件仍能从 MySQL 回放。

订阅端需要处理“数据库回放与实时广播之间的竞态”，推荐实现如下：

```text
1. 先将当前 SSE subscriber 注册到本机 hub，但暂存实时事件
2. 查询 chat_stream_event where sequence > after，按 sequence ASC 发送
3. 记录回放后的最大 seq 作为 barrier
4. 将暂存且 sequence > barrier 的实时事件按序发送
5. 后续实时事件直接发送
```

即使极端竞态产生重复事件，客户端的 seq 去重仍会忽略它；如果发现间隔，则重新订阅补齐。

文本 token 不应一 token 一事件一写库。worker 可以累积 20 到 100 个字符或等待 50 到 100ms 后创建一个 `message.delta`，既保留细腻流式体验，也避免数据库写放大。业务卡片和终态必须立即持久化。

## 9. 生成、工具调用和取消链路

建议新增：

```text
src/modules/chat/chat.module.ts
src/modules/chat/chat.controller.ts
src/modules/chat/chat.service.ts
src/modules/chat/chat-event.service.ts
src/modules/chat/chat-stream-hub.service.ts
src/modules/chat/chat-generation-queue.service.ts
src/modules/chat/processors/chat-generation.processor.ts
src/modules/chat/entities/*
src/worker.module.ts 中注册 ChatModule
```

`ChatGenerationProcessor` 维护本 worker 正在执行的 `Map<turnId, AbortController>`。开始前检查数据库状态和 Redis cancel 标记；每次模型 chunk、工具调用前后也检查取消标记。

伪代码：

```ts
const controller = new AbortController()
activeControllers.set(turnId, controller)

try {
	await eventService.append(turnId, 'turn.started', { status: 'streaming' })

	const stream = await openai.chat.completions.create(
		{ model, messages, stream: true },
		{ signal: controller.signal },
	)

	for await (const chunk of stream) {
		throwIfCancelled(turnId, controller.signal)
		buffer.append(readText(chunk))
		if (buffer.ready()) {
			await eventService.append(turnId, 'message.delta', {
				delta: buffer.flush(),
			})
		}
	}

	await eventService.appendTerminal(turnId, 'turn.completed', {
		finishReason: 'stop',
	})
} catch (error) {
	if (controller.signal.aborted || await turnService.isCancelled(turnId)) {
		await eventService.appendTerminal(turnId, 'turn.cancelled', {
			reason: 'client_cancelled',
		})
	} else {
		await eventService.appendTerminal(turnId, 'turn.failed', toErrorPayload(error))
	}
} finally {
	activeControllers.delete(turnId)
}
```

模型请求、图片生成、函数调用、HTTP 工具调用都必须接收同一个 `AbortSignal`。如果第三方模型供应商本身不支持取消，后端最多能停止读取并停止写入事件；是否能停止供应商侧算力或计费取决于供应商是否有取消 API，应在 provider adapter 中单独实现。

不要因为 SSE 连接短暂断开就立刻 abort 生成。网络切换或浏览器后台都可能导致断开。只有显式 `cancel`、所有订阅 session 的租约超时后的产品策略，或服务端超时才取消。

## 10. 前端状态和 fetch SSE 实现

建议新增以下文件：

```text
super-web/src/api/chat.ts
super-web/src/api/interface/chat.ts
super-web/src/composables/useChatTurn.ts
super-web/src/utils/sse-parser.ts
```

`FloatingChatPanel.vue` 只负责输入和渲染，状态机与网络副作用全部放入 `useChatTurn`。建议接口：

```ts
const {
	messages,
	connectionState,
	send,
	cancel,
	recoverConversation,
	dispose,
} = useChatTurn({ conversationId, canvasId })
```

消息数据使用服务端 id，不使用数组下标：

```ts
type ChatMessage = {
	id: string
	turnId?: string
	role: 'user' | 'assistant' | 'system'
	status: 'completed' | 'streaming' | 'failed' | 'cancelled'
	text: string
	blocks: Map<string, ChatCard>
	lastAppliedSeq: number
}
```

实际渲染时可把 `Map` 转为 `computed` 数组。`messages` 的修改必须集中在 composable 的 `applyEvent` 中，组件不直接拼接 delta，避免多个异步回调把消息状态写乱。

发送流程：

```text
1. 生成 crypto.randomUUID() 作为 clientRequestId
2. 普通 fetch POST /api/chat/turns，得到 turnId / assistantMessageId
3. 在本地插入用户消息和 streaming 助手占位消息；若 reused 则按 server id 合并
4. 打开 GET /events?after=lastAppliedSeq 的 fetch SSE
5. 每处理一个连续事件后更新 lastAppliedSeq
6. 收到显式终态事件后关闭当前 controller，不再重连
```

fetch SSE 关键点：`ReadableStream` 的任意一个 `read()` chunk 都不等于一个 SSE event。必须使用 `TextDecoder` 保留未完成的 buffer，以空行分隔 frame，解析 `id:`、`event:`、一个或多个 `data:` 行，再 `JSON.parse` data。不要用换行、`[DONE]`、模型文本内容或连接关闭来判断一条业务消息的结束。

核心处理规则：

```ts
function applyEvent(event: ChatStreamEvent) {
	const message = ensureAssistantMessage(event.messageId)

	if (event.seq <= message.lastAppliedSeq) return
	if (event.seq !== message.lastAppliedSeq + 1) {
		throw new SequenceGapError(message.lastAppliedSeq, event.seq)
	}

	switch (event.type) {
		case 'message.delta':
			message.text += event.payload.delta
			break
		case 'message.card.upsert':
			message.blocks.set(event.payload.cardId, event.payload)
			break
		case 'turn.completed':
			message.status = 'completed'
			break
		case 'turn.failed':
			message.status = 'failed'
			break
		case 'turn.cancelled':
			message.status = 'cancelled'
	}

	message.lastAppliedSeq = event.seq
}
```

`seq <= lastAppliedSeq` 直接忽略，因此重连、代理重试或两个短暂重叠的连接都不会造成文本重复。出现 seq 间隙时不应用后续事件，关闭当前流并从 `lastAppliedSeq` 重连，避免状态乱序。

重连策略：

```text
第 1 次：300ms 左右
之后：指数退避 500ms、1s、2s、4s、8s
每次加 0 到 300ms 随机抖动
最大间隔：10s
仅在非终态、非显式取消时重连
401：停止重连，要求重新登录
409 / 404：刷新历史并提示对话不可用
```

刷新页面恢复流程：

```text
1. GET messages，服务端返回 textContent、blocks、status、lastEventSeq
2. 用服务端历史整体替换本地消息，不能和旧 localStorage 盲目合并
3. 找到 status 为 queued 或 streaming 的 turn
4. 从该消息 lastEventSeq 重新订阅
```

## 11. 关闭页面和组件卸载

每个 SSE 订阅都有自己的 `AbortController`。组件卸载、切换 conversation、手动重连前，都先执行：

```ts
streamAbortController.abort()
```

这只会停止浏览器读取 SSE，不等于取消 AI 任务。

用户点击明确的“停止生成”时，立即调用 cancel API，然后 abort 当前 SSE。用户关闭面板、路由离开或页面关闭时，如果产品要求必须停止该 turn，则调用：

```ts
fetch(`/api/chat/turns/${turnId}/cancel`, {
	method: 'POST',
	headers: {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	},
	body: JSON.stringify({ reason: 'page_closed', clientSessionId }),
	keepalive: true,
})
```

同时在 `onBeforeUnmount`、`pagehide` 中调用，并在 `dispose()` 内移除监听器。`pagehide` 网络请求是 best effort，不能保证浏览器崩溃时一定发出，因此服务端仍需 subscriber 租约超时和最大生成时长兜底。

不要用 `navigator.sendBeacon` 承担 Bearer JWT 取消接口：它不能按当前方案可靠地携带 Authorization。除非将认证改成同源 HttpOnly Cookie，才可以考虑 beacon。

## 12. 历史消息与卡片 materialization

完成 turn 时，服务端将所有 delta 聚合为 `chat_message.textContent`，并将每个 `cardId` 最新状态写入 `blocks`。加载历史不需要重放全部旧 token。

在生成中服务重启时：

```text
数据库已有的 event 可以完整重放
message.textContent 是最近检查点，辅助快速初始渲染
worker 重启后扫描 queued / streaming turn
检查 provider 是否支持查询；能恢复则恢复，不能恢复则写 turn.failed
```

事件表可能快速增长。建议保留完整 `chat_stream_event` 至少 7 到 30 天；之后对已完成的 turn 保留 `chat_message` 最终内容和 cards，按业务要求归档或删除细粒度 delta。若客户端请求的 `after` 已早于保留窗口，SSE 接口返回 `410 EVENTS_EXPIRED`，前端改走历史接口恢复最终状态。

## 13. 权限、安全和运维

- 所有 conversation、message、turn、event 查询必须用 JWT userId 过滤，不能只按公开 UUID 查询。
- `clientRequestId`、`dedupeKey`、文本、附件数量、上下文大小都要做 DTO 校验和长度限制。
- 输入 hash 必须由后端计算，前端提供的 hash 不能作为可信依据。
- SSE 不记录 Authorization header、完整 prompt 或图片私有 URL 到日志。
- 生产环境将前端 origin 加入 Nest CORS 的 allowlist，并允许 `Authorization`、`Accept`；开发环境已有 Vite `/api` 代理。
- 反向代理必须关闭 SSE buffering，并把上游超时配置为大于最大生成时长。
- 用结构化日志记录 `turnId`、conversationId、userId、seq、状态迁移、取消原因和模型耗时。
- 监控指标至少包含：活跃 SSE 数、重连次数、seq gap 次数、幂等命中率、取消耗时、每 turn token/event 数、失败率和队列等待时长。

## 14. 必做测试

### 后端单元与集成测试

```text
并发 10 次相同 clientRequestId：只创建一个 turn 和一个 BullMQ job
相同 dedupeKey + 相同 inputHash：返回已有 completed turn
相同 dedupeKey + 不同 inputHash：返回 409
事件写入失败：不向 Redis 或 SSE 广播该事件
sequence 严格递增，且每个 turn 只有一个终态事件
删除 SSE 订阅：不自动取消 turn
cancel queued：任务不执行，最终事件为 turn.cancelled
cancel streaming：AbortSignal 被触发，后续不能再写 delta
非 owner 请求 turn、events、cancel：返回 404 或 403
```

### 前端自动化测试

```text
同一 seq 收到两次：文本和卡片不重复
收到 seq 1、3：不应用 3，重连后补 2、3
SSE 关闭但未收到终态：显示 reconnecting，不显示完成
收到 turn.completed：停止重连，按钮恢复可发送
收到 card.upsert 两次：同一 cardId 只显示一个最新卡片
组件卸载：AbortController.abort 被调用
页面关闭：cancel fetch 使用 keepalive 发起
刷新页面：先加载历史，再继续订阅 streaming turn
```

## 15. 实施顺序

```text
第一步：创建 ChatModule、四张实体表、migration、历史列表接口
第二步：实现 POST /chat/turns 的事务幂等逻辑和 BullMQ jobId
第三步：实现事件表、Redis event hub、GET SSE 回放与实时订阅
第四步：实现 chat worker、OpenAI streaming adapter、显式取消
第五步：前端 chat types、普通 JSON API、SSE parser、useChatTurn composable
第六步：将 FloatingChatPanel.vue 从 mockMessages 接到 composable
第七步：补齐断线、刷新、关闭页面、并发幂等的自动化测试和监控
```

完成后，`FloatingChatPanel.vue` 只接收稳定的 message 状态和 action；SSE parser、重连、seq 去重、取消、历史恢复全部被封装在 `useChatTurn`，避免聊天面板变成难以维护的网络状态机。
