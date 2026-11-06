import { egenFetch, refetchCurrentUser, restBaseUrl, type Session } from '@egen-civitas/esm-framework';

export async function performLogin(username: string, password: string): Promise<{ data: Session }> {
  const abortController = new AbortController();
  const token = window.btoa(`${username}:${password}`);
  const url = `${restBaseUrl}/session`;

  return egenFetch(url, {
    headers: {
      Authorization: `Basic ${token}`,
    },
    signal: abortController.signal,
  }).then((res) => {
    refetchCurrentUser();
    return res;
  });
}
