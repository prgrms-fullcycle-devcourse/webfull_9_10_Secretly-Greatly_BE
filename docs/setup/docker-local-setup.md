# Docker 기반 NestJS 백엔드 로컬 실행 환경 구축

## 개요

Secretly Great 백엔드 프로젝트의 로컬 개발 환경을 Docker 기반으로 구성한다.

본 문서는 다음 항목을 포함한다.

* NestJS 환경 구성
* Prisma 설정
* Docker 이미지 생성
* Docker Compose 실행
* 환경 변수 관리
* Git Ignore 설정

---

# 개발 환경

| 항목             | 버전     |
| -------------- | ------ |
| Node.js        | 22.x   |
| NestJS         | 11.x   |
| TypeScript     | 5.x    |
| Prisma         | 6.19.0 |
| Docker         | Latest |
| Docker Compose | Latest |

---

# 프로젝트 구조

```text
webfull_9_10_Secretly-Greatly_BE
├── prisma
│   └── schema.prisma
│
├── src
│   ├── common
│   ├── config
│   ├── modules
│   ├── app.module.ts
│   └── main.ts
│
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── nest-cli.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

---

# Prisma 설정

## Prisma 설치

```bash
npm install prisma@6.19.0 @prisma/client@6.19.0
```

## Prisma Client 생성

```bash
npx prisma generate
```

정상 실행 시 다음과 같은 메시지가 출력된다.

```text
✔ Generated Prisma Client
```

---

# TypeScript 설정

## tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["node"],
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "incremental": false,
    "strict": false,
    "skipLibCheck": true
  }
}
```

---

## tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

---

## nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

---

# Docker 설정

## Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npx tsc -p tsconfig.build.json

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

---

## docker-compose.yml

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile

    container_name: secretly-greatly-backend

    ports:
      - "3000:3000"

    env_file:
      - .env

    restart: unless-stopped
```

---

## .dockerignore

```text
node_modules
dist
.git
.env
npm-debug.log
```

---

# 환경 변수 설정

## .env

```env
PORT=3000

DATABASE_URL=

JWT_SECRET=

NODE_ENV=development
```

---

## .env.example

```env
PORT=3000

DATABASE_URL=

JWT_SECRET=

NODE_ENV=development
```

---

# Git Ignore 설정

## .gitignore

```gitignore
# Dependencies
node_modules/

# Build Output
dist/

# Environment
.env
.env.*
!.env.example

# Logs
*.log

# TypeScript
*.tsbuildinfo

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

# Docker 빌드

이미지 생성

```bash
docker compose build --no-cache
```

---

# Docker 실행

포그라운드 실행

```bash
docker compose up
```

백그라운드 실행

```bash
docker compose up -d
```

---

# 컨테이너 확인

```bash
docker ps
```

예상 결과

```text
CONTAINER ID
IMAGE
STATUS
PORTS

0.0.0.0:3000->3000/tcp
```

---

# 로그 확인

```bash
docker compose logs -f
```

정상 실행 시

```text
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [NestApplication] Nest application successfully started

Server running on http://localhost:3000
```

---

# 컨테이너 종료

```bash
docker compose down
```

---

# 현재 진행 상태

## 완료

* NestJS 프로젝트 설정
* Prisma 설정
* TypeScript 설정
* Docker 환경 구성
* Docker 이미지 빌드 성공
* Docker 컨테이너 실행 성공
* localhost:3000 서버 실행 확인
* .gitignore 및 .dockerignore 설정

## 다음 작업

* GitHub Push 권한 해결
* AWS EC2 Docker 설치
* Git Clone
* Docker 배포
* Nginx 설정
* HTTPS 적용
* Supabase 연결
* 실제 API 개발
