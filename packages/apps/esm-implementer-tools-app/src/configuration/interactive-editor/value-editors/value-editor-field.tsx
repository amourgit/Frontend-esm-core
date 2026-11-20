import React, { useState } from 'react';
import uniqueId from 'lodash-es/uniqueId';
import { Checkbox, TextInput, Type } from '@egen-civitas/esm-framework';
import type { ConfigValueDescriptor } from '../editable-value.component';
import type { ValueType } from '../value-editor';
import { ArrayEditor } from './array-editor';
import { ExtensionSlotAdd } from './extension-slot-add';
import { ExtensionSlotRemove } from './extension-slot-remove';
import { ObjectEditor } from './object-editor';
import { ExtensionSlotOrder } from './extension-slot-order';

export interface ValueEditorFieldProps {
  element: ConfigValueDescriptor;
  path?: Array<string>;
  valueType?: ValueType;
  value: any;
  onChange: (value: any) => void;
  error?: string | null;
}

export function ValueEditorField({ element, path, valueType, value, onChange, error }: ValueEditorFieldProps) {
  const [id] = useState(uniqueId('value-editor-'));

  if (valueType === 'remove' && !path) {
    throw new Error("Programming error: ValueEditorField initialized for a 'remove' field, but no 'path' is available");
  }

  return valueType === Type.Array ? (
    <ArrayEditor element={element} valueArray={value} setValue={onChange} />
  ) : valueType === Type.Boolean ? (
    <div className="flex flex-col gap-1">
      <Checkbox
        id={id}
        checked={Boolean(value)}
        aria-label={element._description ?? id}
        aria-invalid={Boolean(error) || undefined}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  ) : valueType === Type.Number ? (
    <TextInput
      id={id}
      type="number"
      label={element._description ?? id}
      hideLabel
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
      errorText={error ?? undefined}
    />
  ) : valueType === Type.String || valueType === Type.UUID ? (
    <TextInput
      id={id}
      value={value}
      label={element._description ?? id}
      hideLabel
      onChange={(e) => onChange(e.target.value)}
      errorText={error ?? undefined}
    />
  ) : valueType === 'add' ? (
    <ExtensionSlotAdd value={value ?? element._value} setValue={onChange} />
  ) : valueType === 'remove' && path ? (
    <ExtensionSlotRemove
      slotName={path[2]}
      slotModuleName={path[0]}
      value={value ?? element._value}
      setValue={onChange}
    />
  ) : valueType === 'order' && path ? (
    <ExtensionSlotOrder
      slotName={path[2]}
      slotModuleName={path[0]}
      value={value ?? element._value}
      setValue={onChange}
    />
  ) : valueType === 'configure' && path ? (
    <>Todo</>
  ) : (
    <ObjectEditor element={element} valueObject={value} setValue={onChange} />
  );
}
