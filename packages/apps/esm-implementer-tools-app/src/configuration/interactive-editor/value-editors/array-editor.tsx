import React, { useMemo } from 'react';
import cloneDeep from 'lodash-es/cloneDeep';
import uniqueId from 'lodash-es/uniqueId';
import { AddIcon, Button, IconButton, StructuredList, StructuredListBody, StructuredListCell, StructuredListRow, Tile, TrashCanIcon, Type } from '@egen-civitas/esm-framework';
import { ValueEditorField } from './value-editor-field';
import type { ConfigValueDescriptor } from '../editable-value.component';
import styles from './array-editor.styles.module.css';

interface ArrayEditorProps {
  element: ConfigValueDescriptor;
  valueArray: Array<any>;
  setValue: (value: Array<any>) => void;
}

export function ArrayEditor({ element, valueArray, setValue }: ArrayEditorProps) {
  const arrayKey = useMemo(() => uniqueId('array-editor-'), []);
  const currentValueArray = valueArray ?? [];
  return (
    <Tile className={styles.arrayEditor}>
      <StructuredList>
        <StructuredListBody>
          {currentValueArray.map((value, i) => (
            <StructuredListRow key={`${arrayKey}-${i}`}>
              <StructuredListCell>
                <ValueEditorField
                  element={{
                    ...element._elements,
                    _value: value,
                    _source: element._source,
                  }}
                  valueType={(element._elements?._type as Type) ?? Type.Object}
                  value={value}
                  onChange={(newValue) => {
                    const newValueArray = cloneDeep(currentValueArray);
                    newValueArray[i] = newValue;
                    setValue(newValueArray);
                  }}
                />
              </StructuredListCell>
              <StructuredListCell className={styles.buttonCell}>
                <IconButton icon={<TrashCanIcon size={16} />} label="Remove" size="icon-sm" variant="ghost" onClick={() => { const newValueArray = cloneDeep(currentValueArray); newValueArray.splice(i, 1); setValue(newValueArray); }} />
              </StructuredListCell>
            </StructuredListRow>
          ))}
          <StructuredListRow>
            <StructuredListCell>
              <IconButton icon={<AddIcon size={16} />} label="Add" size="icon-sm" onClick={() => { const newValueArray = cloneDeep(currentValueArray); const newValue = (element._elements?._type ?? Type.Object) == Type.Object ? {} : null; newValueArray.push(newValue); setValue(newValueArray); }} />
            </StructuredListCell>
          </StructuredListRow>
        </StructuredListBody>
      </StructuredList>
    </Tile>
  );
}
