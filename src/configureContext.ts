import { Context } from 'koa';
import Router6, { RouteDefinition } from 'router6';
import { CraqAction, Registry, Store } from 'craq';

import ServerContext from './ServerContext';
import { Head } from './createHead';

export default <T, S>({
    store,
    actions,
    components,
    routes,
  }: {
    actions: Registry<CraqAction<S, any>>;
    components: Registry<T>;
    store: Store<S, any>;
    routes: RouteDefinition[];
  }) =>
  <T extends Context>(ctx: T, head: Head) =>
    new ServerContext(
      {
        ctx,
        store,
        router: new Router6(routes),
        registries: { actions, components },
      },
      head,
    );
