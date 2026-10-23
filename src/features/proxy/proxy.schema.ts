import { Type, type Static } from 'typebox';

const LeaseProxySchema = Type.Object(
  {
    url: Type.Optional(
      Type.String({
        description: 'Optional target URL to get a proxy or new IP for',
      }),
    ),
  },
  {
    description: 'Request payload for requesting/leasing a proxy',
  },
);

const RefreshProxyLeaseSchema = Type.Object(
  {
    url: Type.String({
      description:
        'The target URL whose hostname will be used to ban the proxy and lease a new one',
    }),
    endpointId: Type.String({
      description: 'The endpoint ID to ban',
    }),
  },
  {
    description:
      'Request payload for refreshing proxy lease and banning previous endpoint',
  },
);

const ProxyItemResponseSchema = Type.Object(
  {
    id: Type.String({
      description: 'The unique identifier of the proxy endpoint',
    }),
    address: Type.String({
      description: 'The proxy host:port address',
    }),
    username: Type.String({
      description: 'The proxy account username',
    }),
    password: Type.String({
      description: 'The proxy account password',
    }),
    proxy: Type.String({
      description: 'the full proxy endpoint',
    }),
  },
  {
    description: 'A proxy item with address, credentials, and full proxy URL',
  },
);

export const ProxySchema = {
  lease: LeaseProxySchema,
  refresh: RefreshProxyLeaseSchema,
  response: ProxyItemResponseSchema,
  leasedResponse: ProxyItemResponseSchema,
  request: LeaseProxySchema,
};

export type LeaseProxySchemaType = Static<typeof LeaseProxySchema>;
export type RefreshProxyLeaseSchemaType = Static<
  typeof RefreshProxyLeaseSchema
>;
export type ProxyItemResponseType = Static<typeof ProxyItemResponseSchema>;
