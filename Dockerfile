FROM node:22-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

ENV PNPM_SKIP_PREPARE=1


RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm prisma generate

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start:prod"]