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

# Secretly Greatly Backend EC2 배포 작업 기록

## 작업 목표

NestJS 백엔드 서버를 Docker 컨테이너로 실행하고 AWS EC2 환경에 배포한다.

---

## 1. GitHub 작업

### 브랜치 생성

```bash
git switch -c feat-docker
```

### 원격 저장소 Push

초기 Push 시 권한 문제가 발생하였다.

```bash
git push origin feat-docker

remote: Permission denied
fatal: unable to access ...
```

팀 저장소 권한 설정 이후 Push 완료.

---

## 2. AWS EC2 인스턴스 생성

### 생성 정보

| 항목            | 값                       |
| ------------- | ----------------------- |
| OS            | Ubuntu Server 26.04 LTS |
| Instance Type | t3.micro                |
| Region        | ap-northeast-2          |
| Storage       | 30GB gp3                |
| Key Pair      | Secretly-key.pem        |

### 네트워크 설정

초기에는 Private Subnet을 선택하여 Public IP가 생성되지 않는 문제가 발생하였다.

기존 설정:

```txt
프로젝트-subnet-private2-ap-northeast-2b
```

수정 후:

```txt
프로젝트-subnet-public1-ap-northeast-2a
```

### Public IP 활성화

```txt
퍼블릭 IP 자동 할당
→ 활성화
```

---

## 3. 보안 그룹 설정

사용 중인 보안 그룹:

```txt
launch-wizard-3
```

인바운드 규칙:

| Protocol | Port |
| -------- | ---- |
| SSH      | 22   |
| HTTP     | 80   |
| HTTPS    | 443  |

3000 포트는 운영 환경을 고려하여 개방하지 않음.

---

## 4. EC2 접속

### SSH 연결

```bash
ssh -i Secretly-key.pem ubuntu@43.201.82.40
```

최초 접속 시:

```txt
Are you sure you want to continue connecting?
```

응답:

```txt
yes
```

접속 성공.

---

## 5. Docker 설치

### 패키지 업데이트

```bash
sudo apt update
```

### Docker 설치

```bash
sudo apt install -y docker.io
```

### Docker 실행

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

확인:

```bash
docker --version
```

---

## 6. Docker Compose 설치

```bash
sudo apt install -y docker-compose-v2
```

확인:

```bash
docker compose version
```

---

## 7. 프로젝트 Clone

```bash
git clone https://github.com/prgrms-fullcycle-devcourse/webfull_9_10_Secretly-Greatly_BE.git
```

프로젝트 디렉터리 이동:

```bash
cd webfull_9_10_Secretly-Greatly_BE
```

---

## 8. 환경 변수 파일 생성

프로젝트에 `.env` 파일이 존재하지 않아 직접 생성.

```env
PORT=3000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/secretly_greatly"
```

생성 확인:

```bash
ls -la
```

---

## 9. Docker 이미지 빌드 및 실행

실행:

```bash
sudo docker compose up -d --build
```

결과:

```txt
✔ backend Built
✔ Network Created
✔ Container secretly-greatly-backend Started
```

실행 확인:

```bash
sudo docker ps -a
```

결과:

```txt
secretly-greatly-backend
STATUS: Up
PORTS: 0.0.0.0:3000->3000/tcp
```

---

## 10. NestJS 실행 확인

로그 확인:

```bash
sudo docker logs secretly-greatly-backend
```

결과:

```txt
Nest application successfully started
Server running on http://localhost:3000
```

---

## 11. Nginx Reverse Proxy 설정

운영 환경에서는 3000 포트를 외부에 직접 노출하지 않기 위해 Nginx를 사용.

설치:

```bash
sudo apt install -y nginx
```

설정 파일 생성:

```bash
sudo nano /etc/nginx/sites-available/secretly-greatly
```

설정:

```nginx
server {
    listen 80;
    server_name 43.201.82.40;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

적용:

```bash
sudo ln -s /etc/nginx/sites-available/secretly-greatly /etc/nginx/sites-enabled/

sudo nginx -t

sudo systemctl restart nginx
```

---

## 12. 외부 접속 확인

접속:

```txt
http://43.201.82.40
```

응답:

```json
{
  "message": "Cannot GET /",
  "error": "Not Found",
  "statusCode": 404
}
```

이는 `/` 라우트가 존재하지 않기 때문이며,

```txt
브라우저
↓
EC2
↓
Nginx
↓
Docker
↓
NestJS
```

경로가 정상적으로 연결되었음을 의미한다.

---

## 현재 상태

### 완료

* EC2 생성
* Public Subnet 설정
* Public IP 할당
* SSH 접속
* Docker 설치
* Docker Compose 설치
* Git Clone
* .env 설정
* Docker Build
* NestJS 실행
* Nginx Reverse Proxy 설정
* 외부 접속 확인

### 향후 작업

* Health Check API 추가
* PostgreSQL 컨테이너 구성
* Prisma Migration 적용
* GitHub Actions CI/CD 구성
* 도메인 연결
* HTTPS 인증서(Let's Encrypt) 적용
* 운영용 Nginx 설정 정리

