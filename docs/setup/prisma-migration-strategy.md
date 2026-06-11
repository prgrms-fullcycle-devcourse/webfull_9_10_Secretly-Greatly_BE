# Prisma Migration 도입 및 DB 협업 전략

## 개요

Secretly-Greatly 백엔드 프로젝트의 데이터베이스 협업 방식을 정리하고, Prisma Migration 기반의 스키마 관리 체계를 도입하였다.

기존에는 Prisma의 `db push` 기능을 사용하여 스키마를 데이터베이스에 직접 반영하였으나, 협업 환경에서는 스키마 변경 이력을 추적하기 어렵고 데이터베이스 상태가 개발자마다 달라질 수 있는 문제가 발생할 수 있다.

이를 해결하기 위해 Prisma Migration 기반의 협업 방식으로 전환하였다.

---

## 기존 방식

### Prisma DB Push

```bash
pnpm prisma db push
```

#### 장점

* 빠르게 테이블 생성 가능
* 초기 개발 속도가 빠름

#### 단점

* 스키마 변경 이력 관리 불가
* 협업 시 DB 구조 동기화 어려움
* 배포 환경에 안전하게 반영하기 어려움
* 누가 어떤 변경을 했는지 추적 불가

---

## 도입 방식

### Prisma Migration

개발 환경

```bash
pnpm prisma migrate dev --name migration_name
```

배포 환경

```bash
pnpm prisma migrate deploy
```

Migration 파일을 Git으로 관리하여 모든 개발자가 동일한 데이터베이스 구조를 사용할 수 있도록 구성하였다.

---

## Migration 초기 생성

현재 Prisma Schema 기준으로 초기 Migration을 생성하였다.

```bash
pnpm prisma migrate dev --name init
```

생성 결과

```txt
prisma/
└── migrations/
    └── 20260605052429_init/
        └── migration.sql
```

---

## 로컬 개발 환경

각 개발자는 로컬 PostgreSQL 데이터베이스를 사용한다.

예시

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/secret_db"
```

또는 환경에 따라 포트를 변경하여 사용 가능하다.

```env
DATABASE_URL="postgresql://postgres:1234@localhost:15432/secret_db"
```

---

## 로컬 DB 생성 예시

Docker 기반 PostgreSQL

```bash
docker run --name secretly-greatly-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=1234 \
  -e POSTGRES_DB=secret_db \
  -p 5432:5432 \
  -d postgres:16
```

---

## 개발자 작업 순서

### 1. Schema 수정

```prisma
model User {
  ...
}
```

### 2. Migration 생성

```bash
pnpm prisma migrate dev --name add_user_table
```

### 3. Migration 파일 생성 확인

```txt
prisma/migrations/
```

### 4. Git Commit

```bash
git add prisma/migrations
git commit
```

### 5. Pull Request 생성

Migration 파일을 반드시 포함하여 PR 생성

---

## 최신 코드 반영

다른 개발자가 생성한 Migration을 반영할 경우

```bash
git pull origin main

pnpm install

pnpm prisma migrate dev
```

실행 시 최신 Migration이 로컬 DB에 자동 반영된다.

---

## 배포 환경

### AWS 구성

```txt
GitHub Actions
        ↓
EC2
        ↓
Docker Container
        ↓
AWS RDS PostgreSQL
```

RDS는 배포 환경 전용으로 사용한다.

개발자는 직접 RDS에 접속하지 않는다.

---

## Deploy Script 수정

배포 시 Migration이 자동 적용되도록 구성하였다.

### deploy.sh

```bash
#!/bin/bash
set -e

cd /home/ubuntu/webfull_9_10_Secretly-Greatly_BE

git pull origin main

docker compose up -d --build

docker compose exec -T backend npx prisma migrate deploy

docker image prune -f
```

---

## 배포 프로세스

```txt
schema.prisma 수정
        ↓
migrate dev
        ↓
migration 파일 생성
        ↓
Git Commit
        ↓
Pull Request
        ↓
Merge
        ↓
GitHub Actions
        ↓
EC2 배포
        ↓
prisma migrate deploy
        ↓
RDS 반영
```

---

## 팀 협업 규칙

### 사용

```bash
pnpm prisma migrate dev
```

```bash
pnpm prisma migrate deploy
```

### 사용 금지

```bash
pnpm prisma db push
```

---

## 주의사항

### PostgreSQL 포트 충돌

Mac 또는 Windows 환경에서 기존 PostgreSQL이 실행 중인 경우 Docker PostgreSQL과 충돌할 수 있다.

확인 방법

```bash
lsof -i :5432
```

또는

```bash
netstat -ano | findstr 5432
```

기존 PostgreSQL이 실행 중이라면 종료하거나 다른 포트를 사용한다.

예시

```bash
-p 15432:5432
```

```env
DATABASE_URL="postgresql://postgres:1234@localhost:15432/secret_db"
```

---

## 결론

* 로컬 개발은 각자 PostgreSQL 사용
* AWS RDS는 배포 서버 전용
* Prisma Migration을 Git으로 관리
* 배포 시 Migration 자동 적용
* 데이터베이스 구조를 모든 개발자가 동일하게 유지
* 협업 및 배포 안정성 향상
