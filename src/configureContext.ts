import { Context } from 'koa';
import Router6, { RouteDefinition } from 'router6';
import { ReducersMapObject, configureStore } from '@reduxjs/toolkit';
import { CraqAction, Registry } from 'craq';

import ServerContext from './ServerContext';
import { Head } from './createHead';

export default <T, S>({
    reducers,
    actions,
    components,
    routes,
  }: {
    actions: Registry<CraqAction<S>>;
    components: Registry<T>;
    reducers: ReducersMapObject;
    routes: RouteDefinition[];
  }) =>
  <T extends Context>(ctx: T, head: Head) =>
    new ServerContext(
      {
        ctx,
        store: configureStore({ reducer: reducers }),
        router: new Router6(routes),
        registries: { actions, components },
      },
      head,
    );
