import { useEffect, useState } from 'react';

export default function ModelSelect({ value, onChange, options, placeholder = 'Select a model', label, help, disabled = false, id = 'model-select' }) {
  const [selected, setSelected] = useState(value || '');
  const safeOptions = Array.isArray(options) ? options : [];

  useEffect(() => {
    setSelected(value || '');
  }, [value]);

  const handleChange = event => {
    const newValue = event.target.value;
    setSelected(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} value={selected} onChange={handleChange} disabled={disabled}>
        <option value="">
          {placeholder}
        </option>
        {safeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help && <small>{help}</small>}
    </div>
  );
}
