/**
 * @file src/components/SentimentChart.jsx
 * @description Sentiment donut chart + stat cards.
 * Semantic colors: green=positive, blue=neutral, red=negative.
 * Stat cards pulse with their sentiment color on load — signature element.
 */

import { motion } from "motion/react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { staggerContainer, fadePop, WC_OPACITY_TRANSFORM } from "../lib/animations";

// Semantic sentiment colors — the core visual language of this app
const SENTIMENT = {
  positive: { color: "#22C55E", bg: "#F0FDF4", border: "#86EFAC", text: "text-green-600",  glow: "rgba(34,197,94,0.2)" },
  neutral:  { color: "#2196F3", bg: "#EFF6FF", border: "#BFDBFE", text: "text-sky-500",    glow: "rgba(33,150,243,0.2)" },
  negative: { color: "#EF4444", bg: "#FEF2F2", border: "#FCA5A5", text: "text-red-500",    glow: "rgba(239,68,68,0.2)" },
};

export default function SentimentChart({ summary, total }) {
  const data = [
    { name: "Positive", value: summary.positive, ...SENTIMENT.positive },
    { name: "Neutral",  value: summary.neutral,  ...SENTIMENT.neutral  },
    { name: "Negative", value: summary.negative, ...SENTIMENT.negative },
  ].filter((d) => d.value > 0);

  const pct = (n) => total > 0 ? ((n / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-mono text-sky-400 uppercase tracking-widest">Breakdown</p>

      {/* Signature element: stat cards with semantic color glow on load */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Positive", key: "positive", value: summary.positive },
          { label: "Neutral",  key: "neutral",  value: summary.neutral  },
          { label: "Negative", key: "negative", value: summary.negative },
        ].map(({ label, key, value }) => {
          const s = SENTIMENT[key];
          return (
            <motion.div
  key={label}
  variants={fadePop}
  style={{
    willChange: "opacity, transform",
    backgroundColor: s.bg,
    borderColor: s.border,
    boxShadow: `0 0 0 0 ${s.glow}`,
  }}
  className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-shadow"
>
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className={`text-3xl font-bold ${s.text}`}
              >
                {value}
              </motion.span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">{label}</span>
              <span className={`text-xs font-semibold ${s.text}`}>{pct(value)}%</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Donut chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%"
              innerRadius={55} outerRadius={85} paddingAngle={3}
              dataKey="value" animationBegin={0} animationDuration={700}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} reviews (${pct(value)}%)`, name]}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #BFDBFE",
                borderRadius: "10px",
                fontSize: "12px",
                color: "#1565C0",
                boxShadow: "0 4px 12px rgba(33,150,243,0.1)",
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: "12px", color: "#1E88E5" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
