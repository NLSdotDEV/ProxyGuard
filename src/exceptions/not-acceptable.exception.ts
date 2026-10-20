import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class NotAcceptableException extends Exception {
  constructor(message?: string) {
    super('ERR_NOT_ACCEPTABLE', HttpStatusCode.NotAcceptable, message);
  }
}
