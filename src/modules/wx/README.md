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

模板模块启动时会幂等创建一个“空白问卷”系统模板。

## 核心流程

1. 小程序调用 `wx.login`，将 `code` 传给 `POST /api/wx/auth/login`。
2. 调用 `GET /api/wx/templates` 选择模板，或直接创建空白问卷。
3. 调用 `POST /api/wx/questionnaires` 创建问卷，通过 `PUT` 修改内容。
4. 调用 `POST /api/wx/questionnaires/:id/shares` 获取问卷分享 token。
5. 好友登录后调用 `GET /api/wx/shares/:token` 查看问卷，再调用
   `POST /api/wx/shares/:token/answers` 提交答卷。
6. 答题者调用 `POST /api/wx/answers/:id/shares` 分享答卷，出题者登录后通过
   `GET /api/wx/shares/:token` 查看。答卷分享会校验当前用户必须是出题者或
   答题者。
7. 出题者调用 `GET /api/wx/answers?scope=received` 查看收到的答卷；答题者使用
   `scope=submitted` 查看自己提交的答卷。

模板、问卷及答卷内容采用 JSON 字段，小程序可以自行定义题型结构。例如：

```json
{
  "questions": [
    {
      "id": "question-1",
      "type": "single-choice",
      "title": "你的选择是？",
      "required": true,
      "options": ["A", "B"]
    }
  ],
  "settings": {}
}
```
