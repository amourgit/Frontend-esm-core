import { type Concept, type EgenResource, type Person } from '@egen/esm-api';
import { type Encounter } from './encounter-resource';
import { type Location } from './location-resource';

export interface Obs extends EgenResource {
  concept?: Concept;
  person?: Person;
  obsDatetime?: string;
  accessionNumber?: string;
  obsGroup?: Obs;
  valueCodedName?: EgenResource;
  groupMembers?: Array<Obs>;
  comment?: string;
  location?: Location;
  order?: EgenResource;
  encounter?: Encounter;
  value?: number | string | boolean | EgenResource;
  valueModifier?: string;
  formFilePath?: string;
  formFiledNamespace?: string;
  status?: 'PRELIMINARY' | 'FINAL' | 'AMENDED';
  interpretation?: string;
}
