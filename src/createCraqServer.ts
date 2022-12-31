import url from 'url';
import Koa, { Context } from 'koa';
import { InternalServerError, Route } from 'router6';
import { actionsMiddleware } from 'craq';

import ServerContext from './ServerContext';
import createHead, { Head } from './createHead';

const tryCatchMiddleware = async (ctx, next) => {
  try {
    return await next();
  } catch (e) {
    ctx.set('Content-Type', 'text/html');
    ctx.body = `<h1>Internal server error</h1><pre>${e.stack}</pre>`;
  }
};

const createCraqServer = <
  A,
  T extends object,
  O extends {
    renderers: Record<
      string,
      (context: ServerContext<T>, app: A, options: Omit<O, 'renderers'>) => any
    >;
  },
>(
  createContext: <C extends Context>(ctx: C, head: Head) => ServerContext<T, C>,
  App: A,
  { renderers, ...options }: O,
) => {
  const server = new Koa();
  server.use(tryCatchMiddleware);

  server.use(async (ctx) => {
    if (ctx.path === '/favicon.ico') {
      // TODO: fix that mess
      return;
    }

    const run = async (error = undefined) => {
      const context = createContext(ctx, createHead());

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

      if (!renderer) {
        throw new Error(
          `Renderer "${route.config.renderer}" was not found, check "${route.name}" route config`,
        );
      }

      return renderer(context, App, options);
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

export default createCraqServer;
