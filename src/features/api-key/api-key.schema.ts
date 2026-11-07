import { Type, type Static } from 'typebox';


const RequestApiKeySchema = Type.Object({
  name: Type.Optional(Type.String())
})

export const ApiKeySchema = {
  request: RequestApiKeySchema
};

export type RequestApiKeySchemaType = Static<typeof RequestApiKeySchema>;