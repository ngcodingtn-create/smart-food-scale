import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Routes are authored as .mdx files under app/, so Next has to treat them
  // as page extensions alongside .tsx.
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

const withMDX = createMDX({
  options: {
    // Turbopack (the default in Next 16) serialises the config, so plugins are
    // named as strings rather than imported functions. Passing the imported
    // function here fails at build time with a serialisation error.
    remarkPlugins: [['remark-gfm', {}]],
    rehypePlugins: [
      ['rehype-slug', {}],
      ['rehype-autolink-headings', { behavior: 'wrap' }],
    ],
  },
});

export default withMDX(nextConfig);
