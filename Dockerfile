# 多阶段构建 Dockerfile for Nuxt.js

# 阶段 1: 依赖安装
FROM node:20-alpine AS deps
WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm ci

# 阶段 2: 构建应用
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建 Nuxt 应用
RUN npm run build

# 阶段 3: 生产运行
FROM node:20-alpine AS runner
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# 复制构建产物和必要文件
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

# 切换到非 root 用户
USER nuxtjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", ".output/server/index.mjs"]
