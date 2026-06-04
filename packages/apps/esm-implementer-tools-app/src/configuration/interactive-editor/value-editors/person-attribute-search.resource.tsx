import { egenFetch, restBaseUrl } from '@egen/esm-framework';

export function fetchPersonAttributeTypeByUuid(personAttributeTypeUuid: string) {
  return egenFetch(`${restBaseUrl}/personattributetype/${personAttributeTypeUuid}`, {
    method: 'GET',
  });
}

export function performPersonAttributeTypeSearch(query: string) {
  return egenFetch(`${restBaseUrl}/personattributetype/?q=${query}`, {
    method: 'GET',
  });
}
