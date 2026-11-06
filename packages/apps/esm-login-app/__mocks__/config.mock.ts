import { type ConfigSchema } from '../src/config-schema';

export const mockConfig: ConfigSchema = {
  announcements: [],
  background: {
    image: '',
    color: '',
  },
  provider: {
    type: 'basic',
    loginUrl: '',
  },
  logo: {
    src: null,
    alt: 'Logo',
  },
  links: {
    loginSuccess: '${egenSpaBase}/home',
  },
  footer: {
    additionalLogos: [],
  },
  carousel: {
    intervalMs: 5500,
    slides: [],
  },
  showPasswordOnSeparateScreen: true,
};
