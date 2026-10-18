export interface AppEntityStub {
  id: string;
  name: string;
}

export class FindAppService {
  // ONLY two methods: findAll and findOne
  async findAll(
    _filter: Record<string, unknown> = {},
  ): Promise<AppEntityStub[]> {
    return [{ id: '1', name: 'ProxyGuard' }];
  }

  async findOne(id: string): Promise<AppEntityStub | null> {
    return { id, name: 'ProxyGuard' };
  }
}

export default new FindAppService();
