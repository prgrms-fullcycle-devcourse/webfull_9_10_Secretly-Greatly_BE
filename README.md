# Secretly Great 백엔드 진행 현황

## 프로젝트 정보

* 프로젝트명: Secretly Great
* 목적: VS Code UI로 위장한 주식 정보 서비스
* 기술 스택

  * NestJS
  * TypeScript
  * Prisma
  * PostgreSQL (Supabase 예정)
  * Docker
  * AWS EC2 예정

---

# 진행 내용

## 1. AWS 환경 준비

### 완료

* AWS 계정 생성
* EC2 인스턴스 생성
* 기존 테스트 인스턴스 정리
* 신규 EC2 생성

### 예정

* Docker 설치
* Git Clone
* 서비스 배포
* Nginx 설정
* SSL 적용

---

## 2. 백엔드 프로젝트 초기 구성

### 생성된 구조

```text
webfull_9_10_Secretly-Greatly_BE
├── prisma
├── src
│   ├── common
│   ├── config
│   ├── modules
│   ├── app.module.ts
│   └── main.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── .gitignore
```

---

## 3. Prisma 설정

### 완료

* Prisma 설치
* Prisma Client 생성
* schema.prisma 구성

### 발생한 문제

#### Prisma 7 자동 설치

```bash
npx prisma generate
```

실행 시 Prisma 7이 설치되며 datasource 관련 오류 발생

#### 해결

```bash
npm install prisma@6.19.0 @prisma/client@6.19.0
```

설치 후 정상 동작 확인

---

## 4. NestJS 설정

### 발생한 문제

```text
Could not find TypeScript configuration file "tsconfig.json"
```

### 해결

생성

```text
tsconfig.json
tsconfig.build.json
nest-cli.json
```

---

## 5. TypeScript 설정

### 발생한 문제

Node 타입 인식 실패

```text
Cannot find name 'process'
```

### 해결

```bash
npm install -D @types/node
```

tsconfig.json

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

---

## 6. Docker 설정

### Dockerfile

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

### docker-compose.yml

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

## 7. Docker 빌드 과정

### 성공

```bash
docker compose build --no-cache
```

성공적으로 이미지 생성

---

## 8. Docker 실행 문제

### 문제

```text
Cannot find module '/app/dist/main'
```

### 원인

Nest Build 시 Docker 내부에서 JS 파일 생성 실패

### 해결

Dockerfile 수정

기존

```dockerfile
RUN npm run build
```

변경

```dockerfile
RUN npx tsc -p tsconfig.build.json
```

---

## 9. Docker 실행 성공

### 실행

```bash
docker compose up
```

### 로그

```text
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [NestApplication] Nest application successfully started

Server running on http://localhost:3000
```

### 백그라운드 실행

```bash
docker compose up -d
```

### 확인

```bash
docker ps
```

결과

```text
CONTAINER ID   d08a98ace4be
IMAGE          webfull_9_10_secretly-greatly_be-backend
STATUS         Up
PORTS          0.0.0.0:3000->3000/tcp
```

---

## 10. Git 설정

### .gitignore 작성

포함

```gitignore
node_modules/
dist/

.env
.env.*

!.env.example

*.log
*.tsbuildinfo

.vscode/
.idea/
```

### 확인

```bash
git status --ignored
```

결과

```text
Ignored files:
.env
dist
node_modules
```

정상 확인

---

## 11. GitHub Push 문제

### 발생

```bash
git push origin feat-docker
```

오류

```text
remote: Permission denied to leejh2114
fatal: 403
```

### 원인

현재 GitHub 계정(leejh2114)에
저장소 push 권한 없음

### 해결 예정

* GitHub 계정 재로그인
  또는
* 저장소 관리자에게 권한 요청

---

# 현재 상태

## 완료

* NestJS 프로젝트 생성
* Prisma 설정
* TypeScript 설정
* Dockerfile 작성
* docker-compose 작성
* Docker 이미지 빌드 성공
* Docker 컨테이너 실행 성공
* localhost:3000 서버 실행 성공
* .gitignore 작성

## 진행 중

* GitHub Push 권한 해결

## 예정

* EC2 Docker 설치
* Git Clone
* Docker 배포
* Nginx 설정
* 도메인 연결
* HTTPS(SSL) 적용
* Supabase 연결
* 실제 API 구현
