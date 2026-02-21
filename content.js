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

function isWhatsAppWeb() {
  return window.location.hostname === "web.whatsapp.com";
}

function getStorageLocal() {
  if (api && api.storage && api.storage.local) return api.storage.local;
  return null;
}

function storageGet(key, fallbackValue) {
  const storageLocal = getStorageLocal();
  if (!storageLocal) return Promise.resolve(fallbackValue);

  try {
    const maybePromise = storageLocal.get(key);
    if (maybePromise && typeof maybePromise.then === "function") {
      return maybePromise
        .then((result) =>
          result && typeof result[key] !== "undefined"
            ? result[key]
            : fallbackValue,
        )
        .catch(() => fallbackValue);
    }
  } catch (_) {}

  return new Promise((resolve) => {
    try {
      storageLocal.get(key, (result) => {
        const value =
          result && typeof result[key] !== "undefined"
            ? result[key]
            : fallbackValue;
        resolve(value);
      });
    } catch (_) {
      resolve(fallbackValue);
    }
  });
}

function storageSet(key, value) {
  const storageLocal = getStorageLocal();
  if (!storageLocal) return Promise.resolve();

  const payload = { [key]: value };

  try {
    const maybePromise = storageLocal.set(payload);
    if (maybePromise && typeof maybePromise.then === "function") {
      return maybePromise.catch(() => undefined);
    }
  } catch (_) {}

  return new Promise((resolve) => {
    try {
      storageLocal.set(payload, () => resolve());
    } catch (_) {
      resolve();
    }
  });
}

(function initWhatsAppPrivacyMode() {
  if (!isWhatsAppWeb()) return;

  const STORAGE_KEY = "bf_whatsapp_privacy_enabled";
  const STYLE_ID = "bf-wa-privacy-style";
  const TOGGLE_ID = "bf-wa-privacy-toggle";
  const ROW_CLASS = "bf-wa-hover-unblur";
  const BLUR_CLASS = "bf-wa-blur-target";

  let enabled = false;
  let observer = null;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOGGLE_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        color: #fff;
        background: rgba(28, 28, 28, 0.9);
        cursor: pointer;
      }
      #${TOGGLE_ID}.is-on {
        background: rgba(13, 128, 105, 0.95);
      }
      .${BLUR_CLASS} {
        filter: blur(7px);
        transition: filter 0.18s ease;
      }
      .${ROW_CLASS}:hover .${BLUR_CLASS} {
        filter: blur(0);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function setButtonState() {
    const button = document.getElementById(TOGGLE_ID);
    if (!button) return;
    button.textContent = enabled
      ? "Privacy: ON (hover to reveal)"
      : "Privacy: OFF";
    if (enabled) button.classList.add("is-on");
    else button.classList.remove("is-on");
  }

  function clearPrivacyClasses() {
    document.querySelectorAll(`.${BLUR_CLASS}`).forEach((node) => {
      node.classList.remove(BLUR_CLASS);
    });
    document.querySelectorAll(`.${ROW_CLASS}`).forEach((node) => {
      node.classList.remove(ROW_CLASS);
    });
  }

  function markChatListRows() {
    const rows = document.querySelectorAll('div[role="row"]');
    rows.forEach((row) => {
      const imageTargets = row.querySelectorAll("img");
      const textTargets = row.querySelectorAll(
        "span[dir='auto'], span[dir='ltr']",
      );
      if (!imageTargets.length && !textTargets.length) return;

      row.classList.add(ROW_CLASS);
      imageTargets.forEach((node) => node.classList.add(BLUR_CLASS));
      textTargets.forEach((node) => node.classList.add(BLUR_CLASS));
    });
  }

  function markOpenChatHeader() {
    const header = document.querySelector("#main header");
    if (!header) return;

    header.classList.add(ROW_CLASS);
    header.querySelectorAll("img").forEach((node) => {
      node.classList.add(BLUR_CLASS);
    });
    header
      .querySelectorAll("span[dir='auto'], span[dir='ltr'], h1, h2")
      .forEach((node) => {
        node.classList.add(BLUR_CLASS);
      });
  }

  function applyPrivacyMode() {
    clearPrivacyClasses();
    if (!enabled) return;
    markChatListRows();
    markOpenChatHeader();
  }

  function ensureToggleButton() {
    if (document.getElementById(TOGGLE_ID)) return;
    const button = document.createElement("button");
    button.id = TOGGLE_ID;
    button.type = "button";
    button.addEventListener("click", () => {
      enabled = !enabled;
      setButtonState();
      applyPrivacyMode();
      storageSet(STORAGE_KEY, enabled);
      showToast(enabled ? "WhatsApp privacy ON" : "WhatsApp privacy OFF");
    });
    document.documentElement.appendChild(button);
    setButtonState();
  }

  function ensureObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      if (!enabled) return;
      applyPrivacyMode();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function bootstrap() {
    ensureStyle();
    ensureToggleButton();
    ensureObserver();
    applyPrivacyMode();
  }

  storageGet(STORAGE_KEY, false).then((value) => {
    enabled = Boolean(value);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
      return;
    }
    bootstrap();
  });
})();
