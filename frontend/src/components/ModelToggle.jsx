/**
 * @file src/components/ModelToggle.jsx
 * @description Model selector — sky blue theme with proper explanations.
 * Explains what each model does so users can make informed choices.
 */

import { motion } from "motion/react";
import { Zap, Brain } from "lucide-react";
import { WC_OPACITY_TRANSFORM } from "../lib/animations";

const MODELS = [
  {
    id: "baseline",
    label: "Baseline",
    icon: Zap,
    tag: "Recommended",
    desc: "TF-IDF + Logistic Regression. Trained on 50k Amazon reviews. 3-class (positive / neutral / negative). Fast, lightweight, 77% accuracy.",
  },
  {
    id: "transformer",
    label: "Transformer",
    icon: Brain,
    tag: "Higher accuracy",
    desc: "RoBERTa fine-tuned on 124M tweets. Native 3-class model (positive / neutral / negative). More accurate on short product reviews.",
  },
];

export default function ModelToggle({ value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-sky-400 uppercase tracking-widest">Model</p>
      <div className="grid grid-cols-2 gap-2">
        {MODELS.map(({ id, label, icon: Icon, tag, desc }) => {
          const active = value === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onChange(id)}
              disabled={disabled}
              aria-pressed={active}
              title={desc}
              className={`
                relative flex flex-col gap-1.5 p-3 rounded-xl border text-left
                transition-all duration-200 disabled:cursor-not-allowed
                ${active
                  ? "border-sky-500 bg-sky-500 text-white shadow-card-hover"
                  : "border-sky-200 bg-white text-sky-700 hover:border-sky-400 hover:bg-sky-50"
                }
              `}
            >
              {active && (
                <motion.div
                  layoutId="model-bg"
                  className="absolute inset-0 rounded-xl bg-sky-500"
                  style={WC_OPACITY_TRANSFORM}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={active ? "text-white" : "text-sky-500"} />
                  <span className="text-sm font-bold">{label}</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                  active ? "border-white/30 text-white/80" : "border-sky-200 text-sky-400"
                }`}>
                  {tag}
                </span>
              </div>
              <p className={`relative z-10 text-[10px] leading-relaxed line-clamp-3 ${
                active ? "text-white/75" : "text-sky-400"
              }`}>
                {desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
