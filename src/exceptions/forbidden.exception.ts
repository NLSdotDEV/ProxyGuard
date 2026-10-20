import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class ForbiddenException extends Exception {
  constructor(message?: string) {
    super('ERR_FORBIDDEN', HttpStatusCode.Forbidden, message);
  }
}
