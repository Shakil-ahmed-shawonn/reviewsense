/**
 * @file src/components/ThemeCloud.jsx
 * @description Top recurring phrases per sentiment class.
 * Semantic colors: green pills = positive, blue = neutral, red = negative.
 */

import { motion } from "motion/react";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";
import { staggerContainer, fadePop, WC_OPACITY_TRANSFORM } from "../lib/animations";

const GROUPS = [
  {
    key: "positive",
    label: "Customers praise",
    icon: TrendingUp,
    pill: "bg-green-50 text-green-700 border-green-200",
    header: "text-green-600",
    card: "border-green-100 bg-green-50/40",
  },
  {
    key: "neutral",
    label: "Mixed mentions",
    icon: Minus,
    pill: "bg-sky-50 text-sky-600 border-sky-200",
    header: "text-sky-500",
    card: "border-sky-100 bg-sky-50/40",
  },
  {
    key: "negative",
    label: "Customers complain",
    icon: TrendingDown,
    pill: "bg-red-50 text-red-600 border-red-200",
    header: "text-red-500",
    card: "border-red-100 bg-red-50/40",
  },
];

export default function ThemeCloud({ themes }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-mono text-sky-400 uppercase tracking-widest">Key Themes</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {GROUPS.map(({ key, label, icon: Icon, pill, header, card }) => {
          const phrases = themes[key] ?? [];
          return (
            <div key={key} className={`flex flex-col gap-3 p-4 rounded-xl border-2 ${card}`}>
              <div className={`flex items-center gap-2 ${header}`}>
                <Icon size={13} />
                <p className="text-xs font-bold">{label}</p>
              </div>
              {phrases.length === 0 ? (
                <p className="text-xs text-sky-300 italic">Upload more reviews to see themes</p>
              ) : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                  className="flex flex-wrap gap-1.5">
                  {phrases.map((phrase) => (
                    <motion.span key={phrase} variants={fadePop} style={WC_OPACITY_TRANSFORM}
                      className={`px-2 py-0.5 text-xs rounded-md border font-medium ${pill}`}>
                      {phrase}
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
