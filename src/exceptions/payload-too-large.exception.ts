import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class PayloadTooLargeException extends Exception {
  constructor(message?: string) {
    super('ERR_PAYLOAD_TOO_LARGE', HttpStatusCode.PayloadTooLarge, message);
  }
}
