import { ApiResponseOptions } from "@nestjs/swagger";

// 📈 VSCode 상태 표시줄 위장 선행지표 조회 성공 응답 명세 (200 OK)
export const INDICATOR_STATUSBAR_SUCCESS_RESPONSE: ApiResponseOptions = {
  status: 200,
  description: "VSCode 에디터 하단 상태 표시줄(Status Bar) 위장 선행지표 캐시 조회가 완료되었습니다.",
  schema: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: {
        type: "string",
        example: "VSCode 에디터 하단 상태 표시줄(Status Bar) 위장 선행지표 캐시 조회가 완료되었습니다.",
      },
      data: {
        type: "object",
        properties: {
          totalComponents: { type: "number", example: 5 },
          singleLineStream: {
            type: "string",
            example:
              "KSP 2684.50 (-0.42)  |  NSQ 18450.25 (1.15)  |  USDKRW 1375.40 (0.22)  |  US10Y 4.352 (-1.05)  |  VIX 14.85 (-3.12)",
          },
          components: {
            type: "array",
            items: {
              type: "object",
              properties: {
                componentId: { type: "string", example: "status.market.kospi" },
                label: { type: "string", example: "KSP" },
                value: { type: "string", example: "2684.50 (-0.42)" },
              },
            },
          },
        },
      },
    },
  },
};
