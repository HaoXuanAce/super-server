FROM node:22-alpine

WORKDIR /app

# 启用 corepack
RUN corepack enable

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码并构建
COPY . .
RUN pnpm run build

# 生产环境配置
ENV NODE_ENV=production
ENV PORT=3000

# 清理开发依赖
RUN pnpm prune --prod

EXPOSE 3000

CMD ["node", "dist/main"]
