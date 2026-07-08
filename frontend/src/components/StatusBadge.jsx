/**
 * @file src/components/StatusBadge.jsx
 * @description API health status badge — sky blue theme.
 */

import { useEffect, useState } from "react";
import { checkHealth } from "../lib/api";

export default function StatusBadge() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    checkHealth()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, []);

  const configs = {
    checking: { dot: "bg-sky-200 animate-pulse-slow", label: "Checking...",  text: "text-sky-400" },
    ok:       { dot: "bg-positive",                   label: "API online",   text: "text-sky-600" },
    error:    { dot: "bg-negative",                   label: "API offline",  text: "text-red-500" },
  };

  const { dot, label, text } = configs[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
      <span className={`text-xs font-mono ${text}`}>{label}</span>
    </div>
  );
}
