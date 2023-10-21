// @ts-nocheck
import request from 'supertest';
import { createRegistry } from 'craq';

import createCraqServer from '../createCraqServer';
import { configureContext } from '../index';
import Router6 from 'router6';
import { ClientError, Redirect, ServerError } from '../errors';

describe('createCraqServer', () => {
  const nope = (context, error) =>
    (context.ctx.body = error ? context.stats : 'Okay');
  const render404 = (context) => (context.ctx.body = context.stats.error);
  const render5xx = (context, error) => {
    context.ctx.body = error.message;
  };
  const redirectAction = () => {
    throw new Redirect(302, { location: 'https://xxx.tld' });
  };
  const notFound = () => {
    throw new ClientError(404, { message: 'Cannot find' });
  };
  const some500 = () => {
    throw new ServerError(500, { message: 'Clusterfuck' });
  };
  const somethingBad = () => {
    x + 2;
  };
  const actions = createRegistry();

  actions.register('redirectAction', redirectAction);
  actions.register('notFound', notFound);
  actions.register('somethingBad', somethingBad);
  actions.register('some500', some500);

  let httpServer;
  const server = createCraqServer(
    configureContext({
      getStore: () => null,
      actions,
      components: createRegistry(),
      getRouter: () =>
        new Router6([
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
            name: 'clusterfuck',
            path: '/clusterfuck',
            config: {
              renderer: 'nope',
              actions: ['some500'],
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
        ]),
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

  it('exports stats', async () => {
    const response = await request(server.callback()).get('/not-found');

    expect(response.status).toBe(404);
    expect(response.text).toBe('{"message":"Cannot find","statusCode":404}');
  });

  it('404 works', async () => {
    const response = await request(server.callback()).get('/not-found');

    expect(response.status).toBe(404);
  });

  it('500 works', async () => {
    const response = await request(server.callback()).get('/clusterfuck');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Clusterfuck');
  });

  it('unexpected 500 works', async () => {
    const response = await request(server.callback()).get('/badass');

    expect(response.status).toBe(500);
    expect(response.text).toBe('x is not defined');
  });
});
