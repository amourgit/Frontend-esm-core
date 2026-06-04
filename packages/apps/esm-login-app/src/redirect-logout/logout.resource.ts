import { mutate } from 'swr';
import { clearCurrentUser, egenFetch, refetchCurrentUser, restBaseUrl } from '@egen/esm-framework';

export async function performLogout() {
  await egenFetch(`${restBaseUrl}/session`, {
    method: 'DELETE',
  });

  // clear the SWR cache on logout, do not revalidate
  // taken from the SWR docs
  mutate(() => true, undefined, { revalidate: false });

  clearCurrentUser();
  try {
    await refetchCurrentUser();
  } catch (_) {
    // do nothing, silence the user-visible error
  }
}
