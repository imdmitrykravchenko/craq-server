import fs from 'fs';

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Route } from 'router6/src';

import { Renderer, RendererOptions } from './types';

type Chunks = {
  assetsByChunkName: {
    bundle: string[];
  };
};

const loadBundles = (bundles: Record<string, () => Promise<void>>) =>
  Promise.all(Object.values(bundles).map((bundle) => bundle()));
const stingified = (value) =>
  `JSON.parse('${JSON.stringify(value)
    .replace(/\\n/g, '\\n')
    .replace(/\\'/g, "\\'")
    .replace(/\\"/g, '\\"')
    .replace(/\\&/g, '\\&')
    .replace(/\\r/g, '\\r')
    .replace(/\\t/g, '\\t')
    .replace(/\\b/g, '\\b')
    .replace(/\\f/g, '\\f')}')`;
const formatAttributes = (attributes) =>
  Object.entries(attributes)
    .filter(([_, value]) => value)
    .reduce((result, [key, value]) => [...result, `${key}="${value}"`], [])
    .join(' ');

const formatJSResource = ({ async, defer, src, code = '' }: JSResource) =>
  `<script ${formatAttributes({
    async,
    defer,
    src,
    type: 'text/javascript',
  })}>${code}</script>`;

const formatCSSResource = ({ href, style }: CSSResource) =>
  style
    ? `<style type="text/css">${style}</style>`
    : `<link ${formatAttributes({
        href,
        rel: 'stylesheet',
      })} />`;

const defineVar = (name: string, value: any) =>
  formatJSResource({ type: 'js', code: `window.${name} = ${value};` });

export type JSResource = {
  type: 'js';
  async?: boolean;
  defer?: boolean;
  src?: string;
  code?: string;
  place?: string;
};
export type CSSResource = {
  type: 'css';
  href?: string;
  style?: string;
  place?: string;
};

const placeFilter =
  (value) =>
  ({ place }: CSSResource | JSResource) =>
    place === value;

type RenderPayload = {
  route: Route;
  scripts: JSResource[];
  styles: CSSResource[];
  children?: string;
  stats: object;
  state: object;
  options: RendererOptions;
};

const renderBefore = ({
  route,
  scripts,
  styles,
  state,
  options,
}: RenderPayload) => {
  const {
    title,
    description,
    canonical,
    lang = 'en',
    og,
  } = options.formatMeta(route, state);

  return `<!DOCTYPE html>
    <html lang="${lang}">
      <head>
        <title>${title}</title>
        <meta name="description" content="${description}" />
        ${
          og
            ? `<meta property="og:title" content=${og.title} /><meta property="og:description" content=${og.description} />`
            : ''
        }
        <link rel="icon" href="data:,">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
        ${styles.filter(placeFilter('head')).map(formatCSSResource).join('\n')}
        ${scripts.filter(placeFilter('head')).map(formatJSResource).join('\n')}
        ${canonical ? `<link rel="canonical" href="${canonical}" />` : ''}
      </head>
      <body>
        <div id="root">`;
};

const renderAfter = ({ scripts, state, stats }: RenderPayload) => `</div>
        ${defineVar('__SERVER_STATS__', stingified(stats))}
        ${defineVar('__INITIAL_STATE__', stingified(state))}
        ${scripts.filter(placeFilter('body')).map(formatJSResource).join('\n')}
      </body>
    </html>`;

const hasExt = (ext) => (link) => link.split('.').pop() === ext;
const isJs = hasExt('js');
const isCss = hasExt('css');

const usefulChunks = ['vendor', 'bundle'];
const getStaticReducer =
  (assetsByChunkName, pred, additionalChunk = undefined) =>
  (set: Set<string>, chunkName) =>
    [
      ...(additionalChunk
        ? assetsByChunkName[additionalChunk].filter(pred)
        : []),
      ...assetsByChunkName[chunkName].filter(pred),
    ].reduce((result: Set<string>, link: string) => result.add(link), set);
const addAssetsPath = (path) => `/assets/${path}`;

const getStats = (options: RendererOptions): Promise<Chunks> => {
  const { statsFilePath } = options;

  console.log('attempt to parse stats.json', statsFilePath);

  if (fs.existsSync(statsFilePath)) {
    return Promise.resolve(
      JSON.parse(fs.readFileSync(statsFilePath).toString()),
    );
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getStats(options));
    }, 2000);
  });
};

let chunksUnderstand;

const render = (response, head, stream, tail) =>
  new Promise<void>((resolve, reject) => {
    stream.on('error', reject);
    stream.once('readable', () => {
      response.write(head);

      stream.pipe(response, { end: false });

      stream.on('end', () => {
        response.write(tail);
        response.end();
      });

      resolve();
    });
  });

const html: Renderer = async (context, App, { bundles, options }) => {
  if (!chunksUnderstand) {
    chunksUnderstand = loadBundles(bundles)
      .then(() => getStats(options))
      .then((result) => result.assetsByChunkName);
  }

  const assetsByChunkName = await chunksUnderstand;
  const route = context.router.currentRoute;
  const { bundle, error } = route.config;

  const styles: CSSResource[] = [
    ...usefulChunks.reduce(
      getStaticReducer(assetsByChunkName, isCss, bundle),
      new Set(),
    ),
  ].map((href) => ({
    href: addAssetsPath(href),
    type: 'css',
    place: 'head',
  }));
  const scripts: JSResource[] = [
    ...[
      ...usefulChunks.reduce(
        getStaticReducer(assetsByChunkName, isJs),
        new Set(),
      ),
    ].map((src) => ({
      type: 'js' as 'js',
      src: addAssetsPath(src),
      defer: true,
      place: 'body',
    })),
  ];

  context.ctx.res.writeHead(error ? Number(route.name) : 200, {
    'Content-Type': 'text/html;charset=UTF-8',
  });

  const state = context.getStore().getState() as object;
  const renderPayload = {
    stats: context.stats,
    state,
    route,
    styles,
    scripts,
    options,
  };

  return render(
    context.ctx.res,
    renderBefore(renderPayload),
    ReactDOMServer.renderToPipeableStream(React.createElement(App, { context })),
    renderAfter(renderPayload),
  );
};

export default html;
