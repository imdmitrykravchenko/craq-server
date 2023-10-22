import Router6 from 'router6';
import { Context as KoaContext } from 'koa';
import { Registries, Context, Store } from 'craq';

import { ServerActionContext, ServerServiceContext } from './types';
import { Head } from './createHead';

export default class ServerContext<S, A, X = KoaContext> extends Context<S, A> {
  public ctx: X;
  public head: Head;
  protected serviceContext: ServerServiceContext<X>;
  protected actionContext: ServerActionContext<S>;
  constructor(
    {
      store,
      router,
      ctx,
      registries,
    }: {
      registries: Registries<S>;
      store: Store<S, A>;
      router?: Router6;
      ctx: X;
    },
    head: Head,
  ) {
    super({ store, router, registries });

    this.ctx = ctx;
    this.head = head;
    this.actionContext = {
      ...this.actionContext,
      head,
    };

    this.serviceContext = {
      ...this.serviceContext,
      ctx,
    };
  }
}
