import '@babel/polyfill';
import url from 'url';
import Koa, { Context } from 'koa';
import { InternalServerError, Route } from 'router6/src';

import createApp from 'craq/src/core/createApp';
import actionsMiddleware from 'craq/src/core/actionsMiddleware';

import ServerContext from './ServerContext';
import { Renderer, RendererOptions } from './types';

const tryCatchMiddleware = async (ctx, next) => {
  try {
    return await next();
  } catch (e) {
    ctx.set('Content-Type', 'text/html');
    ctx.body = `<h1>Internal server error</h1><pre>${e.stack}</pre>`;
  }
};

export const createCraqServer = (
  createContext: <T extends Context>(ctx: T) => ServerContext<any, T>,
  App,
  {
    bundles,
    renderers,
    options,
  }: {
    renderers: Record<string, Renderer>;
    bundles: Record<string, () => Promise<void>>;
    options: RendererOptions;
  },
) => {
  const server = new Koa();
  server.use(tryCatchMiddleware);

  server.use(async (ctx) => {
    if (ctx.path === '/favicon.ico') {
      // TODO: fix that mess
      return;
    }

    const run = async (error = undefined) => {
      const context = createContext(ctx);

      if (error) {
        context.stats.error = error;
      }

      context.router.use(
        actionsMiddleware(context, {
          isServer: true,
          handleRoutingError: (e, next) => Promise.reject(next(e)),
          executionFlow: (execution, next) =>
            execution
              .then(
                (results) => {
                  context.stats.actions = results.reduce(
                    (result, action) => ({ ...result, ...action }),
                    {},
                  );
                },
                (error) => {
                  context.stats.error = error;

                  return error;
                },
              )
              .then(next),
        }),
      );

      const route: Route = await context.router.start(
        url.format({ pathname: ctx.path, query: ctx.query }),
        error,
      );
      const renderer = renderers[route.config.renderer];

      return renderer(context, createApp(App), { bundles, options });
    };

    try {
      return await run();
    } catch (e) {
      return await run(new InternalServerError(e.message));
    }
  });

  return {
    listen: (port: number) => server.listen(port),
  };
};
