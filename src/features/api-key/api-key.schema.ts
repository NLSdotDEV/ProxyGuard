import { Type, type Static } from 'typebox';

const RequestApiKeyResponseSchema = Type.Object(
  {
    id: Type.String({
      description: 'The unique identifier (UUID v7) of the generated API key',
    }),
    secret: Type.String({
      description: 'The secret token used for authenticating requests',
    }),
    createdAt: Type.String({
      description:
        'The ISO 8601 timestamp representing when the API key was created',
    }),
    updatedAt: Type.String({
      description:
        'The ISO 8601 timestamp representing when the API key was last updated',
    }),
  },
  {
    description: 'Response payload returned upon successful API key generation',
  },
);

export const ApiKeySchema = {
  response: RequestApiKeyResponseSchema,
};

export type RequestApiKeyResponseType = Static<
  typeof RequestApiKeyResponseSchema
>;
