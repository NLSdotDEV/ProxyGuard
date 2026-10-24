import { em } from '../../../database/db.js';
import { ProxyEndpoint } from '../../../database/entities/index.js';
import { NotFoundException } from '../../../exceptions/index.js';
import checkProxyAccountProducer from '../../../jobs/producers/check-proxy-account.producer.js';

export interface UpdateProxyDto {
  readonly apiKeyId: string;
  readonly endpointId: string;
}

export interface UpdateProxyResult {
  readonly success: boolean;
  readonly message: string;
  readonly endpointId: string;
  readonly status: string;
}

export class UpdateProxyService {
  async handle(dto: UpdateProxyDto): Promise<UpdateProxyResult> {
    const endpoint = await em.findOne(
      ProxyEndpoint,
      {
        id: dto.endpointId,
        proxy: { apiKey: dto.apiKeyId },
      },
      { populate: ['proxy'] },
    );

    if (!endpoint) {
      throw new NotFoundException(
        `Endpoint not found for id ${dto.endpointId}`,
      );
    }

    const account = endpoint.proxy.getEntity();

    await checkProxyAccountProducer.dispatch({
      endpointId: dto.endpointId,
      proxyAccountId: account.id,
      apiKeyId: dto.apiKeyId,
    });

    return {
      success: true,
      message: 'Proxy account validation job dispatched',
      endpointId: dto.endpointId,
      status: 'pending',
    };
  }
}

export const updateProxyService = new UpdateProxyService();
export default updateProxyService;
