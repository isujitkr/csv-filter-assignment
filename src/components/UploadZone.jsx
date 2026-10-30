import { useRef, useState } from "react";

export default function UploadZone({ onFile, onLoadSample, compact, loading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`upload ${compact ? "upload--compact" : ""} ${dragging ? "upload--drag" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {!compact && (
        <>
          <div className="upload__icon" aria-hidden="true">⇪</div>
          <h2>Upload a CSV file</h2>
          <p>Drag &amp; drop it here, or choose a file from your computer.</p>
        </>
      )}
      <div className="upload__actions">
        <button className="btn btn--primary" onClick={() => inputRef.current.click()} disabled={loading}>
          {loading ? "Reading…" : compact ? "Upload another CSV" : "Choose CSV file"}
        </button>
        {onLoadSample && (
          <button className="btn" onClick={onLoadSample} disabled={loading}>
            Load sample data
          </button>
        )}
      </div>
    </div>
  );
}
