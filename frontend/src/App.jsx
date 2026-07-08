/**
 * @file src/App.jsx
 * @description ReviewSense — sky blue + white theme.
 * State: idle → loading → results | error
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart2, Loader2 } from "lucide-react";

import { analyzeReviews } from "./lib/api";
import { fadeUp, staggerContainer, WC_OPACITY_TRANSFORM } from "./lib/animations";

import StatusBadge    from "./components/StatusBadge";
import UploadZone     from "./components/UploadZone";
import ModelToggle    from "./components/ModelToggle";
import SentimentChart from "./components/SentimentChart";
import ThemeCloud     from "./components/ThemeCloud";
import ReviewTable    from "./components/ReviewTable";

export default function App() {
  const [file,    setFile]    = useState(null);
  const [model,   setModel]   = useState("baseline");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState("");

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const data = await analyzeReviews(file, model);
      setResults(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [file, model]);

  const handleReset = useCallback(() => {
    setFile(null); setResults(null); setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 text-sky-900 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b-2 border-sky-100 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-500">
              <BarChart2 size={16} className="text-white" />
            </div>
            <span className="font-mono text-sm font-bold text-sky-700 tracking-tight">ReviewSense</span>
          </div>
          <StatusBadge />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 flex flex-col gap-16">

        {/* ── Hero + Upload ── */}
        <motion.section variants={staggerContainer} initial="hidden" animate="visible"
          className="flex flex-col gap-10"
        >
          {/* Headline */}
          <motion.div variants={fadeUp} style={WC_OPACITY_TRANSFORM} className="max-w-xl">
            <p className="font-mono text-xs tracking-widest text-sky-400 uppercase mb-3">
              AI-powered · Sentiment Analysis
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-sky-800 mb-4">
              What do your customers{" "}
              <span className="text-sky-500">really feel?</span>
            </h1>
            <p className="text-sky-500 leading-relaxed text-base">
              Upload a CSV of customer reviews. Get instant sentiment breakdown —
              <span className="text-positive font-semibold"> positive</span>,{" "}
              <span className="text-neutral font-semibold"> neutral</span>,{" "}
              <span className="text-negative font-semibold"> negative</span> —
              plus recurring themes and per-review scores.
            </p>
          </motion.div>

          {/* Upload card */}
          <motion.div variants={fadeUp} style={WC_OPACITY_TRANSFORM}
            className="max-w-xl flex flex-col gap-5 p-6 rounded-2xl border-2 border-sky-100 bg-white shadow-card"
          >
            <UploadZone onFile={setFile} file={file} loading={loading} error={error} />
            <ModelToggle value={model} onChange={setModel} disabled={loading} />

            <motion.button
              onClick={handleAnalyze}
              disabled={!file || loading}
              whileHover={file && !loading ? { scale: 1.02 } : {}}
              whileTap={file && !loading ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={WC_OPACITY_TRANSFORM}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Analyzing {file?.name} …</>
              ) : (
                "Analyze Reviews"
              )}
            </motion.button>

            <p className="text-center text-[11px] font-mono text-sky-300">
              CSV must have a column named <span className="text-sky-400">review_text</span>
            </p>
          </motion.div>
        </motion.section>

        {/* ── Results ── */}
        <AnimatePresence mode="wait">
          {results && (
            <motion.section
              id="results"
              key="results"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={WC_OPACITY_TRANSFORM}
              className="flex flex-col gap-8"
            >
              {/* Results header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-mono text-xs tracking-widest text-sky-400 uppercase mb-1">
                    Analysis complete
                  </p>
                  <h2 className="text-2xl font-bold text-sky-800">
                    {results.total_reviews.toLocaleString()} reviews analyzed
                    <span className="ml-3 text-sm font-mono text-sky-400 font-normal">
                      via {results.model_used}
                    </span>
                  </h2>
                </div>
                <button onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium rounded-xl border-2 border-sky-200 text-sky-600 hover:border-sky-400 hover:bg-sky-50 transition-colors"
                >
                  Analyze another file
                </button>
              </div>

              {/* Chart */}
              <div className="p-6 rounded-2xl border-2 border-sky-100 bg-white shadow-card">
                <SentimentChart summary={results.summary} total={results.total_reviews} />
              </div>

              {/* Themes */}
              <div className="p-6 rounded-2xl border-2 border-sky-100 bg-white shadow-card">
                <ThemeCloud themes={results.themes} />
              </div>

              {/* Table */}
              <div className="p-6 rounded-2xl border-2 border-sky-100 bg-white shadow-card">
                <ReviewTable reviews={results.reviews} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer — credit only */}
      <footer className="border-t-2 border-sky-100 py-6">
        <p className="text-center text-xs font-mono text-sky-300">
          © {new Date().getFullYear()} Shakil Ahmed Shawon
        </p>
      </footer>
    </div>
  );
}
