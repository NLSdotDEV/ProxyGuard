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

const SubAccountResponseSchema = Type.Object({
  AccountID: Type.String(),
  AccountType: Type.String(),
  label: Type.String(),
  is_hidden: Type.Boolean(),
  time_added: Type.Number(),
});

export const ProxyScrapeSchema = {
  loadSubAccounts: LoadProxyScrapeSubAccountsSchema,
  loadSubAccountsResponse: Type.Union([SubAccountResponseSchema, Type.Null()]),
};

export type LoadProxyScrapeSubAccountsType = Static<
  typeof LoadProxyScrapeSubAccountsSchema
>;
export type LoadProxyScrapeSubAccountsResponseType = Static<
  typeof ProxyScrapeSchema.loadSubAccountsResponse
>;
