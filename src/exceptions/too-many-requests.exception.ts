import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class TooManyRequestsException extends Exception {
  constructor(message?: string) {
    super('ERR_TOO_MANY_REQUESTS', HttpStatusCode.TooManyRequests, message);
  }
}
