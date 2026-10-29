/**
 * Line個人智慧AI小幫手 — 互動展示腳本
 * 包含：10 張實機截圖燈箱檢視、多模態篩選、Google Sheets 分頁切換與進場動畫
 */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================================
     1. 10 張功能圖片完整資料庫 (供燈箱放大檢視與左右切換)
     ======================================================================== */
  const GALLERY_ITEMS = [
    {
      src: "./01_每日早安重點.jpg",
      title: "01｜每日早安重點晨報 (01_每日早安重點.jpg)",
      sub: "每日定時觸發 sendDailyMorningBriefing()，自動彙整當日 Google 日曆行程與未完成生活待辦推播至 LINE。"
    },
    {
      src: "./02_備忘記事.jpg",
      title: "02｜隨手文字備忘與秒回機制 (02_備忘記事.jpg)",
      sub: "第一時間透過 Reply API 秒回接收提示，後台經 Gemini 萃取主旨寫入「生活雜事」分頁並由 Push API 回報。"
    },
    {
      src: "./03_AI圖像辨識-名片掃描.jpg",
      title: "03｜AI 圖像辨識：名片掃描建檔 (03_AI圖像辨識-名片掃描.jpg)",
      sub: "拍攝紙本名片自動提取姓名、電話、Email、公司部門與地址，寫入試算表同時同步至 Google 聯絡人。"
    },
    {
      src: "./04_AI圖像辨識-發票記帳_長條式.jpg",
      title: "04｜AI 圖像辨識：傳統長條式收據記帳 (04_AI圖像辨識-發票記帳_長條式.jpg)",
      sub: "自動辨識餐飲長條收據之消費類別、總金額 900 元、店家「哈赤拉麵」與發票號碼 EF90653760。"
    },
    {
      src: "./05_AI圖像辨識-發票記帳_感熱式.jpg",
      title: "05｜AI 圖像辨識：感熱式電子發票記帳 (05_AI圖像辨識-發票記帳_感熱式.jpg)",
      sub: "精準擷取電子發票證明聯賣方名稱「詠碩實業」、金額 2,480 元、字軌號碼 DS-91816111 與交易時間。"
    },
    {
      src: "./06_AI語音辨識-講個笑話.jpg",
      title: "06｜AI 語音辨識：隨手錄音轉錄與機智問答 (06_AI語音辨識-講個笑話.jpg)",
      sub: "支援 LINE 語音訊息 (audio/mp4) 自動聆聽轉錄摘要，可語音記帳排程，亦可進行日常 AI 諮詢互動。"
    },
    {
      src: "./07_GAS_聯絡人.jpg",
      title: "07｜Google 試算表後端：聯絡人分頁 (07_GAS_聯絡人.jpg)",
      sub: "完整保存人脈資訊並內建 +886 國碼單引號防公式錯誤保護，右側標示 Google 聯絡人同步狀態。"
    },
    {
      src: "./08_GAS_收支記帳簿.jpg",
      title: "08｜Google 試算表後端：收支記帳簿分頁 (08_GAS_收支記帳簿.jpg)",
      sub: "結構化彙整文字與發票影像入帳紀錄，包含收支類型、分類、項目名稱、金額與店家發票明細。"
    },
    {
      src: "./09_GAS_行事曆.jpg",
      title: "09｜Google 試算表後端：行事曆分頁 (09_GAS_行事曆.jpg)",
      sub: "自動推算自然語言起訖時間，寫入試算表留存並同步建立 Google Calendar 日程。"
    },
    {
      src: "./10_GAS_生活雜事.jpg",
      title: "10｜Google 試算表後端：生活雜事分頁 (10_GAS_生活雜事.jpg)",
      sub: "集中管理日常備忘事項，支援從 LINE 輸入「已完成 <關鍵字>」即時將狀態更新為已完成。"
    }
  ];

  /* ========================================================================
     2. 導覽列滾動陰影與行動版選單
     ======================================================================== */
  const siteHeader = document.getElementById("siteHeader");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navLinks = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 16) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }
  });

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
      });
    });
  }

  /* ========================================================================
     3. 滾動淡入動畫 (IntersectionObserver)
     ======================================================================== */
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    revealElements.forEach((el) => observer.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add("visible"));
  }

  /* ========================================================================
     4. LINE 多模態功能卡片分類篩選 (01 - 06)
     ======================================================================== */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const featureCards = document.querySelectorAll(".feature-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-filter");

      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      featureCards.forEach((card) => {
        const cat = card.getAttribute("data-category");
        if (target === "all" || cat === target) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });

  /* ========================================================================
     5. Google Sheets 四大分頁互動切換 (07 - 10)
     ======================================================================== */
  const sheetTabBtns = document.querySelectorAll(".sheet-tab-btn");
  const sheetMiniCards = document.querySelectorAll(".sheet-mini-card");
  const sheetPanels = {
    contacts: document.getElementById("panel-contacts"),
    accounting: document.getElementById("panel-accounting"),
    calendar: document.getElementById("panel-calendar"),
    memo: document.getElementById("panel-memo")
  };

  function activateSheetTab(sheetKey) {
    sheetTabBtns.forEach((btn) => {
      const isMatch = btn.getAttribute("data-sheet") === sheetKey;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", isMatch ? "true" : "false");
    });

    sheetMiniCards.forEach((card) => {
      const isMatch = card.getAttribute("data-sheet-target") === sheetKey;
      card.classList.toggle("active", isMatch);
    });

    Object.entries(sheetPanels).forEach(([key, panel]) => {
      if (panel) {
        panel.classList.toggle("active", key === sheetKey);
      }
    });
  }

  sheetTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activateSheetTab(btn.getAttribute("data-sheet"));
    });
  });

  sheetMiniCards.forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.getAttribute("data-sheet-target");
      activateSheetTab(key);
    });
  });

  /* ========================================================================
     6. 全螢幕圖片燈箱 (支援點擊、鍵盤 Esc 與左右方向鍵)
     ======================================================================== */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxSub = document.getElementById("lightboxSub");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = (index + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    const item = GALLERY_ITEMS[currentIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.title;
    lightboxTitle.textContent = item.title;
    lightboxSub.textContent = item.sub;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-lightbox-index]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const idx = parseInt(trigger.getAttribute("data-lightbox-index"), 10);
      openLightbox(idx);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const idx = parseInt(trigger.getAttribute("data-lightbox-index"), 10);
        openLightbox(idx);
      }
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightboxPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(currentIndex - 1);
  });

  lightboxNext.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(currentIndex + 1);
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
  });
});
