import { defineConfigSchema } from '@egen/esm-config';
import { refetchCurrentUser } from './current-user';
import { configSchema } from './config-schema';

/**
 * @internal
 */
export function setupApiModule() {
  defineConfigSchema('@egen/esm-api', configSchema);

  refetchCurrentUser();
}
