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

const UpdateProxySchema = Type.Object(
  {
    endpointId: Type.String({
      description: 'The unique identifier of the proxy endpoint',
    }),
  },
  {
    description:
      'Request payload for updating proxy and checking account validity',
  },
);

const UpdateProxyResponseSchema = Type.Object(
  {
    success: Type.Boolean({
      description: 'Whether the validation job was successfully queued',
    }),
    message: Type.String({
      description: 'Operation summary message',
    }),
    endpointId: Type.String({
      description: 'The endpoint ID submitted for verification',
    }),
    status: Type.String({
      description: 'The status of the validation process',
    }),
  },
  {
    description: 'Response payload for proxy update dispatch',
  },
);

export const ProxySchema = {
  lease: LeaseProxySchema,
  refresh: RefreshProxyLeaseSchema,
  update: UpdateProxySchema,
  updateResponse: UpdateProxyResponseSchema,
  response: ProxyItemResponseSchema,
  leasedResponse: ProxyItemResponseSchema,
  request: LeaseProxySchema,
};

export type LeaseProxySchemaType = Static<typeof LeaseProxySchema>;
export type RefreshProxyLeaseSchemaType = Static<
  typeof RefreshProxyLeaseSchema
>;
export type UpdateProxySchemaType = Static<typeof UpdateProxySchema>;
export type UpdateProxyResponseType = Static<typeof UpdateProxyResponseSchema>;
export type ProxyItemResponseType = Static<typeof ProxyItemResponseSchema>;
