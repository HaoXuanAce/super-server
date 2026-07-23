# 微信小程序问卷模块

该模块与网站业务完全隔离，所有接口位于 `/api/wx`，所有数据表使用
`wx_` 前缀。微信业务代码不会读取或写入原网站业务表。

## 环境变量

```env
WX_APP_ID=微信小程序 AppID
WX_APP_SECRET=微信小程序 AppSecret
WX_JWT_SECRET=小程序 JWT 密钥
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`WX_JWT_SECRET` 未配置时会兼容使用现有 `JWT_SECRET`，但仍会校验 JWT 中的
`platform=wx`，网站登录令牌不能用于小程序接口。生产环境建议单独配置
`WX_JWT_SECRET`。

项目已启用 TypeORM `synchronize`，应用启动时会根据实体自动创建或更新以下表：

- `wx_user`
- `wx_questionnaire_template`
- `wx_questionnaire`
- `wx_answer`
- `wx_share`

这 5 张表的主键以及表之间的关联 ID 均使用 `INT UNSIGNED AUTO_INCREMENT`。
分享链接使用的 `token` 仍是随机字符串，它不是数据库主键。系统预设使用
`preset_key` 做稳定识别，实际模板 `id` 同样是自增数字。

如果需要重建微信业务表，请先停止应用，再删除上面 5 张 `wx_*` 表并重新启动。
TypeORM 会自动建表，模板模块随后会重新写入系统预设。重建后应清除小程序本地
保存的旧登录令牌；也可以同时更换 `WX_JWT_SECRET`，确保旧令牌全部失效。

## 题库分类与用户上传

题库分类接口：

```text
GET /api/wx/templates/categories
```

分类代码和名称：

- `abstract`：抽象题库
- `boyfriend_challenge`：折磨男朋友题库
- `first_meeting`：初认识题库
- `make_friends`：结交朋友题库
- `blind_date`：相亲题库
- `marriage`：结婚题库
- `men`：男生题库

用户在“我的试卷”中选择分类，将试卷直接上传到题库广场：

```text
POST /api/wx/questionnaires/:id/publish-to-library
```

```json
{
  "category": "blind_date"
}
```

上传时会从当前试卷深拷贝一条公开快照，原试卷后续编辑不会影响已经上传的版本。
用户可以删除自己的公开快照将其撤下。每天最多上传 3 套，已经撤下的题库仍计入
当天次数，避免通过删除绕过限制。

查询当天剩余上传次数：

```text
GET /api/wx/templates/upload-quota
```

公共题库列表（系统预设和用户上传）：

```text
GET /api/wx/templates?scope=library&category=blind_date
```

只查看用户上传的公开题库：

```text
GET /api/wx/templates?scope=public
```

列表和详情会返回完整 `content`，用户上传的题库还会返回发布者信息：

```json
{
  "publisher": {
    "id": 12,
    "nickname": "用户昵称",
    "avatarUrl": "https://example.com/avatar.png"
  }
}
```

其他用户在创建试卷时直接传入公开题库的 `sourceTemplateId`。系统会将题库内容
深拷贝为用户自己的试卷，不会修改公共题库内容。

## 题库热度

系统预设和用户公开题库都包含 `heat` 字段，初始值为 `0`。以下行为成功后会
原子增加来源题库的热度：

- 调用 `POST /api/wx/questionnaires` 并传入系统或公开题库的
  `sourceTemplateId`

题库列表默认先按 `heat` 从高到低排序；热度相同时，系统预设优先，然后按发布
时间和创建时间倒序排列。

模板模块启动时会幂等同步系统预设模板。每套预设位于
`src/modules/wx/template/presets` 下的独立文件中，目前包括：

- 空白问卷
- 第一次约会指南
- 我们的爱的语言
- 周末合拍测试
- 相亲前的认真了解清单
- 确定恋爱关系前必聊的问题
- 婚前深度沟通问卷

系统预设由代码维护，用户不能直接修改或删除。用户从预设创建试卷后，可以自由
修改自己的试卷，基础预设不会受到影响。

## 核心流程

1. 小程序调用 `wx.login`，将 `code` 传给 `POST /api/wx/auth/login`。
2. 调用 `GET /api/wx/templates?scope=library` 查看题库广场。
3. 调用 `POST /api/wx/questionnaires` 并传入 `sourceTemplateId`，将公共题库直接
   保存为自己的独立试卷。
4. 通过 `PUT /api/wx/questionnaires/:id` 修改试卷内容。
5. 调用 `POST /api/wx/questionnaires/:id/publish-to-library` 上传公开题库快照。
6. 调用 `POST /api/wx/questionnaires/:id/shares` 获取试卷分享 token。
7. 好友登录后调用 `GET /api/wx/shares/:token` 查看问卷，再调用
   `POST /api/wx/shares/:token/answers` 提交答卷。
8. 答题者调用 `POST /api/wx/answers/:id/shares` 分享答卷，出题者登录后通过
   `GET /api/wx/shares/:token` 查看。答卷分享会校验当前用户必须是出题者或
   答题者。
9. 出题者调用 `GET /api/wx/answers?scope=received` 查看收到的答卷；答题者使用
   `scope=submitted` 查看自己提交的答卷。

模板、问卷及答卷内容采用 JSON 字段，小程序可以自行定义题型结构。例如：

```json
{
  "questions": [
    {
      "id": "question-1",
      "type": "single",
      "title": "你的选择是？",
      "required": true,
      "options": ["A", "B"]
    }
  ],
  "settings": {}
}
```
