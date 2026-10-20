import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class NotImplementedException extends Exception {
  constructor(message?: string) {
    super('ERR_NOT_IMPLEMENTED', HttpStatusCode.NotImplemented, message);
  }
}
