// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Project page, not a user page, so the base path is the repo name.
// Change both of these together if the repo is ever renamed.
const SITE = 'https://ngcodingtn-create.github.io';
const BASE = '/smart-food-scale';

export default defineConfig({
  site: SITE,
  base: BASE,

  integrations: [
    starlight({
      title: 'Smart Food Scale',
      description:
        'An IoT kitchen scale that weighs a meal and returns its calories and macros. ' +
        'The camera answers what the food is; the load cell answers how much of it there is.',

      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/ngcodingtn-create/smart-food-scale',
        },
      ],

      editLink: {
        baseUrl:
          'https://github.com/ngcodingtn-create/smart-food-scale/edit/main/site/',
      },

      lastUpdated: true,

      sidebar: [
        { label: 'Overview', link: '/' },

        {
          label: 'The project',
          items: [
            { label: 'Component request', link: '/project/component-request/' },
            { label: 'Architecture', link: '/project/architecture/' },
            { label: 'Wiring & pin map', link: '/project/wiring/' },
            { label: 'Risks', link: '/project/risks/' },
          ],
        },

        {
          label: 'Deliverables',
          items: [
            { label: 'Status board', link: '/deliverables/' },
            { label: 'Backend API', link: '/deliverables/backend/' },
            { label: 'Tunisian food table', link: '/deliverables/food-table/' },
            { label: 'Firmware', link: '/deliverables/firmware/' },
            { label: 'Mobile app', link: '/deliverables/app/' },
          ],
        },

        {
          label: 'Reference',
          items: [
            { label: 'Decision log', link: '/reference/decisions/' },
            { label: 'Accuracy & calibration', link: '/reference/accuracy/' },
            { label: 'Vision API options', link: '/reference/vision-apis/' },
          ],
        },
      ],

      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
