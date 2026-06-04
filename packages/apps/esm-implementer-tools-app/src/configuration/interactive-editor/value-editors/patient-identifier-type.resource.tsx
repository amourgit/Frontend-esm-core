import useSWR from 'swr';
import { type FetchResponse, restBaseUrl } from '@egen/esm-framework';
import { egenFetch } from '@egen/esm-framework';
import { useMemo } from 'react';

export interface PatientIdentifierType {
  uuid: string;
  display: string;
}

interface PatientIdentifierTypeResponse {
  results: Array<PatientIdentifierType>;
}

export function usePatientIdentifierTypes(): {
  data: Array<PatientIdentifierType> | undefined;
  isLoading: boolean;
} {
  const { data, error } = useSWR<FetchResponse<PatientIdentifierTypeResponse>, Error>(
    `${restBaseUrl}/patientidentifiertype`,
    egenFetch,
  );
  const memoisedPatientIdentifierTypeData = useMemo(
    () => ({
      data: data?.data?.results,
      isLoading: !data && !error,
    }),
    [data, error],
  );

  return memoisedPatientIdentifierTypeData;
}
