type MetaItem = {
  content: string;
  name?: string;
  property?: string;
  httpEquiv?: string;
  uniq?: boolean;
};
type HeadLink = {
  rel: string;
  href: string;
  attributes?: Record<string, string>;
  uniq?: boolean;
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

const formatAttributes = (attributes: Record<string, any>) =>
  Object.entries(attributes)
    .filter(([_, value]) => value && typeof value === 'string')
    .reduce((result, [key, value]) => [...result, `${key}="${value}"`], [])
    .join(' ');

const uniqMetaNames = new Set([
  'description',
  'viewport',
  'robots',
  'keywords',
  'author',
]);

const uniqLinkRels = new Set(['canonical']);

const isMetaUniq = (meta: MetaItem) =>
  uniqMetaNames.has(meta.name) ||
  meta.uniq ||
  `${meta.property}`.startsWith('og:') ||
  `${meta.property}`.startsWith('twitter:');
const isLinkUniq = (link: HeadLink) => uniqLinkRels.has(link.rel) || link.uniq;

const getInitialMeta = (): HeadMeta => ({
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
});
const createHead = () => {
  let headMeta: HeadMeta = getInitialMeta();

  const head = {
    clear: () => {
      headMeta = getInitialMeta();
      return head;
    },
    setTitle: (title: string) => {
      headMeta.title = title;
      return head;
    },
    setBase: (base: string) => {
      headMeta.base = base;
      return head;
    },
    setMeta: (item: MetaItem) => {
      const uniqProp = ['name', 'property', 'httpEquiv'].find(
        (name) => name in item,
      );

      if (
        headMeta.meta.some((metaItem) => metaItem[uniqProp] === item[uniqProp])
      ) {
        headMeta.meta = headMeta.meta.map((metaItem) =>
          metaItem[uniqProp] === item[uniqProp] ? item : metaItem,
        );
      } else {
        headMeta.meta.push(item);
      }

      return head;
    },
    addMeta: (item: MetaItem) => {
      if (isMetaUniq(item)) {
        return head.setMeta(item);
      }
      headMeta.meta.push(item);

      return head;
    },
    setLink: (link: HeadLink) => {
      if (headMeta.links.some((linkItem) => linkItem.rel === link.rel)) {
        headMeta.links = headMeta.links.map((linkItem) =>
          linkItem.rel === link.rel ? link : linkItem,
        );
      } else {
        headMeta.links.push(link);
      }
      return head;
    },
    addLink: (link: HeadLink) => {
      if (isLinkUniq(link)) {
        return head.setLink(link);
      }
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
    setLang: (lang: string) => {
      headMeta.lang = lang;
      return head;
    },
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
