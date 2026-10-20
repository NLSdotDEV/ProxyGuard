import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class RequestTimeoutException extends Exception {
  constructor(message?: string) {
    super('ERR_REQUEST_TIMEOUT', HttpStatusCode.RequestTimeout, message);
  }
}
