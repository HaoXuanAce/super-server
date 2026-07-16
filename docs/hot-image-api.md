# 热门图片查询接口

## 数据表

表名为 `hot_image`，包含以下字段：

```text
id      UUID 主键
name    图片名称
url     图片地址
type    图片分类
```

可写入的分类：

```text
人像写真
风景旅行
营销
创意
封面
热梗
表情包
```

“全部”仅用于查询，不会存入 `type` 字段。

## 查询列表

```text
GET /api/hot-images
```

查询参数：

```text
type      可选。全部、 人像写真、风景旅行、营销、创意、封面、热梗、表情包
keyword   可选。按图片名称模糊搜索
page      可选。页码，默认 1
pageSize  可选。每页条数，默认 20，最大 100
```

示例：

```text
GET /api/hot-images?type=人像写真&keyword=夏日&page=1&pageSize=20
GET /api/hot-images?type=全部&page=2&pageSize=30
GET /api/hot-images
```

响应：

```json
{
	"items": [
		{
			"id": "a5c6e312-6e92-4b0f-a1a2-9c417b590dfc",
			"name": "夏日人像写真",
			"url": "https://example.com/hot-images/summer-portrait.jpg",
			"type": "人像写真"
		}
	],
	"total": 63,
	"page": 1,
	"pageSize": 20
}
```

接口为公开读接口，不需要登录。项目目前启用 TypeORM `synchronize`，服务启动后会自动创建 `hot_image` 表。
