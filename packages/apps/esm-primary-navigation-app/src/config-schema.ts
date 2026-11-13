import { Type, validator, validators } from '@egen-civitas/esm-framework';
import { offsetMinutes } from './intranet-topbar/kit/transient-time';

export const configSchema = {
  logo: {
    src: {
      _type: Type.String,
      _default: '',
      _description: 'The path or URL to the logo image. If set to an empty string, the default EGEN logo will be used.',
      _validators: [validators.isUrl],
    },
    alt: {
      _type: Type.String,
      _default: 'Logo',
      _description: 'The alternative text for the logo image, displayed when the image cannot be loaded or on hover.',
    },
    name: {
      _type: Type.String,
      _default: '',
      _description: 'The organization name displayed when image is absent',
    },
    link: {
      _type: Type.String,
      _default: '${egenSpaBase}/home',
      _description: 'The link to redirect to when the logo is clicked',
      _validators: [validators.isUrl],
    },
  },
  search: {
    path: {
      _type: Type.String,
      _default: '${egenSpaBase}/search',
      _description:
        "The route to navigate to when a query is submitted from the topbar's search bar (appended as a `?q=` parameter). Point this at whichever app renders your search results.",
    },
  },
  topbar: {
    levels: {
      order: {
        _type: Type.Array,
        _elements: { _type: Type.String },
        _default: [],
        _description:
          'Level names pinned at the top of the TopBar stack, in this order. Takes precedence over the `rank` declared by apps. Levels not listed follow, ordered by rank then by name.',
      },
      hidden: {
        _type: Type.Array,
        _elements: { _type: Type.String },
        _default: [],
        _description:
          'Level names that are never rendered. Their content is shown on the previous rendered level of the stack, same region. The first level of the stack cannot be hidden.',
      },
      keep: {
        _type: Type.Array,
        _elements: { _type: Type.String },
        _default: [],
        _description: 'Level names always rendered, even when no app has put anything in them (empty row).',
      },
      max: {
        _type: Type.Number,
        _default: 8,
        _description:
          'Maximum number of rendered TopBar levels. Content of the levels beyond this maximum is shown on the last rendered level.',
      },
    },
    placement: {
      _type: Type.Object,
      _elements: { _type: Type.String },
      _default: {},
      _description:
        'Moves a global TopBar element to another level and region, e.g. {"clock": "navigation:right", "nav": "main:center"}. Keys: context-selectors, search, divider, apps, quick-access, fullscreen, theme, clock, menu-panel, nav. Values: "<level>:<left|center|right>"; the level is created if no app declared it yet. Invalid entries are ignored with a console warning; if the target level is not rendered, the content shows on the previous rendered level.',
    },
    announcements: {
      requireOffset: {
        _type: Type.Boolean,
        _default: true,
        _description:
          'Transient levels (banners): require an ISO 8601 date-time WITH a UTC offset for startsAt/expiresAt (e.g. 2026-11-06T09:00:00+01:00). When false, a date-time without offset is read in `defaultOffset`.',
      },
      defaultOffset: {
        _type: Type.String,
        _default: '+01:00',
        _description:
          'UTC offset applied to ISO date-times written without one, only when `requireOffset` is false (e.g. +01:00, -05:00, Z).',
        _validators: [
          validator((v) => typeof v === 'string' && offsetMinutes(v) !== null, 'must be Z or ±HH:MM (e.g. +01:00)'),
        ],
      },
    },
  },
  externalRefLinks: {
    _type: Type.Array,
    _elements: {
      _type: Type.Object,
      title: {
        _type: Type.String,
        _description: 'Title of the link',
      },
      redirect: {
        _type: Type.String,
        _description: 'Link to redirect to (must be an external link)',
        _validators: [validators.isUrl],
      },
    },
    _default: [],
    _description: 'The external links to be showcased in the app menu',
  },
};

export type ConfigSchema = {
  logo: {
    src: string;
    alt: string;
    name: string;
    link: string;
  };
  search: {
    path: string;
  };
  topbar: {
    levels: { order: string[]; hidden: string[]; keep: string[]; max: number };
    placement: Record<string, string>;
    announcements: { requireOffset: boolean; defaultOffset: string };
  };
  externalRefLinks: { title: string; redirect: string }[];
};
