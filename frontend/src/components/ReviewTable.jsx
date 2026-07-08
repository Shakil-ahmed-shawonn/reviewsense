/**
 * @file src/components/ReviewTable.jsx
 * @description Per-review results table — sky blue theme.
 * Semantic sentiment badges: green=positive, blue=neutral, red=negative.
 * Paginated at 20 rows.
 */

import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { staggerContainer, slideLeft, WC_OPACITY_TRANSFORM } from "../lib/animations";

const PAGE_SIZE = 20;

const BADGE = {
  positive: "bg-green-50 text-green-700 border-green-200",
  neutral:  "bg-sky-50  text-sky-600   border-sky-200",
  negative: "bg-red-50  text-red-600   border-red-200",
};

const BAR = {
  positive: "bg-positive",
  neutral:  "bg-neutral",
  negative: "bg-negative",
};

export default function ReviewTable({ reviews }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
  const slice = reviews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-sky-400 uppercase tracking-widest">Per-Review Results</p>
        <span className="text-xs text-sky-400 font-mono">{reviews.length} reviews</span>
      </div>

      <div className="rounded-xl border-2 border-sky-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 border-b-2 border-sky-100 bg-sky-50">
          {["Review", "Sentiment", "Confidence"].map((h) => (
            <span key={h} className="text-[10px] font-mono uppercase tracking-widest text-sky-400">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <motion.div key={page} variants={staggerContainer} initial="hidden" animate="visible">
          {slice.map((review, i) => (
            <motion.div key={i} variants={slideLeft} style={WC_OPACITY_TRANSFORM}
              className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3 border-b border-sky-50 last:border-0 hover:bg-sky-50/60 transition-colors"
            >
              <p className="text-sm text-sky-800 line-clamp-2 leading-relaxed">{review.text}</p>

              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border capitalize whitespace-nowrap ${BADGE[review.sentiment]}`}>
                {review.sentiment}
              </span>

              <div className="flex flex-col items-end gap-1 w-24">
                <span className="text-[10px] font-mono text-sky-400">
                  {(review.confidence * 100).toFixed(0)}%
                </span>
                <div className="w-full h-1.5 rounded-full bg-sky-100 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${BAR[review.sentiment]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${review.confidence * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.02 }}
                    style={{ willChange: "width" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            aria-label="Previous page"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border-2 border-sky-200 text-sky-600 disabled:opacity-40 hover:border-sky-400 hover:bg-sky-50 transition-colors disabled:cursor-not-allowed"
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <span className="text-xs font-mono text-sky-400">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            aria-label="Next page"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border-2 border-sky-200 text-sky-600 disabled:opacity-40 hover:border-sky-400 hover:bg-sky-50 transition-colors disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
