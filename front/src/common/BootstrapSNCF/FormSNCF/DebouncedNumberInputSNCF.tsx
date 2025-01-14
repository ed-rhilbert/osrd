import React, { useEffect, useState } from 'react';
import InputSNCF from 'common/BootstrapSNCF/InputSNCF';
import { useDebouncedFunc } from 'utils/helpers';

type DebouncedNumberInputSNCFProps = {
  input: number;
  label: string;
  setInput: (inputValue: number) => void;
  debouncedDelay?: number;
  id?: string;
  max?: number;
  min?: number;
};

const DebouncedNumberInputSNCF = ({
  input,
  label,
  setInput,
  debouncedDelay = 800,
  id = '',
  max = 100,
  min = 0,
}: DebouncedNumberInputSNCFProps) => {
  const [value, setValue] = useState<number | null>(input);

  useEffect(() => {
    setValue(input);
  }, [input]);

  const checkChangedInput = (newValue: number | null) => {
    if (newValue !== null && newValue !== input && min <= newValue && newValue <= max)
      setInput(newValue);
    else if (value === null && input !== 0) setInput(0);
  };

  useDebouncedFunc(value, debouncedDelay, checkChangedInput);

  return (
    <div className="debounced-number-input">
      <InputSNCF
        type="number"
        id={id}
        isInvalid={value !== null && (value < min || max < value)}
        label={label}
        max={max}
        min={min}
        noMargin
        onChange={(e) => {
          setValue(e.target.value !== '' ? parseFloat(e.target.value) : null);
        }}
        value={value !== null ? value : ''}
        sm
      />
    </div>
  );
};

export default React.memo(DebouncedNumberInputSNCF);
