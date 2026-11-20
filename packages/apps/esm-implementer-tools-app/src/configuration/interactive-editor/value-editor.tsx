import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button, CloseIcon, getCoreTranslation, SaveIcon, Type, type Config, type ConfigSchema } from '@egen-civitas/esm-framework';
import type { ConfigValueDescriptor } from './editable-value.component';
import { ValueEditorField } from './value-editors/value-editor-field';
import styles from './value-editor.styles.module.css';
import { validateValue } from './validators.resource';

export type CustomValueType = 'add' | 'remove' | 'order' | 'configure';

export type ValueType = CustomValueType | Type;

interface ValueEditorProps {
  element: ConfigValueDescriptor;
  customType?: CustomValueType;
  path: Array<string>;
  handleSaveToConfiguration: (val: string) => void;
  handleClose: () => void;
}

export function ValueEditor({ element, customType, path, handleSaveToConfiguration, handleClose }: ValueEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tmpValue, setTmpValue] = useState(element._value);
  const [error, setError] = useState<string | null>(null);

  const valueType = customType ?? element._type;
  const validators = element._validators ?? [];

  let elementSchema: ConfigValueDescriptor | Config | undefined = undefined;
  if (valueType === Type.Object) {
    elementSchema = element;
  } else if (valueType === Type.Array) {
    elementSchema = element._elements;
  }

  const handleSave = useCallback(() => {
    const errorMessage = validateValue(tmpValue, valueType, validators, elementSchema as ConfigSchema);
    if (errorMessage) {
      setError(errorMessage);
    } else {
      setError(null);
      handleSaveToConfiguration(JSON.stringify(tmpValue));
    }
  }, [tmpValue, valueType, validators, elementSchema, handleSaveToConfiguration]);

  useEffect(() => {
    const keyListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'Enter') {
        handleSave();
      }
    };

    document.addEventListener('keyup', keyListener);
    return () => {
      document.removeEventListener('keyup', keyListener);
    };
  }, [handleSave, handleClose]);

  return (
    <div ref={ref}>
      <ValueEditorField
        element={element}
        path={path}
        value={tmpValue}
        onChange={setTmpValue}
        valueType={valueType}
        error={error}
      />
      <div className={styles.errorMessage}>
        {valueType !== Type.Number &&
          valueType !== Type.String &&
          valueType !== Type.UUID &&
          valueType !== Type.Boolean &&
          error}
      </div>
      <div className={styles.valueEditorButtons}>
        <Button onClick={handleSave}>
<SaveIcon size={16} />
          {getCoreTranslation('save')}
        </Button>
        <Button variant="secondary" onClick={handleClose}>
<CloseIcon size={16} />
          {getCoreTranslation('cancel')}
        </Button>
      </div>
    </div>
  );
}
