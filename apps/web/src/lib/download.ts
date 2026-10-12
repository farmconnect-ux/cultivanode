/**
 * Client-side file download helper for CSV, JSON, and text exports.
 */
export function downloadFile(
  filename: string,
  content: string,
  mimeType = "text/csv;charset=utf-8;",
) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
