# Secretly Greatly Backend

> VS Code UI로 위장한 실시간 주식 정보 및 커뮤니티 서비스

## 📖 프로젝트 소개

Secretly Greatly는 개발자 친화적인 UI를 제공하는 주식 정보 서비스입니다.

사용자는 VS Code를 연상시키는 인터페이스를 통해 관심 종목, 실시간 시세, 뉴스, 커뮤니티 반응 등을 확인할 수 있습니다.

---

## 🛠 기술 스택

### Backend

* NestJS
* TypeScript
* Prisma
* PostgreSQL
* Docker

### Infrastructure

* AWS EC2
* Nginx
* Docker Compose

---

## 📁 프로젝트 구조

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
└── .env
```

---

## 🚀 로컬 실행

### 1. 저장소 Clone

```bash
git clone https://github.com/prgrms-fullcycle-devcourse/webfull_9_10_Secretly-Greatly_BE.git

cd webfull_9_10_Secretly-Greatly_BE
```

### 2. 환경 변수 설정

`.env`

```env
PORT=3000
DATABASE_URL=your_database_url
```

### 3. 의존성 설치

```bash
npm install
```

### 4. Prisma Client 생성

```bash
npx prisma generate
```

### 5. 개발 서버 실행

```bash
npm run start:dev
```

---

## 🐳 Docker 실행

### 이미지 빌드

```bash
docker compose build
```

### 컨테이너 실행

```bash
docker compose up -d
```

### 컨테이너 확인

```bash
docker ps
```

---

## ☁️ 배포 환경

### AWS EC2

* Ubuntu Server 26.04 LTS
* t3.micro
* Docker
* Docker Compose
* Nginx Reverse Proxy

### 네트워크 구성

```text
Client
  ↓
Nginx (80,443)
  ↓
NestJS Container (3000)
```

---

## 📌 현재 진행 상황

### 완료

* NestJS 프로젝트 구성
* Prisma 설정
* Docker 환경 구성
* Docker Compose 구성
* EC2 배포
* Nginx Reverse Proxy 설정
* 외부 접속 확인

### 진행 예정

* PostgreSQL 연동
* Prisma Migration
* 실제 API 구현
* JWT 인증
* Supabase 연동
* GitHub Actions CI/CD
* HTTPS 적용
* 도메인 연결

---

## 👨‍💻 Team

Programmers Full Cycle DevCourse 9기

Secretly Greatly Team
