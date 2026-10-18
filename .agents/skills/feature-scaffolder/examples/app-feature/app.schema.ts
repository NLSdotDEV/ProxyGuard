import Type, { Static } from 'typebox';

const GetHelloSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

const GetHelloResponseSchema = Type.Object({
  message: Type.String(),
});

export const AppSchema = {
  getHello: GetHelloSchema,
  getHelloResponse: GetHelloResponseSchema,
};

export type GetHelloSchemaType = Static<typeof GetHelloSchema>;
export type GetHelloResponseSchemaType = Static<typeof GetHelloResponseSchema>;
