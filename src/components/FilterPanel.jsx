import FilterRow from "./FilterRow";
import { createFilter, isFilterActive } from "../utils/filterEngine";

export default function FilterPanel({
  filters,
  setFilters,
  matchMode,
  setMatchMode,
  columns,
  columnTypes,
  rows,
}) {
  const addFilter = () => {
    const column = columns[0];
    setFilters((prev) => [...prev, createFilter(column, columnTypes[column] || "text")]);
  };

  const updateFilter = (id, patch) =>
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeFilter = (id) => setFilters((prev) => prev.filter((f) => f.id !== id));

  const activeCount = filters.filter(isFilterActive).length;

  return (
    <section className="panel">
      <div className="panel__head">
        <h3>
          Filters
          {activeCount > 0 && <span className="badge">{activeCount} active</span>}
        </h3>

        <div className="panel__tools">
          {filters.length > 1 && (
            <div className="seg" role="group" aria-label="Combine filters">
              <button
                className={matchMode === "all" ? "seg__btn seg__btn--on" : "seg__btn"}
                onClick={() => setMatchMode("all")}
                title="A row must match every filter"
              >
                Match all
              </button>
              <button
                className={matchMode === "any" ? "seg__btn seg__btn--on" : "seg__btn"}
                onClick={() => setMatchMode("any")}
                title="A row must match at least one filter"
              >
                Match any
              </button>
            </div>
          )}
          {filters.length > 0 && (
            <button className="btn btn--ghost" onClick={() => setFilters([])}>
              Clear all
            </button>
          )}
          <button className="btn btn--primary" onClick={addFilter}>
            + Add filter
          </button>
        </div>
      </div>

      {filters.length === 0 ? (
        <p className="panel__empty">
          No filters yet. Click <strong>+ Add filter</strong> to narrow the table by any column — you can stack as
          many as you like.
        </p>
      ) : (
        <div className="filter-list">
          {filters.map((f, i) => (
            <div key={f.id} className="filter-line">
              <span className="filter-line__joiner">
                {i === 0 ? "Where" : matchMode === "all" ? "AND" : "OR"}
              </span>
              <FilterRow
                filter={f}
                columns={columns}
                columnTypes={columnTypes}
                rows={rows}
                onChange={(patch) => updateFilter(f.id, patch)}
                onRemove={() => removeFilter(f.id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
