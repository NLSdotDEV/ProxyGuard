import { Type, type Static } from 'typebox';

const LoadProxyScrapeSubAccountsSchema = Type.Object(
  {
    secret: Type.String({
      description: 'The ProxyScrape API key or secret',
    }),
  },
  {
    description: 'Request payload for loading ProxyScrape subaccounts',
  },
);

export const ProxyScrapeSchema = {
  loadSubAccounts: LoadProxyScrapeSubAccountsSchema,
};

export type LoadProxyScrapeSubAccountsType = Static<
  typeof LoadProxyScrapeSubAccountsSchema
>;
