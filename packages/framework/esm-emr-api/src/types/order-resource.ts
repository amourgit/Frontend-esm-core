import { type Concept, type EgenResource } from '@egen/esm-api';
import { type Drug } from './drug-resource';

export type FulfillerStatus =
  | 'COMPLETED'
  | 'DECLINED'
  | 'DISCONTINUED'
  | 'DRAFT'
  | 'EXCEPTION'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RECEIVED';

export type OrderAction = 'DISCONTINUE' | 'NEW' | 'RENEW' | 'REVISE';

export type OrderUrgency = 'ON_SCHEDULED_DATE' | 'ROUTINE' | 'STAT';

export interface Order extends EgenResource {
  uuid: string;
  action: OrderAction;
  asNeeded: boolean;
  asNeededCondition?: string;
  autoExpireDate: string;
  brandName?: string;
  careSetting: EgenResource;
  commentToFulfiller: string;
  concept: Concept;
  dateActivated: string;
  dateStopped?: string | null;
  dispenseAsWritten: boolean;
  dose: number;
  doseUnits: EgenResource;
  dosingInstructions: string | null;
  dosingType?: 'org.egen.FreeTextDosingInstructions' | 'org.egen.SimpleDosingInstructions';
  drug: Drug;
  duration: number;
  durationUnits: EgenResource;
  encounter: EgenResource;
  frequency: EgenResource;
  instructions?: string | null;
  numRefills: number;
  orderNumber: string;
  orderReason: Concept | null;
  orderReasonNonCoded: string | null;
  orderType: {
    conceptClasses: Array<any>;
    description: string;
    display: string;
    name: string;
    parent: string | null;
    retired: boolean;
    uuid: string;
  };
  orderer: {
    display: string;
    person: {
      display: string;
    };
    uuid: string;
  };
  patient: EgenResource;
  previousOrder: { uuid: string; type: string; display: string } | null;
  quantity: number;
  quantityUnits: EgenResource;
  route: EgenResource;
  urgency: OrderUrgency;

  // additional properties
  accessionNumber: string;
  scheduledDate: string;
  display: string;
  fulfillerStatus: FulfillerStatus;
  fulfillerComment: string;
  specimenSource: Concept | null;
  laterality: string;
  clinicalHistory: string;
  numberOfRepeats: number;
  type: string;
}
