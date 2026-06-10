export class CustomResponse<T> {
  constructor(
    public readonly data: T | null,
    public readonly message: string = "요청이 성공적으로 처리되었습니다.",
  ) {}
  static success<T>(data: T, message?: string): CustomResponse<T> {
    return new CustomResponse(data, message);
  }

  static empty(message?: string): CustomResponse<null> {
    return new CustomResponse(null, message);
  }
}
