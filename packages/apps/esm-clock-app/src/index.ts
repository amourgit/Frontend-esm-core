import { getSyncLifecycle } from '@egen-civitas/esm-framework';
import ClockComponent from './clock/clock.component';

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const moduleName = '@egen-civitas/esm-clock-app';

// Horloge : extension du slot neutre `topbar-slot` (placement dans `meta.topbar`, routes.json).
export const clock = getSyncLifecycle(ClockComponent, { featureName: 'clock', moduleName });
