export default {
  // 기본적으로 널리 쓰이는 표준 규칙(Conventional)을 베이스로 가져옴
  extends: ["@commitlint/config-conventional"],
  
  rules: {
    // 허용할 커밋 메시지 타입 목록을 딱 아래 규칙들로만 제한
    "type-enum": [
      2, // Error(위반 시 커밋 차단)'
      "always",
      [
        "feat",     // 새로운 기능 추가
        "fix",      // 버그 수정
        "docs",     // 문서 수정 (README 등, 코드 변경 없음)
        "style",    // 코드 포맷팅, 세미콜론 누락 등 스타일 변경 (논리 변경 없음)
        "refactor", // 코드 리팩토링 (기능 변화 없음)
        "test",     // 테스트 코드 추가 및 수정
        "chore",    // 빌드 업무, 패키지 매니저 설정 등 (설정 파일 변경)
        "design",   // css등 사용자 UI 디자인 변경
        "comment",  // 필요한 주석 추가 및 변경
        "rename",   // 파일 혹은 폴더명을 수정하거나 옮기는 작업만인 경우
        "remove",	// 파일을 삭제하는 작업만 수행한 경우
        "!HOTFIX",	// 급하게 치명적인 버그를 고쳐야하는 경우
      ],
    ],
    // 제목은 필수이며, 항상 소문자로 시작할 필요는 없도록 설정
    "type-case": [0, "always"],
    "subject-case": [0, "always"],
  },
};