import { egenFetch, restBaseUrl } from '@egen/esm-framework';

export function changeUserPassword(oldPassword: string, newPassword: string) {
  return egenFetch(`${restBaseUrl}/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      oldPassword,
      newPassword,
    },
  });
}
