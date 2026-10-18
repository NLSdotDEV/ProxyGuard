import { GetHelloSchemaType } from '../app.schema.js';

export class AppService {
  getHello(data: GetHelloSchemaType) {
    return {
      message: `Hello ${data.name}`,
    };
  }
}

export default new AppService();
