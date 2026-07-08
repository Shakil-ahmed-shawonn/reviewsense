/**
 * @file src/components/UploadZone.jsx
 * @description Drag-and-drop CSV upload — sky blue theme.
 * UX: visible drag state, inline error, file size shown, keyboard accessible.
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { fadePop, WC_OPACITY_TRANSFORM } from "../lib/animations";

export default function UploadZone({ onFile, file, loading, error }) {
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);

  const validate = useCallback((f) => {
    if (!f) return "No file selected.";
    if (!f.name.endsWith(".csv")) return "Only .csv files are accepted.";
    if (f.size > 5 * 1024 * 1024) return "File exceeds 5 MB limit.";
    return null;
  }, []);

  const handleFile = useCallback((f) => {
    const err = validate(f);
    if (err) { setLocalError(err); return; }
    setLocalError("");
    onFile(f);
  }, [onFile, validate]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (loading) return;
    handleFile(e.dataTransfer.files[0]);
  }, [loading, handleFile]);

  const onDragOver  = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const displayError = localError || error;

  return (
    <div className="flex flex-col gap-3">
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file — click or drag and drop"
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !loading && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        whileHover={!loading ? { scale: 1.01 } : {}}
        whileTap={!loading ? { scale: 0.99 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        style={WC_OPACITY_TRANSFORM}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-10
          rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-200 select-none
          ${dragging
            ? "border-sky-500 bg-sky-50"
            : "border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50"
          }
          ${loading ? "opacity-50 cursor-not-allowed" : ""}
          ${displayError ? "border-red-300" : ""}
        `}
      >
        <div className={`p-3 rounded-full transition-colors ${dragging ? "bg-sky-100" : "bg-sky-50"}`}>
          <Upload size={22} className={dragging ? "text-sky-500" : "text-sky-400"} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-sky-700">
            {dragging ? "Drop your CSV here" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-sky-400 mt-1">
            CSV with a <span className="font-mono">review_text</span> column · Max 5 MB · Up to 5,000 rows
          </p>
        </div>
        <input ref={inputRef} type="file" accept=".csv" className="sr-only" aria-hidden
          onChange={(e) => handleFile(e.target.files?.[0])} />
      </motion.div>

      <AnimatePresence mode="wait">
        {file && !displayError && (
          <motion.div key="file-pill" variants={fadePop} initial="hidden" animate="visible"
            exit="hidden" style={WC_OPACITY_TRANSFORM}
            className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-sky-200 bg-sky-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-sky-500 shrink-0" />
              <span className="text-sm text-sky-700 font-medium truncate">{file.name}</span>
              <span className="text-xs text-sky-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onFile(null); }}
              aria-label="Remove file"
              className="p-1 rounded hover:bg-sky-100 text-sky-400 hover:text-sky-600 transition-colors">
              <X size={13} />
            </button>
          </motion.div>
        )}

        {displayError && (
          <motion.div key="error" variants={fadePop} initial="hidden" animate="visible"
            exit="hidden" style={WC_OPACITY_TRANSFORM}
            className="flex items-start gap-2 px-4 py-2.5 rounded-lg border border-red-200 bg-red-50"
            role="alert"
          >
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{displayError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
