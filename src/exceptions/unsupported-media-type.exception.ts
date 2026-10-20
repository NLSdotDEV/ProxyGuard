import { Exception } from '#aegis/http';
import { HttpStatusCode } from 'axios';

export class UnsupportedMediaTypeException extends Exception {
  constructor(message?: string) {
    super(
      'ERR_UNSUPPORTED_MEDIA_TYPE',
      HttpStatusCode.UnsupportedMediaType,
      message,
    );
  }
}
