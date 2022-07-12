import { Context } from 'koa';
import { ComponentType } from 'react';
import Router6, { RouteDefinition } from 'router6/src';
import { ReducersMapObject, createStore, combineReducers } from 'redux';
import { CraqAction, Registry } from 'craq/src/types';

import ServerContext from './ServerContext';

export default ({
    reducers,
    actions,
    components,
    routes,
  }: {
    actions: Registry<CraqAction>;
    components: Registry<ComponentType>;
    reducers: ReducersMapObject;
    routes: RouteDefinition[];
  }) =>
  <T extends Context>(ctx: T) =>
    new ServerContext({
      ctx,
      store: createStore(combineReducers(reducers)),
      router: new Router6(routes),
      registries: { actions, components },
    });
