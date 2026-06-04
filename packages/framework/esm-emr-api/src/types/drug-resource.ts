import { type Concept, type EgenResource } from '@egen/esm-api';

export interface Drug extends EgenResource {
  uuid: string;
  strength: string;
  concept: Concept;
  dosageForm: EgenResource;
  display: string;
}
