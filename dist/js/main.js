(function () {
  const config = window.BEN_SWEET || {};
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const form = document.querySelector("#inquiry-form");
  const topicSelect = document.querySelector("#inquiry-topic");
  const formStatus = document.querySelector("#form-status");

  document.querySelectorAll("[data-config]").forEach((el) => {
    const key = el.getAttribute("data-config");
    const value = config[key];
    if (!value) return;

    if (el.tagName === "A") {
      el.href = key === "email" ? `mailto:${value}` : value;
      if (key === "lineUrl" || key === "instagram" || key === "facebook") {
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
      if (el.hasAttribute("data-config-text")) {
        el.textContent = config[el.getAttribute("data-config-text")] || value;
      }
    } else {
      el.textContent = value;
    }
  });

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", Boolean(open));
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });

  document.querySelectorAll("[data-topic]").forEach((el) => {
    el.addEventListener("click", () => {
      const topic = el.getAttribute("data-topic");
      if (topicSelect && topic) topicSelect.value = topic;
    });
  });

  const params = new URLSearchParams(window.location.search);
  const presetTopic = params.get("topic");
  if (presetTopic && topicSelect) {
    const match = Array.from(topicSelect.options).find((o) => o.value === presetTopic);
    if (match) topicSelect.value = presetTopic;
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const topic = String(data.get("topic") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !phone || !topic) {
      setStatus("請填寫姓名、聯絡電話與諮詢項目。", "error");
      return;
    }

    const subject = `本甜咖啡洽詢｜${topic}`;
    const body = [
      `姓名：${name}`,
      `聯絡電話：${phone}`,
      `諮詢項目：${topic}`,
      "",
      "備註訊息：",
      message || "（無）",
    ].join("\n");

    const mailto = `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await navigator.clipboard.writeText(
        `收件人：${config.email}\n主旨：${subject}\n\n${body}`
      );
    } catch {
      /* clipboard may be blocked */
    }

    window.location.href = mailto;
    setStatus(
      "已嘗試開啟郵件應用程式。若未開啟，內容已複製，請自行貼上寄出。",
      "ok"
    );
  });

  function setStatus(text, type) {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.dataset.type = type;
    formStatus.hidden = false;
  }
})();
