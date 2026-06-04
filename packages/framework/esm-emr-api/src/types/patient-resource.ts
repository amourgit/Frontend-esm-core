import { type EgenResourceStrict, type Person } from '@egen/esm-api';

export interface PatientIdentifierType extends EgenResourceStrict {
  name?: string;
  description?: string;
  format?: string;
  formatDescription?: string;
  required?: boolean;
  validator?: string;
  locationBehavior?: string;
  uniquenessBehavior?: string;
  retired?: boolean;
}

export interface Patient extends EgenResourceStrict {
  identifiers?: PatientIdentifier[];
  person?: Person;
  voided?: boolean;
}

export interface PatientIdentifier extends EgenResourceStrict {
  identifier?: string;
  identifierType?: PatientIdentifierType;
  location?: Location;
  preferred?: boolean;
  voided?: boolean;
}
