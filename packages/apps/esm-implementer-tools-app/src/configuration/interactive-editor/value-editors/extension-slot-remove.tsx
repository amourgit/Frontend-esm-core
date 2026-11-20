import React from 'react';
import { Autocomplete, useAssignedExtensions } from '@egen-civitas/esm-framework';

export function ExtensionSlotRemove({ slotName, slotModuleName, value, setValue }) {
  const assignedIds = useAssignedExtensions(slotName).map((e) => e.id);

  return (
    <Autocomplete
      id="remove-select"
      items={assignedIds.map((id) => ({ value: id, label: id }))}
      placeholder="Select extensions"
      value={value}
      onValueChange={(selected: string[]) => setValue(selected)}
    />
  );
}
