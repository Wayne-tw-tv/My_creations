/**
 * 樂風歐式麵包 (Le Feng Artisan Bakery)
 * 全站核心動態腳本 main.js
 */

// 購物預約提袋狀態 (保存在 localStorage，跨頁面保持同步)
const LeFengStore = {
  cart: [],

  init() {
    try {
      const saved = localStorage.getItem('lefeng_cart');
      if (saved) {
        this.cart = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Unable to read cart from localStorage', e);
    }
    this.updateUI();
    this.bindEvents();
  },

  save() {
    try {
      localStorage.setItem('lefeng_cart', JSON.stringify(this.cart));
    } catch (e) {
      console.warn('Unable to save cart to localStorage', e);
    }
    this.updateUI();
  },

  addItem(item) {
    const existing = this.cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        qty: 1
      });
    }
    this.save();
    showToast(`🔥「${item.title}」已加入今日出爐預約提袋！`);
    this.openDrawer();
  },

  removeItem(id) {
    this.cart = this.cart.filter(i => i.id !== id);
    this.save();
  },

  changeQty(id, delta) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      this.removeItem(id);
    } else {
      this.save();
    }
  },

  clear() {
    this.cart = [];
    this.save();
  },

  getTotalCount() {
    return this.cart.reduce((sum, i) => sum + i.qty, 0);
  },

  getTotalPrice() {
    return this.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  updateUI() {
    // 更新所有頁面導覽列提袋數字標籤
    const badgeEls = document.querySelectorAll('.cart-badge');
    const count = this.getTotalCount();
    badgeEls.forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-block' : 'none';
    });

    // 渲染抽屜內商品列表
    const itemsContainer = document.getElementById('cartDrawerItems');
    const totalEl = document.getElementById('cartDrawerTotal');
    if (!itemsContainer) return;

    if (this.cart.length === 0) {
      itemsContainer.innerHTML = `
        <div class="cart-empty-state">
          <div class="icon">🥖</div>
          <p>預約提袋目前空空如也！</p>
          <p style="font-size: 13px; margin-top: 6px;">快去探索剛出爐的香脆歐式麵包吧！</p>
        </div>
      `;
      if (totalEl) totalEl.textContent = 'NT$ 0';
      return;
    }

    let html = '';
    this.cart.forEach(item => {
      html += `
        <div class="cart-item-row" data-id="${item.id}">
          <img class="cart-item-img" src="${item.image}" alt="${item.title}">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">NT$ ${item.price}</div>
          </div>
          <div class="cart-qty-control">
            <button type="button" class="cart-qty-btn btn-minus" onclick="LeFengStore.changeQty('${item.id}', -1)">-</button>
            <span style="font-weight:700; font-size:14px; min-width:18px; text-align:center;">${item.qty}</span>
            <button type="button" class="cart-qty-btn btn-plus" onclick="LeFengStore.changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `;
    });

    itemsContainer.innerHTML = html;
    if (totalEl) {
      totalEl.textContent = `NT$ ${this.getTotalPrice()}`;
    }
  },

  openDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.add('active');
  },

  closeDrawer() {
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) overlay.classList.remove('active');
  },

  bindEvents() {
    // 預約抽屜開關
    const triggerBtns = document.querySelectorAll('.cart-trigger-btn');
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', () => this.openDrawer());
    });

    const closeBtn = document.getElementById('cartDrawerClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }

    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeDrawer();
      });
    }

    // 抽屜內結帳預約模擬按鈕
    const checkoutBtn = document.getElementById('cartDrawerCheckout');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (this.cart.length === 0) {
          showToast('⚠️ 提袋目前為空，請先選購美味歐包！');
          return;
        }
        const orderNo = 'LF-' + Math.floor(100000 + Math.random() * 900000);
        alert(`🎉 熱血預約成功！\n預約單號：【${orderNo}】\n預約總額：NT$ ${this.getTotalPrice()}\n\n今日剛出爐時將為您熱騰騰保留，憑單號至台北概念店結帳取貨即可！`);
        this.clear();
        this.closeDrawer();
      });
    }
  }
};

// 全域提示 Toast
function showToast(msg) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// 頁面初始化監聽
document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化購物預約提袋
  LeFengStore.init();

  // 2. 導覽列捲動變色特效
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  // 3. 行動裝置漢堡選單切換
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      toggleBtn.textContent = navMenu.classList.contains('open') ? '✕' : '☰';
    });

    // 點擊選單內部連結時自動收闔
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        toggleBtn.textContent = '☰';
      });
    });
  }

  // 4. 監聽全域預約或特定出爐保留按鈕
  document.querySelectorAll('[data-reserve-item]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const price = parseInt(btn.getAttribute('data-price'), 10) || 85;
      const image = btn.getAttribute('data-image');
      LeFengStore.addItem({ id, title, price, image });
    });
  });
});
