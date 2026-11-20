import React, { useState, useEffect } from 'react';
import { Autocomplete } from '@egen-civitas/esm-framework';
import type { ExtensionInternalStore } from '@egen-civitas/esm-framework/src/internal';
import { getExtensionInternalStore } from '@egen-civitas/esm-framework/src/internal';

const extensionInternalStore = getExtensionInternalStore();

export function ExtensionSlotAdd({ value, setValue }) {
  const [availableExtensions, setAvailableExtensions] = useState<Array<string>>([]);

  useEffect(() => {
    function update(state: ExtensionInternalStore) {
      setAvailableExtensions(Object.keys(state.extensions));
    }
    update(extensionInternalStore.getState());
    return extensionInternalStore.subscribe(update);
  }, []);

  return (
    <Autocomplete
      id="add-select"
      items={availableExtensions.map((name) => ({ value: name, label: name }))}
      placeholder="Select extensions"
      value={value}
      onValueChange={(selected: string[]) => setValue(selected)}
    />
  );
}
