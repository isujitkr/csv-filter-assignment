const BOOL_TRUE = new Set(["true", "yes", "y", "1"]);
const BOOL_FALSE = new Set(["false", "no", "n", "0"]);
const BOOL_WORDS = new Set(["true", "yes", "y", "false", "no", "n"]);

export const OPERATORS = {
  text: [
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "equals", label: "is" },
    { value: "not_equals", label: "is not" },
    { value: "in", label: "is any of" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "is_empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
  number: [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "gt", label: ">" },
    { value: "gte", label: "≥" },
    { value: "lt", label: "<" },
    { value: "lte", label: "≤" },
    { value: "between", label: "between" },
    { value: "is_empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
  date: [
    { value: "on", label: "on" },
    { value: "before", label: "before" },
    { value: "after", label: "after" },
    { value: "between", label: "between" },
    { value: "is_empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
  boolean: [
    { value: "is_true", label: "is Yes / True" },
    { value: "is_false", label: "is No / False" },
    { value: "is_empty", label: "is empty" },
    { value: "not_empty", label: "is not empty" },
  ],
};

export const NO_VALUE_OPS = new Set(["is_empty", "not_empty", "is_true", "is_false"]);

export const defaultOperator = (type) => OPERATORS[type][0].value;

export function isBlank(v) {
  return v === undefined || v === null || String(v).trim() === "";
}

export function toNumber(v) {
  if (isBlank(v)) return null;
  const cleaned = String(v).replace(/[,\s₹$€£%]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toDate(v) {
  if (isBlank(v)) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  return null;
}

export function toBool(v) {
  if (isBlank(v)) return null;
  const s = String(v).trim().toLowerCase();
  if (BOOL_TRUE.has(s)) return true;
  if (BOOL_FALSE.has(s)) return false;
  return null;
}

export function inferColumnTypes(rows, columns, sampleSize = 2000) {
  const sample = rows.length > sampleSize ? rows.slice(0, sampleSize) : rows;
  const types = {};

  for (const col of columns) {
    const values = sample.map((r) => r[col]).filter((v) => !isBlank(v));
    if (values.length === 0) {
      types[col] = "text";
      continue;
    }
    const total = values.length;
    const lower = values.map((v) => String(v).trim().toLowerCase());

    const allBool = lower.every((v) => BOOL_TRUE.has(v) || BOOL_FALSE.has(v));
    const hasWord = lower.some((v) => BOOL_WORDS.has(v));
    if (allBool && hasWord) {
      types[col] = "boolean";
      continue;
    }

    const dateHits = values.filter((v) => toDate(v) !== null).length;
    if (dateHits / total >= 0.95) {
      types[col] = "date";
      continue;
    }

    const numHits = values.filter((v) => toNumber(v) !== null).length;
    if (numHits / total >= 0.95) {
      types[col] = "number";
      continue;
    }

    types[col] = "text";
  }
  return types;
}

export function getUniqueValues(rows, column, limit = 300) {
  const set = new Set();
  for (const r of rows) {
    const v = r[column];
    if (!isBlank(v)) {
      set.add(String(v).trim());
      if (set.size >= limit) break;
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

let counter = 0;
export function createFilter(column, type) {
  counter += 1;
  return {
    id: `f${Date.now().toString(36)}${counter}`,
    column,
    operator: defaultOperator(type),
    value: "",
    value2: "",
    enabled: true,
  };
}

export function isFilterActive(f) {
  if (!f.enabled || !f.column) return false;
  if (NO_VALUE_OPS.has(f.operator)) return true;
  if (f.operator === "in") return Array.isArray(f.value) && f.value.length > 0;
  if (f.operator === "between") return !isBlank(f.value) && !isBlank(f.value2);
  return !isBlank(f.value);
}

export function matchesFilter(row, f, type) {
  const raw = row[f.column];
  const blank = isBlank(raw);

  if (f.operator === "is_empty") return blank;
  if (f.operator === "not_empty") return !blank;

  if (type === "boolean") {
    const b = toBool(raw);
    if (b === null) return false;
    return f.operator === "is_true" ? b : !b;
  }

  if (blank) return false;

  if (type === "number") {
    const n = toNumber(raw);
    if (n === null) return false;
    const a = toNumber(f.value);
    const b = toNumber(f.value2);
    switch (f.operator) {
      case "eq": return n === a;
      case "neq": return n !== a;
      case "gt": return n > a;
      case "gte": return n >= a;
      case "lt": return n < a;
      case "lte": return n <= a;
      case "between": {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return n >= lo && n <= hi;
      }
      default: return true;
    }
  }

  if (type === "date") {
    const d = toDate(raw);
    if (d === null) return false;
    const a = toDate(f.value);
    const b = toDate(f.value2);
    switch (f.operator) {
      case "on": return d === a;
      case "before": return d < a;
      case "after": return d > a;
      case "between": {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return d >= lo && d <= hi;
      }
      default: return true;
    }
  }

  const s = String(raw).trim().toLowerCase();
  if (f.operator === "in") {
    return f.value.some((v) => String(v).trim().toLowerCase() === s);
  }
  const q = String(f.value).trim().toLowerCase();
  switch (f.operator) {
    case "contains": return s.includes(q);
    case "not_contains": return !s.includes(q);
    case "equals": return s === q;
    case "not_equals": return s !== q;
    case "starts_with": return s.startsWith(q);
    case "ends_with": return s.endsWith(q);
    default: return true;
  }
}

export function applyFilters(rows, filters, columnTypes, mode = "all") {
  const active = filters.filter(isFilterActive);
  if (active.length === 0) return rows;
  return rows.filter((row) => {
    const test = (f) => matchesFilter(row, f, columnTypes[f.column] || "text");
    return mode === "any" ? active.some(test) : active.every(test);
  });
}

export function sortRows(rows, column, direction, type) {
  if (!column) return rows;
  const dir = direction === "desc" ? -1 : 1;
  const key = (r) => {
    const v = r[column];
    if (isBlank(v)) return null;
    if (type === "number") return toNumber(v);
    if (type === "date") return toDate(v);
    if (type === "boolean") return toBool(v) ? 1 : 0;
    return String(v).toLowerCase();
  };
  return [...rows].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === null && kb === null) return 0;
    if (ka === null) return 1;
    if (kb === null) return -1;
    if (typeof ka === "string") return ka.localeCompare(kb, undefined, { numeric: true }) * dir;
    return (ka - kb) * dir;
  });
}
