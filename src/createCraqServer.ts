import url from 'url';
import Koa, { Context } from 'koa';
import { Route } from 'router6';
import { actionsMiddleware } from 'craq';
import ServerContext from './ServerContext';
import createHead, { Head } from './createHead';
import { isHttpError, isRedirect } from './errors';
import createError from 'http-errors';

type Renderer<S> = (context: ServerContext<S, any>, error: Error | null) => any;

const getRenderer = <T>(
  renderers: Record<string, Renderer<T>>,
  route: Route,
) => {
  const renderer = renderers[route.config.renderer];

  if (!renderer) {
    throw new Error(
      `Renderer "${route.config.renderer}" was not found, check "${route.name}" route config`,
    );
  }

  return renderer;
};

const createCraqServer = <S extends object, A>(
  createContext: <C extends Context>(
    ctx: C,
    head: Head,
  ) => ServerContext<S, A, C>,
  {
    renderers,
  }: {
    renderers: Record<string, Renderer<S>>;
  },
) => {
  const app = new Koa();

  app.use(async (ctx) => {
    if (ctx.path === '/favicon.ico') {
      // TODO: fix that mess
      return;
    }

    const run = () => {
      const context = createContext(ctx, createHead());

      context.router.use(
        actionsMiddleware(context, {
          filter: ({ options }) => options?.clientOnly !== true,
          onError: (error, { name }) => {
            if (isHttpError(error) || isRedirect(error)) {
              throw error;
            }
            context.stats.error = error;
            context.stats.actions[name] = false;
          },
          onSuccess: ({ name }) => {
            context.stats.actions[name] = true;
          },
        }),
      );

      const renderRoute = (route, err = null) =>
        getRenderer(renderers, route)(context, err);

      return context.router
        .start(url.format({ pathname: ctx.path, query: ctx.query }), {
          context,
        })
        .then(renderRoute, (e) => {
          if (isRedirect(e)) {
            ctx.status = e.statusCode;
            ctx.response.set('location', e.location);
            return;
          }

          if (!isHttpError(e)) {
            // assume it's 500
            e = createError(500, e);
          }

          const params = { meta: { path: ctx.path } };
          const stringStatusCode = String(e.statusCode);

          const errorRoute =
            context.router.findRoute(stringStatusCode, params) ||
            context.router.findRoute(`${stringStatusCode.charAt(0)}xx`, params);

          ctx.status = e.statusCode;

          if (errorRoute) {
            return renderRoute(errorRoute, e);
          }

          throw e;
        });
    };

    return run().catch((e) => {
      ctx.status = 500;
      ctx.set('Content-Type', 'text/html');
      ctx.body = `<h1>Internal server error</h1><pre>${e.stack}</pre>`;
    });
  });

  return app;
};

export default createCraqServer;
