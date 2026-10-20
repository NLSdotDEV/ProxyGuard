import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class UnprocessableEntityException extends Exception {
  constructor(message?: string) {
    super(
      'ERR_UNPROCESSABLE_ENTITY',
      HttpStatusCode.UnprocessableEntity,
      message,
    );
  }
}
