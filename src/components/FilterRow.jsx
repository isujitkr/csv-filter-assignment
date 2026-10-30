import { useMemo } from "react";
import { OPERATORS, NO_VALUE_OPS, defaultOperator, getUniqueValues } from "../utils/filterEngine";

export default function FilterRow({ filter, columns, columnTypes, rows, onChange, onRemove }) {
  const type = columnTypes[filter.column] || "text";
  const operators = OPERATORS[type];
  const needsValue = !NO_VALUE_OPS.has(filter.operator);
  const isBetween = filter.operator === "between";
  const isIn = filter.operator === "in";

  const options = useMemo(
    () => (isIn ? getUniqueValues(rows, filter.column) : []),
    [isIn, rows, filter.column]
  );

  const changeColumn = (column) => {
    const newType = columnTypes[column] || "text";
    onChange({
      column,
      operator: defaultOperator(newType),
      value: "",
      value2: "",
    });
  };

  const changeOperator = (operator) => {
    onChange({
      operator,
      value: operator === "in" ? [] : Array.isArray(filter.value) ? "" : filter.value,
      value2: "",
    });
  };

  const inputType = type === "number" ? "number" : type === "date" ? "date" : "text";

  const toggleOption = (opt) => {
    const current = Array.isArray(filter.value) ? filter.value : [];
    onChange({
      value: current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt],
    });
  };

  return (
    <div className={`filter-row ${filter.enabled ? "" : "filter-row--off"}`}>
      <label className="switch" title={filter.enabled ? "Disable this filter" : "Enable this filter"}>
        <input
          type="checkbox"
          checked={filter.enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        <span />
      </label>

      <select
        className="control"
        value={filter.column}
        onChange={(e) => changeColumn(e.target.value)}
        aria-label="Column"
      >
        {columns.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <span className={`type-tag type-tag--${type}`}>{type}</span>

      <select
        className="control"
        value={filter.operator}
        onChange={(e) => changeOperator(e.target.value)}
        aria-label="Operator"
      >
        {operators.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {needsValue && !isIn && (
        <div className="value-group">
          <input
            className="control"
            type={inputType}
            value={filter.value}
            placeholder={isBetween ? "from" : "value"}
            onChange={(e) => onChange({ value: e.target.value })}
            aria-label="Value"
          />
          {isBetween && (
            <>
              <span className="and">and</span>
              <input
                className="control"
                type={inputType}
                value={filter.value2}
                placeholder="to"
                onChange={(e) => onChange({ value2: e.target.value })}
                aria-label="Second value"
              />
            </>
          )}
        </div>
      )}

      {isIn && (
        <details className="multi">
          <summary className="control">
            {Array.isArray(filter.value) && filter.value.length > 0
              ? `${filter.value.length} selected`
              : "Select values…"}
          </summary>
          <div className="multi__panel">
            {options.length === 0 && <div className="multi__empty">No values</div>}
            {options.map((opt) => (
              <label key={opt} className="multi__item">
                <input
                  type="checkbox"
                  checked={Array.isArray(filter.value) && filter.value.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </details>
      )}

      <button className="icon-btn" onClick={onRemove} title="Remove filter" aria-label="Remove filter">
        ✕
      </button>
    </div>
  );
}
