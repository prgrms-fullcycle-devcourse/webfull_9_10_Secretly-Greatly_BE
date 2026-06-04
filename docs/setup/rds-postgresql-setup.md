# RDS(PostgreSQL) 연동 및 Prisma 적용

## Amazon RDS 생성

* Engine : PostgreSQL
* DB Instance : db.t3.micro
* Storage : 20GiB (gp3)
* Database Name : secret_db
* Public Access : No
* VPC : Secretly-Greatly-vpc

## 네트워크 설정

* EC2 ↔ RDS 통신 구성
* Security Group PostgreSQL(5432) 허용
* EC2에서 RDS 접속 테스트 성공

## PostgreSQL 연결 확인

```bash
psql -h <RDS_ENDPOINT> -U SGjhlee98 -d secret_db
```

* SSL 연결 성공
* PostgreSQL 접속 성공

## Prisma 연동

* DATABASE_URL을 RDS Endpoint로 변경
* Docker 컨테이너 재배포
* Prisma DB 연결 확인
* Prisma Schema 적용

```bash
npx prisma db push
```

실행 완료

## 테이블 생성 확인

생성 테이블

* users
* user_settings
* stocks
* watchlists
* positions
* position_simulations
* chat_rooms
* chat_messages
* chat_reports
* anonymous_sessions
* market_snapshots
* market_indicators
* economic_events
* alert_logs
* news

총 15개 테이블 생성 확인

## 애플리케이션 상태

* Docker Container 정상 실행
* NestJS 정상 기동
* Health Check 성공

```json
{
  "status": "ok",
  "message": "Secretly Greatly Backend is running"
}
```
