/**
 * Safe copy to clipboard utility that handles iframe permissions restrictions
 * and falls back to document.execCommand('copy') when navigator.clipboard.writeText fails.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn("navigator.clipboard.writeText denied or failed, attempting fallback...", err);
  }

  // Fallback for iframe / denied writeText permission
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    // Prevent scrolling to bottom on mobile / desktop
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback execCommand copy failed:", err);
    return false;
  }
};
