type MetaItem = {
  content: string;
  name?: string;
  property?: string;
  httpEquiv?: string;
};
type HeadLink = {
  rel: string;
  href: string;
  attributes?: Record<string, string>;
};
type InlineContent = {
  type: 'style' | 'script';
  content: string;
};
type HeadScript = {
  src: string;
  attributes?: Record<string, string | boolean>;
};
type HeadMeta = {
  title: string;
  base: string;
  lang: string;
  meta: MetaItem[];
  links: HeadLink[];
  scripts: HeadScript[];
  inlines: InlineContent[];
};

const formatAttributes = (attributes) =>
  Object.entries(attributes)
    .filter(([_, value]) => value)
    .reduce((result, [key, value]) => [...result, `${key}="${value}"`], [])
    .join(' ');

const uniqMetaNames = new Set(['description', 'viewport']);

const createHead = () => {
  const headMeta: HeadMeta = {
    title: '',
    base: '',
    lang: '',
    meta: [
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0',
      },
    ],
    links: [],
    scripts: [],
    inlines: [],
  };

  const head = {
    setTitle: (title: string) => {
      headMeta.title = title;
      return head;
    },
    setBase: (base: string) => {
      headMeta.base = base;
      return head;
    },
    addMeta: (item: MetaItem) => {
      if (
        uniqMetaNames.has(item.name) &&
        headMeta.meta.some(({ name }) => name === item.name)
      ) {
        headMeta.meta = headMeta.meta.map((metaItem) =>
          metaItem.name === item.name ? item : metaItem,
        );
      } else {
        headMeta.meta.push(item);
      }

      return head;
    },
    addLink: (link: HeadLink) => {
      headMeta.links.push(link);
      return head;
    },
    addScript: (script: HeadScript) => {
      headMeta.scripts.push(script);
      return head;
    },
    addInline: (inline: InlineContent) => {
      headMeta.inlines.push(inline);
      return head;
    },
    getLang: () => headMeta.lang,
    toString: () =>
      `<head>
          <meta charset="utf-8">
          <title>${headMeta.title}</title>
          ${headMeta.base ? `<base href="${headMeta.base}" />` : ''}
          ${headMeta.meta
            .map((metaItem) => `<meta ${formatAttributes(metaItem)} />`)
            .join('')}
          ${headMeta.links
            .map(
              ({ rel, href, attributes }) =>
                `<link ${formatAttributes({ ...attributes, rel, href })} />`,
            )
            .join('')}
          ${headMeta.scripts
            .map(
              ({ src, attributes }) =>
                `<script ${formatAttributes({ ...attributes, src })}></script>`,
            )
            .join('')}
          ${headMeta.inlines
            .map(({ type, content }) => `<${type}>${content}</${type}>`)
            .join('')}
        </head>`,
  };

  return head;
};

export default createHead;

export type Head = ReturnType<typeof createHead>;
