// @ts-nocheck
import request from 'supertest';
import { createRegistry } from 'craq';

import createCraqServer from '../createCraqServer';
import { configureContext, createRedirect, createHttpError } from '../index';

describe('createCraqServer', () => {
  const nope = (context, error) =>
    (context.ctx.body = error ? 'Not Okay' : 'Okay');

  const render404 = (context) => (context.ctx.body = 'I am 404');
  const render5xx = (context, error) => {
    context.ctx.body = error.message;
  };
  const redirectAction = () => {
    throw createRedirect(302, 'https://xxx.tld');
  };
  const notFound = () => {
    throw createHttpError(404, 'Cannot find');
  };
  const somethingBad = () => {
    x + 2;
  };
  const actions = createRegistry();

  actions.register('redirectAction', redirectAction);
  actions.register('notFound', notFound);
  actions.register('somethingBad', somethingBad);

  let httpServer;
  const server = createCraqServer(
    configureContext({
      store: null,
      actions,
      components: createRegistry(),
      routes: [
        {
          name: 'home',
          path: '/',
          config: {
            renderer: 'nope',
          },
        },
        {
          name: 'redirect',
          path: '/redirect',
          config: {
            renderer: 'nope',
            actions: ['redirectAction'],
          },
        },
        {
          name: 'notFound',
          path: '/not-found',
          config: {
            renderer: 'nope',
            actions: ['notFound'],
          },
        },
        {
          name: 'badass',
          path: '/badass',
          config: {
            renderer: 'nope',
            actions: ['somethingBad'],
          },
        },
        {
          name: '404',
          config: {
            renderer: 'render404',
          },
        },
        {
          name: '5xx',
          config: {
            renderer: 'render5xx',
          },
        },
      ],
    }),
    {
      renderers: { nope, render404, render5xx },
    },
  );

  beforeAll(() => {
    httpServer = server.listen(3002);
  });
  afterAll(() => {
    httpServer.close();
  });

  it('simple works', async () => {
    const response = await request(server.callback()).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Okay');
  });

  it('redirect works', async () => {
    const response = await request(server.callback()).get('/redirect');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://xxx.tld');
  });

  it('404 works', async () => {
    const response = await request(server.callback()).get('/notFound');

    expect(response.status).toBe(404);
    expect(response.text).toBe('I am 404');
  });

  it('500 works', async () => {
    const response = await request(server.callback()).get('/badass');

    expect(response.status).toBe(500);
    expect(response.text).toBe('x is not defined');
  });
});
