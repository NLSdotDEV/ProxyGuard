import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class ConflictException extends Exception {
  constructor(message?: string) {
    super('ERR_CONFLICT', HttpStatusCode.Conflict, message);
  }
}
