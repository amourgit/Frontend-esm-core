/** @module @category API */
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';
import { type FetchResponse, type EgenResource, egenFetch, restBaseUrl } from '@egen/esm-api';

interface LocationTag extends EgenResource {
  name: string;
}

type DispositionType = 'ADMIT' | 'TRANSFER' | 'DISCHARGE';

/**
 * Add other properties as needed. Maintain alphabetical order. Keep in lockstep with the customRepresentation below.
 *
 * For all available configuration constants and global property keys, see:
 * @see https://github.com/egen/egen-module-emrapi/blob/master/api/src/main/java/org/egen/module/emrapi/EmrApiConstants.java
 */
export interface EmrApiConfigurationResponse {
  admissionDecisionConcept?: EgenResource;
  admissionEncounterType?: EgenResource;
  admissionForm?: EgenResource;
  atFacilityVisitType?: EgenResource;
  bedAssignmentEncounterType?: EgenResource;
  cancelADTRequestEncounterType?: EgenResource;
  checkInClerkEncounterRole?: EgenResource;
  checkInEncounterType?: EgenResource;
  clinicianEncounterRole?: EgenResource;
  conceptSourcesForDiagnosisSearch?: EgenResource;
  consultEncounterType?: EgenResource;
  consultFreeTextCommentsConcept?: EgenResource;
  denyAdmissionConcept?: EgenResource;
  diagnosisMetadata?: EgenResource;
  diagnosisSets?: EgenResource;
  dischargeForm?: EgenResource;
  dispositionDescriptor?: {
    admissionLocationConcept?: EgenResource;
    dateOfDeathConcept?: EgenResource;
    dispositionConcept?: EgenResource;
    dispositionSetConcept?: EgenResource;
    internalTransferLocationConcept?: EgenResource;
  };
  dispositions?: Array<{
    actions?: [];
    additionalObs?: null;
    careSettingTypes?: ['OUTPATIENT'];
    conceptCode?: string;
    encounterTypes?: null;
    excludedEncounterTypes?: Array<string>;
    keepsVisitOpen?: null;
    name?: string;
    type?: DispositionType;
    uuid?: string;
  }>;
  emrApiConceptSource?: EgenResource;
  exitFromInpatientEncounterType?: EgenResource;
  extraPatientIdentifierTypes?: EgenResource;
  fullPrivilegeLevel?: EgenResource;
  highPrivilegeLevel?: EgenResource;
  identifierTypesToSearch?: EgenResource;
  inpatientNoteEncounterType?: EgenResource;
  lastViewedPatientSizeLimit?: EgenResource;
  metadataSourceName?: EgenResource;
  motherChildRelationshipType?: EgenResource;
  narrowerThanConceptMapType?: EgenResource;
  nonDiagnosisConceptSets?: EgenResource;
  orderingProviderEncounterRole?: EgenResource;
  patientDiedConcept?: EgenResource;
  personImageDirectory?: EgenResource;
  primaryIdentifierType?: EgenResource;
  sameAsConceptMapType?: EgenResource;
  suppressedDiagnosisConcepts?: EgenResource;
  supportsAdmissionLocationTag?: LocationTag;
  supportsLoginLocationTag?: LocationTag;
  supportsTransferLocationTag?: LocationTag;
  supportsVisitsLocationTag?: LocationTag;
  telephoneAttributeType?: EgenResource;
  testPatientPersonAttributeType?: EgenResource;
  transferForm?: EgenResource;
  transferRequestEncounterType?: EgenResource;
  transferWithinHospitalEncounterType?: EgenResource;
  unknownCauseOfDeathConcept?: EgenResource;
  unknownLocation?: EgenResource;
  unknownPatientPersonAttributeType?: EgenResource;
  unknownProvider?: EgenResource;
  visitAssignmentHandlerAdjustEncounterTimeOfDayIfNecessary?: EgenResource;
  visitExpireHours?: EgenResource;
  visitNoteEncounterType?: EgenResource;
}

/*
 * Add other properties as needed. Maintain alphabetical order. Keep in lockstep with the interface above.
 */
const customRepProps = [
  ['admissionDecisionConcept', 'ref'],
  ['admissionEncounterType', 'ref'],
  ['admissionForm', 'ref'],
  ['atFacilityVisitType', 'ref'],
  ['bedAssignmentEncounterType', 'ref'],
  ['cancelADTRequestEncounterType', 'ref'],
  ['checkInClerkEncounterRole', 'ref'],
  ['checkInEncounterType', 'ref'],
  ['clinicianEncounterRole', 'ref'],
  ['conceptSourcesForDiagnosisSearch', 'ref'],
  ['consultEncounterType', 'ref'],
  ['consultFreeTextCommentsConcept', 'ref'],
  ['denyAdmissionConcept', 'ref'],
  ['diagnosisMetadata', 'ref'],
  ['diagnosisSets', 'ref'],
  ['dischargeForm', 'ref'],
  ['dispositionDescriptor', 'ref'],
  ['dispositions', 'ref'],
  ['emrApiConceptSource', 'ref'],
  ['exitFromInpatientEncounterType', 'ref'],
  ['extraPatientIdentifierTypes', 'ref'],
  ['fullPrivilegeLevel', 'ref'],
  ['highPrivilegeLevel', 'ref'],
  ['identifierTypesToSearch', 'ref'],
  ['inpatientNoteEncounterType', 'ref'],
  ['lastViewedPatientSizeLimit', 'ref'],
  ['metadataSourceName', 'ref'],
  ['motherChildRelationshipType', 'ref'],
  ['narrowerThanConceptMapType', 'ref'],
  ['nonDiagnosisConceptSets', 'ref'],
  ['orderingProviderEncounterRole', 'ref'],
  ['patientDiedConcept', 'ref'],
  ['personImageDirectory', 'ref'],
  ['primaryIdentifierType', 'ref'],
  ['sameAsConceptMapType', 'ref'],
  ['suppressedDiagnosisConcepts', 'ref'],
  ['supportsAdmissionLocationTag', '(uuid,display,name,links)'],
  ['supportsLoginLocationTag', '(uuid,display,name,links)'],
  ['supportsTransferLocationTag', '(uuid,display,name,links)'],
  ['supportsVisitsLocationTag', '(uuid,display,name,links)'],
  ['telephoneAttributeType', 'ref'],
  ['testPatientPersonAttributeType', 'ref'],
  ['transferForm', 'ref'],
  ['transferRequestEncounterType', 'ref'],
  ['transferWithinHospitalEncounterType', 'ref'],
  ['unknownCauseOfDeathConcept', 'ref'],
  ['unknownLocation', 'ref'],
  ['unknownPatientPersonAttributeType', 'ref'],
  ['unknownProvider', 'ref'],
  ['visitAssignmentHandlerAdjustEncounterTimeOfDayIfNecessary', 'ref'],
  ['visitExpireHours', 'ref'],
  ['visitNoteEncounterType', 'ref'],
] as const;

const customRepresentation = `custom:${customRepProps.map(([prop, rep]) => `${prop}:${rep}`).join(',')}`;

/**
 * React hook for fetching and managing Egen EMR configuration
 * @returns {Object} Object containing:
 *   - emrConfiguration: EmrApiConfigurationResponse | undefined - The EMR configuration data
 *   - isLoadingEmrConfiguration: boolean - Loading state indicator
 *   - mutateEmrConfiguration: Function - SWR's mutate function for manual revalidation
 *   - errorFetchingEmrConfiguration: Error | undefined - Error object if request fails
 */
export function useEmrConfiguration() {
  const url = `${restBaseUrl}/emrapi/configuration?v=${customRepresentation}`;
  const swrData = useSWRImmutable<FetchResponse<EmrApiConfigurationResponse>, Error>(url, egenFetch);

  const results = useMemo(
    () => ({
      emrConfiguration: swrData.data?.data,
      isLoadingEmrConfiguration: swrData.isLoading,
      mutateEmrConfiguration: swrData.mutate,
      errorFetchingEmrConfiguration: swrData.error,
    }),
    [swrData],
  );

  return results;
}
