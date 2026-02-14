/* content.js — Copy URL Override */

function showToast(url) {
  const toast = document.createElement("div");
  toast.textContent = "✅ URL Copied!";
  toast.setAttribute("title", url);

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
      showToast(url);
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
      showToast(url);
    });
}

// Listen for messages from background script
const api = typeof browser !== "undefined" ? browser : chrome;
if (api && api.runtime) {
  api.runtime.onMessage.addListener((message) => {
    if (message && message.action === "copy-url") {
      copyCurrentUrl();
    }
  });
}

// Intercept Cmd+Shift+C / Ctrl+Shift+C in capturing phase to block DevTools
window.addEventListener(
  "keydown",
  (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyC") {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      copyCurrentUrl();
    }
  },
  true,
);
