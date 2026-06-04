/** @module @category UI */
import useSWR from 'swr';
import { egenFetch, restBaseUrl } from '@egen/esm-api';
import { useConfig } from '@egen/esm-react-utils';
import { type StyleguideConfigObject } from '../config-schema';

export interface UsePatientPhotoResult {
  data: { dateTime: string; imageSrc: string } | null;
  error?: Error;
  isLoading: boolean;
}

interface ObsFetchResponse {
  results: Array<PhotoObs>;
}

interface PhotoObs {
  display: string;
  obsDatetime: string;
  uuid: string;
  value: {
    display: string;
    links: {
      rel: string;
      uri: string;
    };
  };
}

export function usePatientPhoto(patientUuid: string): UsePatientPhotoResult {
  const { patientPhotoConceptUuid } = useConfig<StyleguideConfigObject>({
    externalModuleName: '@egen/esm-styleguide',
  });

  const url = patientPhotoConceptUuid
    ? `${restBaseUrl}/obs?patient=${patientUuid}&concept=${patientPhotoConceptUuid}&v=full`
    : null;

  const { data, error, isLoading } = useSWR<{ data: ObsFetchResponse }, Error>(patientUuid ? url : null, egenFetch);

  const item = data?.data?.results[0];

  return {
    data: item
      ? {
          dateTime: item?.obsDatetime,
          imageSrc: item?.value?.links?.uri,
        }
      : null,
    error: error,
    isLoading,
  };
}
