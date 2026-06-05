import typescriptEslintParser from "@typescript-eslint/parser";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  // Prettier 충돌 방지 기본 설정 레이어
  eslintConfigPrettier,

  {
    // 대상 파일 지정 (TypeScript 파일 전체)
    files: ["**/*.ts", "**/*.tsx"],
    
    languageOptions: {
      // 모듈 시스템: CommonJS 기반 분석 설정
      sourceType: "commonjs",
      parser: typescriptEslintParser,
      parserOptions: {
        // @typescript-eslint/no-floating-promises 등 프로젝트 타입 정보 기반 규칙 작동을 위해 필수
        project: "./tsconfig.json", 
      },
    },

    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      "prettier": eslintPluginPrettier,
    },

    rules: {
      // 2. Prettier 연동 및 개행 에러 자동 설정 (위반 시 error 처리)
      "prettier/prettier": ["error", { "endOfLine": "auto" }],

      // 3. 요청하신 TypeScript 세부 규칙 설정
      "@typescript-eslint/no-explicit-any": "off", // 유연한 초기 개발을 위해 any 허용
      "@typescript-eslint/no-floating-promises": "warn", // await/catch 누락 시 경고
      "@typescript-eslint/no-unsafe-argument": "warn", // 검증되지 않은 인자 전달 시 경고
    },
  },
];