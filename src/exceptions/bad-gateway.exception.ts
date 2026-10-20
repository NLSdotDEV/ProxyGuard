import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class BadGatewayException extends Exception {
  constructor(message?: string) {
    super('ERR_BAD_GATEWAY', HttpStatusCode.BadGateway, message);
  }
}
