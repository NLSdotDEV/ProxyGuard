export class Exception extends Error {
  private errorCode: string;
  private statusCode: number;

  constructor(errorCode: string, statusCode: number, message?: string) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }

  toObject() {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
    };
  }

  getStatusCode(): number {
    return this.statusCode;
  }
}
