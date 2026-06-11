---
name: "[feat]"
about: 기능 추가
title: ''
labels: enhancement
assignees: ''
type: Feature

---

## 📌 작업 내용
- 회원가입 API 구현

---

## 🛠️ 주요 할 일
- [ ] **작성 예시) 요청 / 응답 DTO 구현**
  * [ ] 작성 예시) 가입 요청 DTO (`SignUpRequestDto`) 생성
  * [ ] 작성 예시) `class-validator`를 통한 이메일 형식 및 닉네임 자수 벨리데이션 검증
- [ ] **작성 예시) JWT 인프라 연동**
  * [ ] 작성 예시) 회원가입 성공 시 자동 세션 로그인을 위한 JWT 발급 패키지 모듈 바인딩
  * [ ] 글로벌 예외 인터페이스 규격에 맞춘 토큰 예외 필터 처리
- [ ] **작성 예시) Controller / Service 구현**
  * [ ] 작성 예시) `AuthExpressController` 단 엔드포인트 매핑 및 글로벌 공통 응답 포맷 감싸기
- [ ] **작성 예시) Swagger API 문서화 정리**
  * [ ] 작성 예시)`@ApiTags('Auth')` 및 `@ApiOperation`을 이용한 설명 추가
