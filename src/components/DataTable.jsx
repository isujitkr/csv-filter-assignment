import { useEffect, useMemo, useState } from "react";
import { sortRows } from "../utils/filterEngine";

const PAGE_SIZES = [25, 50, 100, 250];

export default function DataTable({ rows, columns, columnTypes, totalRows }) {
  const [sort, setSort] = useState({ column: null, direction: "asc" });
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => sortRows(rows, sort.column, sort.direction, columnTypes[sort.column]),
    [rows, sort, columnTypes]
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));

  useEffect(() => setPage(0), [rows, pageSize]);

  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  const toggleSort = (column) =>
    setSort((s) =>
      s.column !== column
        ? { column, direction: "asc" }
        : s.direction === "asc"
        ? { column, direction: "desc" }
        : { column: null, direction: "asc" }
    );

  return (
    <section className="panel panel--table">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="rownum">#</th>
              {columns.map((c) => {
                const active = sort.column === c;
                return (
                  <th
                    key={c}
                    className={columnTypes[c] === "number" ? "num" : ""}
                    onClick={() => toggleSort(c)}
                    aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <span>{c}</span>
                    <span className={`sort ${active ? "sort--on" : ""}`}>
                      {active ? (sort.direction === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="no-results" colSpan={columns.length + 1}>
                  {totalRows === 0 ? "The file has no data rows." : "No rows match the current filters."}
                </td>
              </tr>
            ) : (
              visible.map((row, i) => (
                <tr key={start + i}>
                  <td className="rownum">{start + i + 1}</td>
                  {columns.map((c) => (
                    <td key={c} className={columnTypes[c] === "number" ? "num" : ""} title={row[c]}>
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <div>
          {sorted.length === 0
            ? "0 rows"
            : `Showing ${start + 1}–${Math.min(start + pageSize, sorted.length)} of ${sorted.length.toLocaleString()}`}
          {sorted.length !== totalRows && ` (filtered from ${totalRows.toLocaleString()})`}
        </div>
        <div className="pager__controls">
          <label>
            Rows per page{" "}
            <select className="control control--sm" value={pageSize} onChange={(e) => setPageSize(+e.target.value)}>
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn--sm" onClick={() => setPage(0)} disabled={safePage === 0}>
            «
          </button>
          <button className="btn btn--sm" onClick={() => setPage(safePage - 1)} disabled={safePage === 0}>
            ‹
          </button>
          <span>
            Page {safePage + 1} / {pageCount}
          </span>
          <button className="btn btn--sm" onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount - 1}>
            ›
          </button>
          <button className="btn btn--sm" onClick={() => setPage(pageCount - 1)} disabled={safePage >= pageCount - 1}>
            »
          </button>
        </div>
      </div>
    </section>
  );
}
