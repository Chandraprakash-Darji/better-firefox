/* content.js — Better Firefox */

function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.setAttribute("title", text);

  Object.assign(toast.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    backgroundColor: "rgba(30, 30, 30, 0.92)",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: "8px",
    zIndex: "2147483647",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    opacity: "0",
    transform: "translateY(-10px)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    maxWidth: "400px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  });

  document.documentElement.appendChild(toast);

  void toast.offsetWidth;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

function copyCurrentUrl() {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      showToast("✅ URL Copied!");
    })
    .catch(() => {
      // Fallback using execCommand
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast("✅ URL Copied!");
    });
}

// Listen for messages from background script
const api = typeof browser !== "undefined" ? browser : chrome;
if (api && api.runtime) {
  api.runtime.onMessage.addListener((message) => {
    if (!message) return;
    if (message.action === "copy-url") {
      copyCurrentUrl();
    }
    if (message.action === "show-toast" && message.text) {
      showToast(message.text);
    }
  });
}

// ── Keyboard shortcut interception (capturing phase) ──
window.addEventListener(
  "keydown",
  (e) => {
    // Feature 1: Cmd+Shift+C → copy URL
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      copyCurrentUrl();
      return;
    }

    // Feature 2: Cmd+W → ask background to discard if pinned, close if not
    if (
      (e.metaKey || e.ctrlKey) &&
      !e.shiftKey &&
      !e.altKey &&
      e.code === "KeyW"
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (api && api.runtime) {
        api.runtime.sendMessage({ action: "unload-tab" });
      }
    }
  },
  true,
);
