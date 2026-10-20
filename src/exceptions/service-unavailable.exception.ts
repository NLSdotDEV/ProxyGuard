import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class ServiceUnavailableException extends Exception {
  constructor(message?: string) {
    super(
      'ERR_SERVICE_UNAVAILABLE',
      HttpStatusCode.ServiceUnavailable,
      message,
    );
  }
}
