/**
 * Safe Clipboard Copy Utility
 *
 * Copies text using navigator.clipboard with fallback for restricted/insecure browser contexts.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Modern asynchronous Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy DOM copy fallback if permission denied
    }
  }

  // Fallback using temporary textarea
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const successful =
        typeof document.execCommand === "function"
          ? document.execCommand("copy")
          : false;
      document.body.removeChild(textarea);
      return Boolean(successful);
    } catch {
      return false;
    }
  }

  return false;
}
