(() => {
  const STORAGE_KEY = "tonari-lang";
  const DEFAULT_LOCALE = "pl";
  const SUPPORTED = ["pl", "en"];

  function flattenMessages(obj, prefix = "") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(out, flattenMessages(v, key));
      } else {
        out[key] = String(v);
      }
    }
    return out;
  }

  function resolveLocale() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_) {
      /* ignore */
    }
    const langs = navigator.languages || [navigator.language || ""];
    for (const raw of langs) {
      const base = String(raw).split("-")[0].toLowerCase();
      if (base === "en") return "en";
      if (base === "pl") return "pl";
    }
    return DEFAULT_LOCALE;
  }

  function setMetaDescription(content) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  }

  async function loadMessages(locale) {
    const url = `translations/${locale}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    const data = await res.json();
    return flattenMessages(data);
  }

  function parseI18nAttr(spec) {
    return String(spec)
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const i = pair.indexOf(":");
        if (i <= 0) return null;
        return {
          attr: pair.slice(0, i).trim(),
          key: pair.slice(i + 1).trim(),
        };
      })
      .filter(Boolean);
  }

  function applyMessages(flat, locale) {
    document.documentElement.lang = locale;

    const title = flat["meta.title"];
    if (title) document.title = title;

    const desc = flat["meta.description"];
    if (desc) setMetaDescription(desc);

    const skipI18n = (el) =>
      el.classList.contains("notranslate") ||
      el.getAttribute("translate") === "no" ||
      el.closest(".notranslate, [translate='no']");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (skipI18n(el)) return;
      const key = el.dataset.i18n;
      if (!key || flat[key] == null) return;
      el.textContent = flat[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      if (skipI18n(el)) return;
      const key = el.dataset.i18nHtml;
      if (!key || flat[key] == null) return;
      el.innerHTML = flat[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      if (skipI18n(el)) return;
      const spec = el.dataset.i18nAttr;
      if (!spec) return;
      parseI18nAttr(spec).forEach(({ attr, key }) => {
        if (flat[key] != null) el.setAttribute(attr, flat[key]);
      });
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (key && flat[key] != null) el.setAttribute("placeholder", flat[key]);
    });

    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      const on = btn.dataset.lang === locale;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  async function init() {
    let locale = resolveLocale();
    let flat;
    try {
      flat = await loadMessages(locale);
    } catch (e) {
      console.warn(e);
      locale = DEFAULT_LOCALE;
      flat = await loadMessages(DEFAULT_LOCALE);
    }

    window.__tonariLocale = locale;
    window.__tonariMessages = flat;

    applyMessages(flat, locale);

    document.dispatchEvent(
      new CustomEvent("tonari:locale", {
        detail: { locale, flat },
      }),
    );

    document.querySelectorAll(".lang-switch button[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.lang;
        if (!next || next === window.__tonariLocale || !SUPPORTED.includes(next)) return;
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch (_) {
          /* ignore */
        }
        window.location.reload();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
