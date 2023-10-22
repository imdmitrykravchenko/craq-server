import { Context } from 'koa';
import Router6 from 'router6';
import { CraqAction, Registry, Store } from 'craq';

import ServerContext from './ServerContext';
import { Head } from './createHead';

export default <T, S>({
    getStore,
    actions,
    components,
    getRouter,
  }: {
    actions: Registry<CraqAction<S, any>>;
    components: Registry<T>;
    getStore: () => Store<S, any>;
    getRouter: (context: ServerContext<S, any>) => Router6;
  }) =>
  <T extends Context>(ctx: T, head: Head) => {
    const serverContext = new ServerContext(
      {
        ctx,
        store: getStore(),
        registries: { actions, components },
      },
      head,
    );

    serverContext.router = getRouter(serverContext);

    return serverContext;
  };
