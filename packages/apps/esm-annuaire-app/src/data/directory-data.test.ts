import { describe, expect, it } from 'vitest';
import {
  DIRECTORY_EMPLOYEES,
  DIRECTORY_SITES,
  findEmployeeByParam,
  getEmployeeUuid,
} from './directory-data';

describe('directory-data', () => {
  it('expose des collaborateurs et des sites', () => {
    expect(DIRECTORY_EMPLOYEES.length).toBeGreaterThan(0);
    expect(DIRECTORY_SITES.length).toBeGreaterThan(0);
  });

  it('retrouve un collaborateur par son UUID', () => {
    const employee = DIRECTORY_EMPLOYEES[0];
    const uuid = employee.uuid || getEmployeeUuid(employee);
    expect(findEmployeeByParam(uuid)?.id).toBe(employee.id);
  });

  it('retrouve un collaborateur par son id', () => {
    const employee = DIRECTORY_EMPLOYEES[0];
    expect(findEmployeeByParam(employee.id)?.id).toBe(employee.id);
  });

  it("ne retourne rien pour un paramètre inconnu", () => {
    expect(findEmployeeByParam('inconnu-xyz')).toBeUndefined();
  });
});
