import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class GoneException extends Exception {
  constructor(message?: string) {
    super('ERR_GONE', HttpStatusCode.Gone, message);
  }
}
