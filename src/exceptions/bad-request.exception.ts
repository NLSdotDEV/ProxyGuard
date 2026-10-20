import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class BadRequestException extends Exception {
  constructor(message?: string) {
    super('ERR_BAD_REQUEST', HttpStatusCode.BadRequest, message);
  }
}
