/* slack-markdown.js — Better Firefox: Slack Markdown Formatter */

(() => {
  "use strict";

  // ─── Guard: only run on Slack domains ─────────────────────────────
  if (!window.location.hostname.endsWith(".slack.com")) return;

  const PROCESSED_ATTR = "data-bf-md";

  // ─── Syntax highlighting ──────────────────────────────────────────
  // Lightweight keyword-based highlighter for common languages.
  // Detects language from ```lang blocks or falls back to auto-detect.

  const LANGUAGE_KEYWORDS = {
    javascript: {
      keywords:
        "abstract|arguments|async|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|eval|export|extends|final|finally|float|for|from|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|of|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|try|typeof|undefined|var|void|volatile|while|with|yield",
      builtins:
        "Array|Boolean|console|Date|document|Error|fetch|JSON|Map|Math|Number|Object|Promise|Proxy|RegExp|Set|String|Symbol|URL|WeakMap|WeakSet|window|setTimeout|setInterval|clearTimeout|clearInterval|parseInt|parseFloat|isNaN|isFinite|encodeURI|decodeURI|require|module|exports|process",
      booleans: "true|false|null|undefined|NaN|Infinity",
    },
    typescript: {
      keywords:
        "abstract|as|async|await|boolean|break|case|catch|class|const|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|never|new|null|of|package|private|protected|public|readonly|return|set|static|super|switch|this|throw|try|type|typeof|undefined|unique|unknown|var|void|while|with|yield",
      builtins:
        "Array|Boolean|console|Date|document|Error|fetch|JSON|Map|Math|Number|Object|Promise|Partial|Pick|Omit|Record|Required|Readonly|Proxy|RegExp|Set|String|Symbol|URL|WeakMap|WeakSet|window|Exclude|Extract|NonNullable|ReturnType|InstanceType|Parameters",
      booleans: "true|false|null|undefined|NaN|Infinity",
    },
    python: {
      keywords:
        "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield",
      builtins:
        "abs|all|any|bin|bool|bytes|callable|chr|classmethod|compile|complex|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip",
      booleans: "True|False|None",
    },
    rust: {
      keywords:
        "as|async|await|break|const|continue|crate|dyn|else|enum|extern|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|type|unsafe|use|where|while",
      builtins:
        "bool|char|f32|f64|i8|i16|i32|i64|i128|isize|str|u8|u16|u32|u64|u128|usize|Vec|String|Option|Result|Box|Rc|Arc|HashMap|HashSet|BTreeMap|BTreeSet|println|eprintln|format|panic|assert|dbg|todo|unimplemented",
      booleans: "true|false|None|Some|Ok|Err",
    },
    go: {
      keywords:
        "break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var",
      builtins:
        "append|cap|close|complex|copy|delete|imag|len|make|new|panic|print|println|real|recover|bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr",
      booleans: "true|false|nil|iota",
    },
    java: {
      keywords:
        "abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|var|void|volatile|while",
      builtins:
        "System|String|Integer|Boolean|Long|Double|Float|Character|Byte|Short|Object|Class|Thread|Runnable|Exception|RuntimeException|ArrayList|HashMap|HashSet|LinkedList|Collections|Arrays|Math|Optional|Stream|List|Map|Set|Iterator",
      booleans: "true|false|null",
    },
    css: {
      keywords:
        "important|inherit|initial|unset|revert|auto|none|normal|block|inline|flex|grid|absolute|relative|fixed|sticky|static|hidden|visible|solid|dashed|dotted|double|center|left|right|top|bottom|middle|baseline|stretch|nowrap|wrap|row|column|ease|linear|infinite",
      builtins:
        "color|background|border|margin|padding|font|display|position|width|height|max-width|min-width|max-height|min-height|overflow|text-align|align-items|justify-content|flex-direction|gap|opacity|transition|transform|animation|box-shadow|border-radius|z-index|cursor|outline|content|grid-template|visibility|white-space|word-break|line-height|letter-spacing|text-decoration|list-style|float|clear",
      booleans: "",
    },
    html: {
      keywords:
        "doctype|html|head|body|div|span|p|a|img|ul|ol|li|table|tr|td|th|form|input|button|select|option|textarea|h1|h2|h3|h4|h5|h6|header|footer|main|nav|section|article|aside|script|style|link|meta|title|class|id|href|src|alt|type|name|value|placeholder|action|method",
      builtins: "",
      booleans: "true|false",
    },
    json: {
      keywords: "",
      builtins: "",
      booleans: "true|false|null",
    },
    bash: {
      keywords:
        "if|then|else|elif|fi|for|while|do|done|case|esac|in|function|return|exit|break|continue|local|export|readonly|declare|typeset|unset|shift|source|alias|unalias|trap|eval|exec|set",
      builtins:
        "echo|printf|read|cd|pwd|ls|cp|mv|rm|mkdir|rmdir|chmod|chown|cat|grep|sed|awk|find|sort|uniq|head|tail|wc|cut|paste|tr|xargs|tee|diff|tar|gzip|curl|wget|ssh|scp|git|npm|yarn|pip|docker|kubectl",
      booleans: "true|false",
    },
    sql: {
      keywords:
        "SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|VIEW|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|CROSS|ON|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|EXISTS|CASE|WHEN|THEN|ELSE|END|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|CONSTRAINT|AUTO_INCREMENT|CASCADE|TRUNCATE|GRANT|REVOKE|BEGIN|COMMIT|ROLLBACK|TRANSACTION",
      builtins:
        "COUNT|SUM|AVG|MIN|MAX|COALESCE|IFNULL|NULLIF|CAST|CONVERT|CONCAT|LENGTH|SUBSTRING|TRIM|UPPER|LOWER|REPLACE|NOW|CURDATE|CURTIME|DATE_FORMAT|DATEDIFF|ROUND|CEIL|FLOOR|ABS|MOD|POWER|SQRT",
      booleans: "TRUE|FALSE|NULL",
    },
  };

  // Aliases for language detection
  const LANG_ALIASES = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    rs: "rust",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    yml: "bash",
    yaml: "bash",
    md: "bash",
    sql: "sql",
    mysql: "sql",
    postgresql: "sql",
    postgres: "sql",
    htm: "html",
    xml: "html",
    svg: "html",
  };

  /**
   * Auto-detect language from code content heuristics.
   */
  function detectLanguage(code) {
    const trimmed = code.trim();
    if (/^\s*(import|export|const|let|var|function|=>|async\s)/.test(trimmed))
      return "javascript";
    if (/^\s*(def |class |import |from |print\(|if __name__)/.test(trimmed))
      return "python";
    if (
      /^\s*(fn |let\s+mut|impl |use\s|pub\s|struct\s|enum\s|mod\s)/.test(
        trimmed,
      )
    )
      return "rust";
    if (/^\s*(func |package |import\s*\(|go\s|defer\s|chan\s)/.test(trimmed))
      return "go";
    if (
      /^\s*(public\s+class|private\s|protected\s|@Override|System\.)/.test(
        trimmed,
      )
    )
      return "java";
    if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(trimmed))
      return "sql";
    if (/^\s*(\$|#!\/|echo |export |source |alias )/.test(trimmed))
      return "bash";
    if (/^\s*(<\!DOCTYPE|<html|<div|<span|<head|<body)/i.test(trimmed))
      return "html";
    if (/^\s*\{[\s\n]*"/.test(trimmed)) return "json";
    if (/[{};]/.test(trimmed) && /:\s*[^;]+;/.test(trimmed)) return "css";
    return "javascript"; // default fallback
  }

  /**
   * Apply syntax highlighting to a code string.
   * Returns HTML with <span class="bf-hl-*"> wrappers.
   */
  function highlightCode(code, lang) {
    const resolvedLang = LANG_ALIASES[lang] || lang || detectLanguage(code);
    const defs = LANGUAGE_KEYWORDS[resolvedLang];

    let html = escapeHtml(code);

    // JSON: just highlight strings, numbers, booleans, and structural chars
    if (resolvedLang === "json") {
      // Strings (keys and values)
      html = html.replace(
        /(&quot;|")((?:[^"\\]|\\.)*)(&quot;|")/g,
        '<span class="bf-hl-string">$1$2$3</span>',
      );
      // Numbers
      html = html.replace(
        /\b(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g,
        '<span class="bf-hl-number">$1</span>',
      );
      // Booleans & null
      html = html.replace(
        /\b(true|false|null)\b/g,
        '<span class="bf-hl-boolean">$1</span>',
      );
      return html;
    }

    if (!defs) return html;

    // ─── Masking helper ─────────────────────────────────────────────
    const tokens = [];
    const mask = (str) => {
      tokens.push(str);
      return `__BF_HL_${tokens.length - 1}__`;
    };

    // 1. Strings (double-quoted)
    html = html.replace(/"(?:[^"\\]|\\.)*"/g, (m) =>
      mask(`<span class="bf-hl-string">${m}</span>`),
    );

    // 2. Strings (single-quoted)
    html = html.replace(/'(?:[^'\\]|\\.)*'/g, (m) =>
      mask(`<span class="bf-hl-string">${m}</span>`),
    );

    // Template literals (backtick strings) — for JS/TS
    if (["javascript", "typescript"].includes(resolvedLang)) {
      html = html.replace(/`(?:[^`\\]|\\.)*`/g, (m) =>
        mask(`<span class="bf-hl-string">${m}</span>`),
      );
    }

    // Python triple-quoted strings
    if (resolvedLang === "python") {
      html = html.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, (m) =>
        mask(`<span class="bf-hl-string">${m}</span>`),
      );
    }

    // 3. Multi-line comments: /* ... */
    html = html.replace(/\/\*[\s\S]*?\*\//g, (m) =>
      mask(`<span class="bf-hl-comment">${m}</span>`),
    );

    // 4. Single-line comments: // ... or # ...
    if (["python", "bash", "ruby", "yaml"].includes(resolvedLang)) {
      // Matches # comment (handling indentation)
      html = html.replace(
        /(^|\s)(#.*)$/gm,
        (m, prefix, comment) =>
          `${prefix}${mask(`<span class="bf-hl-comment">${comment}</span>`)}`,
      );
    }
    // JS/C-style // comments
    html = html.replace(
      /(^|[^\:])(\/\/.*)$/gm,
      (m, prefix, comment) =>
        `${prefix}${mask(`<span class="bf-hl-comment">${comment}</span>`)}`,
    );

    // SQL single-line comments: -- ...
    if (resolvedLang === "sql") {
      html = html.replace(/(--.*)$/gm, (m) =>
        mask(`<span class="bf-hl-comment">${m}</span>`),
      );
    }

    // Numbers
    html = html.replace(
      /\b(0[xXoObB][\da-fA-F_]+|\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g,
      (m) => mask(`<span class="bf-hl-number">${m}</span>`),
    );

    // Booleans / null / nil / None
    if (defs.booleans) {
      const boolRe = new RegExp(`\\b(${defs.booleans})\\b`, "g");
      html = html.replace(boolRe, (m) =>
        mask(`<span class="bf-hl-boolean">${m}</span>`),
      );
    }

    // Keywords
    if (defs.keywords) {
      const kwRe = new RegExp(
        `\\b(${defs.keywords})\\b`,
        resolvedLang === "sql" ? "gi" : "g",
      );
      html = html.replace(kwRe, (m) =>
        mask(`<span class="bf-hl-keyword">${m}</span>`),
      );
    }

    // Built-in types / functions
    if (defs.builtins) {
      const builtinRe = new RegExp(`\\b(${defs.builtins})\\b`, "g");
      html = html.replace(builtinRe, (m) =>
        mask(`<span class="bf-hl-builtin">${m}</span>`),
      );
    }

    // Decorators
    html = html.replace(/@\w+/g, (m) =>
      mask(`<span class="bf-hl-decorator">${m}</span>`),
    );

    // Restore masks (iterate until no masks left, in case of nesting - though nesting not supported here)
    // Simple reverse loop is enough for flat masking
    html = html.replace(/__BF_HL_(\d+)__/g, (_m, i) => tokens[Number(i)]);

    return html;
  }

  // ─── Lightweight mrkdwn → HTML converter ──────────────────────────
  // Handles Slack's "mrkdwn" flavour:
  //   *bold*  _italic_  ~strikethrough~  `inline code`
  //   ```code block```   > blockquote   <url|label>
  //   - [ ] unchecked    - [x] checked

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function unescapeHtml(str) {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }

  /**
   * Convert a single line of Slack mrkdwn to inline HTML.
   * Operates ONLY on text nodes that look unformatted.
   */
  function mrkdwnToHtml(text) {
    let html = escapeHtml(text);
    // Temp storage for code blocks to protect them during inline formatting processing
    const codeBlocks = [];

    // Code blocks: ```lang\n…```
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
      // Unescape the code content so we can highlight raw source
      const rawCode = unescapeHtml(code).trim();
      const highlighted = highlightCode(rawCode, lang.toLowerCase());
      const langLabel = lang
        ? `<span class="bf-md-lang-label">${escapeHtml(lang)}</span>`
        : "";
      const blockHtml = `<pre class="bf-md-pre">${langLabel}<code class="bf-md-code-block">${highlighted}</code></pre>`;
      codeBlocks.push(blockHtml);
      return `__BF_CODE_${codeBlocks.length - 1}__`;
    });

    // Inline code: `…`
    html = html.replace(/`([^`\n]+)`/g, (_m, code) => {
      // Inline code is also protected
      codeBlocks.push(`<code class="bf-md-code">${code}</code>`);
      return `__BF_CODE_${codeBlocks.length - 1}__`;
    });

    // Checkboxes: - [ ] unchecked  /  - [x] checked  /  - [X] checked / -[ ] / -[x] / -[X]
    html = html.replace(
      /^(\s*)-\s?\[ \]\s?(.*)$/gm,
      '$1<label class="bf-md-checkbox"><input type="checkbox" disabled /><span class="bf-md-cb-box"></span><span class="bf-md-cb-label">$2</span></label>',
    );
    html = html.replace(
      /^(\s*)-\s?\[[xX]\]\s?(.*)$/gm,
      '$1<label class="bf-md-checkbox"><input type="checkbox" checked disabled /><span class="bf-md-cb-box bf-md-cb-checked"></span><span class="bf-md-cb-label bf-md-cb-done">$2</span></label>',
    );

    // Bold: *…*
    html = html.replace(
      /(?<![a-zA-Z0-9\\])\*([^*\n]+)\*(?![a-zA-Z0-9])/g,
      `<strong class="bf-md-bold">$1</strong>`,
    );

    // Italic: _…_
    html = html.replace(
      /(?<![a-zA-Z0-9\\])_([^_\n]+)_(?![a-zA-Z0-9])/g,
      `<em class="bf-md-italic">$1</em>`,
    );

    // Strikethrough: ~…~
    html = html.replace(
      /(?<![a-zA-Z0-9\\])~([^~\n]+)~(?![a-zA-Z0-9])/g,
      `<del class="bf-md-strike">$1</del>`,
    );

    // Slack links: <url|label> or <url>
    html = html.replace(
      /&lt;(https?:\/\/[^|&]+)\|([^&]+)&gt;/g,
      `<a class="bf-md-link" href="$1" target="_blank" rel="noopener">$2</a>`,
    );
    html = html.replace(
      /&lt;(https?:\/\/[^&]+)&gt;/g,
      `<a class="bf-md-link" href="$1" target="_blank" rel="noopener">$1</a>`,
    );

    // Blockquote lines: > text
    html = html.replace(
      /^&gt;\s?(.+)$/gm,
      `<blockquote class="bf-md-quote">$1</blockquote>`,
    );

    // ── Preserve newlines: convert \n → <br> ──
    // Since code blocks are currently masked as __BF_CODE_N__, their internal newlines are safe.
    // html = html.replace(/\n/g, "<br>");

    // ── Restore code blocks ──
    html = html.replace(/__BF_CODE_(\d+)__/g, (_m, i) => codeBlocks[Number(i)]);

    return html;
  }

  /**
   * Check whether a string contains any mrkdwn tokens worth converting.
   */
  function hasMrkdwn(text) {
    return /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|`[^`\n]+`|```[\s\S]+?```|^>\s|<https?:\/\/|-\s?\[[ xX]\])/.test(
      text,
    );
  }

  // ─── Inject styles once ───────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("bf-md-styles")) return;
    const style = document.createElement("style");
    style.id = "bf-md-styles";
    style.textContent = `
      /* Better Firefox — Slack Markdown Styles */

      .bf-md-bold {
        font-weight: 700;
      }

      .bf-md-italic {
        font-style: italic;
      }

      .bf-md-strike {
        text-decoration: line-through;
        opacity: 0.72;
      }

      .bf-md-code {
        font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
        font-size: 0.85em;
        background: rgba(var(--sk_primary_foreground, 29, 28, 29), 0.04);
        border: 1px solid rgba(var(--sk_primary_foreground, 29, 28, 29), 0.13);
        border-radius: 3px;
        padding: 1px 4px;
        color: #e01e5a;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .bf-md-pre {
        font-family: "SF Mono", "Monaco", "Menlo", "Consolas", monospace;
        font-size: 0.85em;
        background: #1e1e2e;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 0;
        margin: 6px 0;
        overflow-x: auto;
        position: relative;
        color: #cdd6f4;
      }

      .bf-md-code-block {
        display: block;
        padding: 14px 16px;
        white-space: pre !important;
        word-break: normal;
        overflow-x: auto;
        background: none;
        border: none;
        color: inherit;
        font-size: inherit;
        font-family: inherit;
        line-height: 1.5;
        tab-size: 2;
      }

      .bf-md-lang-label {
        display: inline-block;
        position: absolute;
        top: 0;
        right: 0;
        font-size: 0.7em;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 3px 10px;
        color: #7f849c;
        background: rgba(255, 255, 255, 0.04);
        border-bottom-left-radius: 6px;
        border-top-right-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        user-select: none;
      }

      .bf-md-pre code {
        background: none;
        border: none;
        padding: 0;
        color: inherit;
        font-size: inherit;
      }

      /* ─── Syntax highlighting tokens (Catppuccin Mocha inspired) ─── */

      .bf-hl-keyword {
        color: #cba6f7;
        font-weight: 600;
      }

      .bf-hl-builtin {
        color: #f9e2af;
      }

      .bf-hl-string {
        color: #a6e3a1;
      }

      .bf-hl-number {
        color: #fab387;
      }

      .bf-hl-boolean {
        color: #fab387;
        font-weight: 600;
      }

      .bf-hl-comment {
        color: #7a7e85;
        font-style: italic;
        font-family: "Fira Code iScript", "Fira Code", "Cascadia Code", "Operator Mono", monospace;
      }

      .bf-hl-decorator {
        color: #f2cdcd;
      }

      /* ─── Checkbox styles ─────────────────────────────────────────── */

      .bf-md-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 3px 0;
        cursor: default;
        line-height: 1.5;
      }

      .bf-md-checkbox input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .bf-md-cb-box {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        min-width: 18px;
        border: 2px solid rgba(var(--sk_primary_foreground, 29, 28, 29), 0.35);
        border-radius: 4px;
        background: transparent;
        transition: all 0.15s ease;
      }

      .bf-md-cb-box.bf-md-cb-checked {
        background: #1264a3;
        border-color: #1264a3;
      }

      .bf-md-cb-box.bf-md-cb-checked::after {
        content: "";
        display: block;
        width: 5px;
        height: 9px;
        border: solid #fff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        margin-bottom: 2px;
      }

      .bf-md-cb-label {
        flex: 1;
      }

      .bf-md-cb-done {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .bf-md-quote {
        border-left: 4px solid rgba(var(--sk_primary_foreground, 29, 28, 29), 0.2);
        padding: 2px 0 2px 12px;
        margin: 4px 0;
        color: inherit;
        opacity: 0.85;
      }

      .bf-md-link {
        color: #1264a3;
        text-decoration: none;
      }
      .bf-md-link:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Formatting logic ─────────────────────────────────────────────
  /**
   * Selectors for message text containers in the Slack web app.
   * These cover the main rich_text_section blocks, plain text bodies,
   * and notification / thread preview snippets.
   */
  const MESSAGE_SELECTORS = [
    ".p-rich_text_section",
    ".c-message__body",
    ".p-rich_text_block",
    ".c-message_kit__text",
    '[data-qa="message-text"]',
  ].join(", ");

  function unescapeHtmlEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  }

  /**
   * Walk through candidate message elements and apply mrkdwn formatting
   * to any that haven't been processed yet and contain raw mrkdwn tokens.
   */
  function formatMessages(root = document) {
    const elements = root.querySelectorAll(MESSAGE_SELECTORS);
    for (const el of elements) {
      if (el.hasAttribute(PROCESSED_ATTR)) continue;

      // Capture original HTML to preserve structure (newlines, spaces)
      let htmlContent = el.innerHTML;

      // Extract "edited" label (and any trailing tooltip spans) to preserve them
      // usually looks like <span class="c-message__edited_label" ...>(edited)</span>...
      let trailingHtml = "";
      const editedMatch = htmlContent.match(
        /(<span\s+class="c-message__edited_label"[\s\S]*)$/i,
      );
      if (editedMatch) {
        trailingHtml = editedMatch[1];
        htmlContent = htmlContent.substring(0, editedMatch.index);
      }

      // Convert Slack's HTML structure back to source text
      // 1. <br> → \n
      htmlContent = htmlContent.replace(/<br\b[^>]*>/gi, "\n");
      // 2. &nbsp; → space
      htmlContent = htmlContent.replace(/&nbsp;/g, " ");

      // 3. Strip remaining tags (like <i data-stringify-type="italic">...</i>)
      //    We only want the text content of these tags
      const rawText = unescapeHtmlEntities(htmlContent.replace(/<[^>]+>/g, ""));

      // Only process elements that look like they have markdown
      if (!hasMrkdwn(rawText)) {
        el.setAttribute(PROCESSED_ATTR, "skip");
        continue;
      }

      // Avoid touching elements that seem to already have our rich formatting
      // (checking the cleaned rawText against our class names is hard,
      // so we rely on the PROCESSED_ATTR check above mostly)

      // Convert mrkdwn → HTML
      const converted = mrkdwnToHtml(rawText);
      if (converted !== escapeHtml(rawText)) {
        el.innerHTML = converted + trailingHtml;
        el.setAttribute(PROCESSED_ATTR, "done");
      } else {
        el.setAttribute(PROCESSED_ATTR, "skip");
      }
    }
  }

  // ─── MutationObserver — watch for new messages ────────────────────
  let debounceTimer = null;

  function onMutations() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      formatMessages();
    }, 200);
  }

  function startObserver() {
    const observer = new MutationObserver(onMutations);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    // Run once immediately for any content already in the DOM
    formatMessages();
  }

  // ─── Boot ─────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    if (document.body) {
      startObserver();
    } else {
      document.addEventListener("DOMContentLoaded", startObserver);
    }
  }

  // handle pages that load the body lazily (SPA navigation)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  console.log("[Better Firefox] Slack Markdown Formatter loaded ✅");
})();
