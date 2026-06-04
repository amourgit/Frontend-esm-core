import { type Concept, type ConceptClass, type EgenResource } from '@egen/esm-api';
import { type Encounter } from './encounter-resource';
import { type Patient } from './patient-resource';

// TODO: make this extends EgenResourceStrict
export interface Diagnosis extends EgenResource {
  diagnosis?: {
    coded?: {
      uuid: string;
      display?: string;
      name?: Concept;
      datatype?: EgenResource;
      conceptClass?: ConceptClass;
    };
    nonCoded?: string;
  };
  patient?: Patient;
  encounter?: Encounter;
  certainty?: string;
  rank?: number;
  formFieldNamespace?: string;
  formFieldPath?: string;
  voided?: boolean;
}
