import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class NotFoundException extends Exception {
  constructor(message?: string) {
    super('ERR_NOT_FOUND', HttpStatusCode.NotFound, message);
  }
}
