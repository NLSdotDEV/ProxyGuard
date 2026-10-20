import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class InternalServerErrorException extends Exception {
  constructor(message?: string) {
    super(
      'ERR_INTERNAL_SERVER_ERROR',
      HttpStatusCode.InternalServerError,
      message,
    );
  }
}
