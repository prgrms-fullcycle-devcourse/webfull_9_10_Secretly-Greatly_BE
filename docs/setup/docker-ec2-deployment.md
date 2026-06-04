# Docker 기반 EC2 테스트 배포 서버 구축

## 개요

Secretly-Greatly 백엔드 프로젝트의 테스트 배포 환경을 AWS EC2 + Docker + Nginx 기반으로 구축하였다.

---

## 배포 환경

| 항목            | 내용                               |
| ------------- | -------------------------------- |
| Cloud         | AWS EC2                          |
| Region        | ap-northeast-2 (서울)              |
| OS            | Ubuntu Server 26.04 LTS          |
| Instance Type | t3.micro                         |
| Container     | Docker                           |
| Orchestration | Docker Compose                   |
| Reverse Proxy | Nginx                            |
| Application   | NestJS                           |
| Repository    | webfull_9_10_Secretly-Greatly_BE |

---

## 네트워크 구성

### VPC 생성

기존 프로젝트에서 사용하던 VPC가 다른 팀 자원인 것으로 확인되어 전용 VPC를 신규 생성하였다.

생성 리소스:

* Secretly-Greatly-vpc
* Internet Gateway
* Public Subnet (2개)
* Private Subnet (2개)
* Route Table
* S3 Endpoint

구성:

```text
Secretly-Greatly-vpc
├── Public Subnet 1 (ap-northeast-2a)
├── Public Subnet 2 (ap-northeast-2b)
├── Private Subnet 1 (ap-northeast-2a)
└── Private Subnet 2 (ap-northeast-2b)
```

---

## Security Group 설정

보안 그룹 생성:

```text
Secretly-Greatly-SG
```

인바운드 규칙:

| Protocol | Port | Source    |
| -------- | ---- | --------- |
| SSH      | 22   | 0.0.0.0/0 |
| HTTP     | 80   | 0.0.0.0/0 |
| HTTPS    | 443  | 0.0.0.0/0 |

설명:

* SSH 접속용
* Nginx HTTP 서비스용
* HTTPS 적용 대비

---

## EC2 생성

인스턴스 정보:

```text
Name: Secretly-Greatly-Instance
AMI: Ubuntu Server 26.04 LTS
Type: t3.micro
Storage: 30GB (gp3)
Key Pair: Secretly-key
```

퍼블릭 IP:

```text
3.38.95.246
```

SSH 접속:

```bash
ssh -i Secretly-key.pem ubuntu@3.38.95.246
```

---

## 서버 초기 설정

패키지 업데이트:

```bash
sudo apt update
sudo apt upgrade -y
```

Git 설치 확인:

```bash
git --version
```

Docker 설치:

```bash
sudo apt update

sudo apt install docker.io docker-compose-v2 -y

sudo systemctl enable docker
sudo systemctl start docker
```

Docker 확인:

```bash
docker --version
docker compose version
```

---

## 프로젝트 배포

### Repository Clone

```bash
git clone https://github.com/prgrms-fullcycle-devcourse/webfull_9_10_Secretly-Greatly_BE.git

cd webfull_9_10_Secretly-Greatly_BE
```

---

### 프로젝트 구조 확인

```bash
ls -al
```

확인 파일:

```text
Dockerfile
docker-compose.yml
package.json
prisma/
src/
```

---

### 환경 변수 생성

```bash
nano .env
```

예시:

```env
PORT=3000
DATABASE_URL="postgresql://test:test@localhost:5432/test"
```

---

## Docker Build 및 실행

빌드:

```bash
docker compose up -d --build
```

실행 확인:

```bash
docker ps
```

결과:

```text
secretly-greatly-backend
```

---

## 컨테이너 로그 확인

```bash
docker logs secretly-greatly-backend
```

정상 로그:

```text
Nest application successfully started
Server running on http://localhost:3000
```

---

## Health Check 확인

서버 내부 확인:

```bash
curl http://localhost:3000
```

응답:

```json
{
  "status": "ok",
  "message": "Secretly Greatly Backend is running"
}
```

배포 성공 확인.

---

## Nginx Reverse Proxy 설정

설치:

```bash
sudo apt install nginx -y
```

설정 파일 생성:

```bash
sudo nano /etc/nginx/sites-available/secretly-greatly
```

설정:

```nginx
server {
    listen 80;
    server_name 3.38.95.246;

    location / {
        proxy_pass http://127.0.0.1:3000;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/secretly-greatly /etc/nginx/sites-enabled/

sudo rm -f /etc/nginx/sites-enabled/default
```

설정 검사:

```bash
sudo nginx -t
```

재시작:

```bash
sudo systemctl reload nginx
```

---

## 최종 배포 구조

```text
Internet
    ↓
AWS EC2
    ↓
Nginx (80)
    ↓
Docker Container
    ↓
NestJS (3000)
```

---

## 결과

구축 완료 항목:

* VPC 구성
* Public/Private Subnet 구성
* Internet Gateway 연결
* Security Group 설정
* EC2 생성
* Docker 설치
* GitHub Repository Clone
* Docker Build
* NestJS 실행
* Health Check 확인
* Nginx Reverse Proxy 설정

테스트 배포 서버 구축 완료.
