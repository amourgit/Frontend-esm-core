import { type EgenResource } from '@egen/esm-api';
import { type Diagnosis } from './diagnosis-resource';
import { type Location } from './location-resource';
import { type Obs } from './obs-resource';
import { type Patient } from './patient-resource';
import { type Visit } from './visit-resource';

// TODO: make this extends EgenResourceStrict
export interface Encounter extends EgenResource {
  encounterDatetime?: string;
  patient?: Patient;
  location?: Location;
  encounterType?: EncounterType;
  obs?: Array<Obs>;
  visit?: Visit;
  encounterProviders?: Array<EncounterProvider>;
  diagnoses?: Array<Diagnosis>;
  form?: EgenResource;
}

export interface EncounterType extends EgenResource {
  name?: string;
  description?: string;
  retired?: boolean;
}

export interface EncounterProvider extends EgenResource {
  provider?: EgenResource;
  encounterRole?: EncounterRole;
}

export interface EncounterRole extends EgenResource {
  name?: string;
  description?: string;
  retired?: boolean;
}
