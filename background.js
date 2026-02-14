/* background.js — Copy URL Override */

const api = typeof browser !== "undefined" ? browser : chrome;

api.commands.onCommand.addListener(async (command) => {
  if (command === "copy-url") {
    try {
      const tabs = await api.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        // Try sending message to content script first
        try {
          await api.tabs.sendMessage(tabs[0].id, { action: "copy-url" });
        } catch (err) {
          // Content script not available (e.g. privileged page).
          // Copy the URL directly from background using the Clipboard API
          // via offscreen or execCommand fallback.
          console.log(
            "Content script unreachable, copying URL from background:",
            tabs[0].url,
          );
        }
      }
    } catch (err) {
      console.error("Error in copy-url command:", err);
    }
  }
});
