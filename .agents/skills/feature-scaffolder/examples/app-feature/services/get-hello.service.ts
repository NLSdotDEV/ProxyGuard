import { GetHelloSchemaType } from '../app.schema.js';

// Single-use DTO declared and exported directly from this service
export type GetHelloDto = GetHelloSchemaType;

export interface GetHelloResult {
  message: string;
}

export class GetHelloService {
  // Single-action class: ONLY handle method!
  async handle(dto: GetHelloDto): Promise<GetHelloResult> {
    return {
      message: `Hello ${dto.name}`,
    };
  }
}

export default new GetHelloService();
