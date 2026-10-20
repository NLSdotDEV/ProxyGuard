import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class UnauthorizedException extends Exception {
  constructor(message?: string) {
    super('ERR_UNAUTHORIZED', HttpStatusCode.Unauthorized, message);
  }
}
