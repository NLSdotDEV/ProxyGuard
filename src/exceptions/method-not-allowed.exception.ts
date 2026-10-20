import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class MethodNotAllowedException extends Exception {
  constructor(message?: string) {
    super('ERR_METHOD_NOT_ALLOWED', HttpStatusCode.MethodNotAllowed, message);
  }
}
