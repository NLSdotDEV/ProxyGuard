import axios, { isAxiosError } from 'axios';
import {
  BadGatewayException,
  UnauthorizedException,
} from '../../../exceptions/index.js';

export interface LoadProxyScrapeSubAccountsDto {
  readonly secret: string;
}

export interface ProxyScrapeSubaccount {
  AccountID: string,
  AccountType: string,
  label: string,
  is_hidden: boolean,
  time_added: number
}

export interface ProxyScrapeSubAccountResponse {
  success: boolean;
  data: {
    subaccounts: ProxyScrapeSubaccount[];
    total: number;
  };
}

export class LoadProxyScrapeSubAccountsService {
  /**
   * Requests ProxyScrape to load all subaccounts linked to the provided secret.
   */
  async handle(dto: LoadProxyScrapeSubAccountsDto): Promise<unknown> {
    const subAccounts = await this.requestSubAccounts(dto.secret);
    return subAccounts;
  }

  private async requestSubAccounts(secret: string): Promise<ProxyScrapeSubAccountResponse> {
    const baseUrl = process.env.PROXY_SCRAPE_BASE_API_URL;

    const subAccountUrl = `${baseUrl}/account/subaccounts`;
    const headers = {
      'api-token': secret,
    };

    try {
      const response = await axios.get(subAccountUrl, {
        headers,
        timeout: 10000,
      });

      const data = response.data as ProxyScrapeSubAccountResponse;

      return data;
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
