import axios, { isAxiosError } from 'axios';
import {
  BadGatewayException,
  UnauthorizedException,
} from '../../../exceptions/index.js';
import syncSubaccountProxiesProducer from '../../../jobs/producers/sync-subaccount-proxies.producer.js';

export interface ProxyScrapeSubAccount {
  AccountID: string;
  AccountType: string;
  label: string;
  is_hidden: boolean;
  time_added: number;
}

export interface LoadProxyScrapeSubAccountsDto {
  readonly secret: string;
}

export class LoadProxyScrapeSubAccountsService {
  async handle(
    dto: LoadProxyScrapeSubAccountsDto,
  ): Promise<ProxyScrapeSubAccount | null> {
    const baseUrl =
      process.env.PROXY_SCRAPE_BASE_API_URL ?? 'https://api.proxyscrape.com/v4';

    try {
      const response = await axios.get<{
        success: boolean;
        data: { subaccounts: ProxyScrapeSubAccount[]; total: number };
      }>(`${baseUrl}/account/subaccounts`, {
        headers: {
          'api-token': dto.secret,
        },
        timeout: 10000,
      });

      const firstSubAccount = response.data?.data?.subaccounts?.[0];
      if (!firstSubAccount) {
        return null;
      }

      await syncSubaccountProxiesProducer.dispatch({
        subAccountId: firstSubAccount.AccountID,
        secret: dto.secret,
      });

      return firstSubAccount;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = data?.message ?? data?.error ?? error.message;

        if (status === 401 || status === 403) {
          throw new UnauthorizedException(
            message || 'Invalid ProxyScrape API secret',
          );
        }

        throw new BadGatewayException(
          message || 'Failed to fetch subaccounts from ProxyScrape API',
        );
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error communicating with ProxyScrape API';
      throw new BadGatewayException(message);
    }
  }
}

export default new LoadProxyScrapeSubAccountsService();
