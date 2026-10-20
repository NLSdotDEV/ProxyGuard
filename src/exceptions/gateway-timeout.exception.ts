import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class GatewayTimeoutException extends Exception {
  constructor(message?: string) {
    super('ERR_GATEWAY_TIMEOUT', HttpStatusCode.GatewayTimeout, message);
  }
}
