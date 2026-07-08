/**
 * @file src/lib/api.js
 * @description All backend API calls for ReviewSense.
 * Uses VITE_API_URL env variable in production (Hugging Face Spaces URL).
 * Falls back to empty string (Vite proxy) in local dev.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Checks backend health — used for the status badge.
 * @returns {Promise<{status: string, baseline_loaded: boolean, transformer_loaded: boolean}>}
 */
export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

/**
 * Uploads a CSV file and runs sentiment analysis.
 * @param {File}   file   - CSV file to analyze
 * @param {string} model  - "baseline" or "transformer"
 * @returns {Promise<AnalyzeResponse>}
 */
export async function analyzeReviews(file, model = "baseline") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? "Analysis failed");
  }

  return res.json();
}
