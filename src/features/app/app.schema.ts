import Type, { Static } from 'typebox';

const GetHelloSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
});

export const AppSchema = {
  getHello: GetHelloSchema,
};

export type GetHelloSchemaType = Static<typeof GetHelloSchema>;
