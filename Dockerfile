FROM node:20

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm","--filter","@workspace/api-server","start"]