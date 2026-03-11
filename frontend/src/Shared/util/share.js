export const shareUrl = async ({ title, text, url }) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") {
        return;
      }
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(url);
    window.alert("Link copied to clipboard.");
    return;
  }

  window.prompt("Copy this link:", url);
};
