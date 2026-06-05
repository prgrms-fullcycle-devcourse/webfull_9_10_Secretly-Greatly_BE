# GitHub Actions 기반 자동 배포(CI/CD) 구축

## 개요

Secretly-Greatly 백엔드 프로젝트의 배포 과정을 자동화하기 위해 GitHub Actions 기반 CI/CD 환경을 구축하였다.

기존에는 EC2 서버에 접속하여 수동으로 배포 스크립트를 실행했지만, GitHub Actions를 활용하여 main 브랜치 변경 사항이 반영될 때 자동으로 배포가 수행되도록 구성하였다.

---

## 목표

* 배포 과정 자동화
* 수동 배포 작업 제거
* 배포 실수 방지
* 최신 코드 자동 반영

---

## 배포 흐름

```text
Developer
    ↓
GitHub Pull Request Merge
    ↓
main Branch Update
    ↓
GitHub Actions 실행
    ↓
EC2 SSH 접속
    ↓
deploy.sh 실행
    ↓
Docker 이미지 재빌드
    ↓
Container 재기동
    ↓
배포 완료
```

---

## GitHub Repository Secrets 설정

GitHub Actions에서 EC2 서버에 SSH 접속하기 위해 Repository Secrets를 등록하였다.

### 등록 항목

| Name        | 설명                  |
| ----------- | ------------------- |
| EC2_HOST    | EC2 Public IP       |
| EC2_USER    | SSH 사용자 계정          |
| EC2_SSH_KEY | EC2 접속용 Private Key |

### 등록 위치

```text
Repository
 └─ Settings
     └─ Secrets and variables
         └─ Actions
```

---

## deploy.sh 구성

EC2 서버에서 배포를 수행하기 위한 스크립트를 작성하였다.

경로

```text
/home/ubuntu/webfull_9_10_Secretly-Greatly_BE/deploy.sh
```

내용

```bash
#!/bin/bash
set -e

cd /home/ubuntu/webfull_9_10_Secretly-Greatly_BE

git pull origin main

docker compose up -d --build

docker image prune -f
```

### 동작 설명

| 명령어                          | 설명                 |
| ---------------------------- | ------------------ |
| git pull origin main         | 최신 코드 반영           |
| docker compose up -d --build | 이미지 재빌드 및 컨테이너 재실행 |
| docker image prune -f        | 사용하지 않는 이미지 정리     |

---

## GitHub Actions Workflow 작성

경로

```text
.github/workflows/deploy.yml
```

내용

```yaml
name: Deploy to EC2

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ubuntu/webfull_9_10_Secretly-Greatly_BE
            ./deploy.sh
```

---

## 배포 테스트

### 테스트 절차

1. feature 브랜치 개발
2. Pull Request 생성
3. main 브랜치 Merge
4. GitHub Actions 자동 실행
5. EC2 배포 수행
6. Health Check 확인

### 확인 항목

* GitHub Actions 성공 여부
* Docker Container 정상 실행 여부
* 서버 로그 확인
* Health Check 응답 확인

---

## 기대 효과

* 배포 자동화
* 배포 시간 단축
* 운영 효율 향상
* 휴먼 에러 감소
* 최신 코드 자동 반영

---

## 향후 개선 사항

### CI 단계 추가

* pnpm lint
* pnpm build
* 테스트 자동 실행

### CD 단계 개선

* Blue-Green Deployment
* Rollback 전략 구축
* Docker Registry 연동
* 무중단 배포 적용

---

## 결과

GitHub Actions와 EC2 SSH 배포 방식을 활용하여 main 브랜치 변경 사항이 자동으로 서버에 반영되는 CI/CD 환경을 구축하였다.

이를 통해 수동 배포 과정을 제거하고 안정적인 배포 프로세스를 마련하였다.
