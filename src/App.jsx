import { useMemo, useState } from "react";
import Papa from "papaparse";
import UploadZone from "./components/UploadZone";
import FilterPanel from "./components/FilterPanel";
import DataTable from "./components/DataTable";
import { applyFilters, inferColumnTypes } from "./utils/filterEngine";

export default function App() {
  const [dataset, setDataset] = useState(null); 
  const [filters, setFilters] = useState([]);
  const [matchMode, setMatchMode] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadParsed = (name, result) => {
    const columns = (result.meta.fields || []).filter((c) => c !== "");
    const rows = result.data;

    if (columns.length === 0) {
      setError("Couldn't find a header row in this file.");
      return;
    }

    const rowErrors = result.errors.filter((e) => e.type !== "Delimiter");
    setError(rowErrors.length ? `Loaded with ${rowErrors.length} malformed row(s) — they may look incomplete.` : "");

    setDataset({ name, rows, columns, types: inferColumnTypes(rows, columns) });
    setFilters([]);
    setMatchMode("all");
  };

  const parseOptions = {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  };

  const handleFile = (file) => {
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError("Please choose a .csv file.");
      return;
    }
    setLoading(true);
    Papa.parse(file, {
      ...parseOptions,
      complete: (result) => {
        setLoading(false);
        loadParsed(file.name, result);
      },
      error: (err) => {
        setLoading(false);
        setError(`Couldn't read the file: ${err.message}`);
      },
    });
  };

  const handleSample = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}sample_audit.csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      loadParsed("sample_audit.csv", Papa.parse(text, parseOptions));
    } catch (e) {
      setError(`Couldn't load the sample data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = useMemo(
    () => (dataset ? applyFilters(dataset.rows, filters, dataset.types, matchMode) : []),
    [dataset, filters, matchMode]
  );

  const downloadFiltered = () => {
    const csv = Papa.unparse({ fields: dataset.columns, data: filteredRows.map((r) => dataset.columns.map((c) => r[c])) });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filtered_${dataset.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>CSV Explorer</h1>
          {dataset ? (
            <p className="muted">
              <strong>{dataset.name}</strong> · {dataset.rows.length.toLocaleString()} rows · {dataset.columns.length}{" "}
              columns
            </p>
          ) : (
            <p className="muted">Upload a CSV, then slice it with as many filters as you need.</p>
          )}
        </div>
        {dataset && (
          <div className="app__header-actions">
            <button className="btn" onClick={downloadFiltered} disabled={filteredRows.length === 0}>
              Download filtered CSV
            </button>
            <UploadZone compact onFile={handleFile} loading={loading} />
          </div>
        )}
      </header>

      {error && (
        <div className="alert" role="alert">
          {error}
          <button className="icon-btn" onClick={() => setError("")} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {!dataset ? (
        <UploadZone onFile={handleFile} onLoadSample={handleSample} loading={loading} />
      ) : (
        <>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            matchMode={matchMode}
            setMatchMode={setMatchMode}
            columns={dataset.columns}
            columnTypes={dataset.types}
            rows={dataset.rows}
          />
          <DataTable
            rows={filteredRows}
            columns={dataset.columns}
            columnTypes={dataset.types}
            totalRows={dataset.rows.length}
          />
        </>
      )}
    </div>
  );
}
