/**
 * 樂風歐式麵包 (Le Feng Artisan Bakery)
 * 產品展示與互動邏輯 products.js
 */

const BREAD_PRODUCTS = [
  {
    id: 'croissant-classic',
    category: 'croissant',
    title: '巴黎金黃蜂巢可頌',
    subTitle: 'Classic French Butter Croissant',
    price: 85,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    tags: ['人氣爆棚', '法國AOP奶油'],
    crunchLevel: '🔥🔥🔥🔥🔥 5/5',
    specs: { fermentation: '36小時冷藏慢酵', flour: '法國T55經典粉', allergens: '奶類、含麩質穀物' },
    desc: '堅持16層手工折疊極致工法，外皮薄脆輕盈在唇齒間如落葉般碎裂，內裡呈現完美蜂巢氣孔，濃醇榛果發酵奶油香氣直衝腦門！',
    servingTip: '以烤箱180度預熱回烤2-3分鐘，靜置1分鐘待表皮收縮脆化，搭配黑咖啡是靈魂的救贖。'
  },
  {
    id: 'sourdough-ancient',
    category: 'sourdough',
    title: '古老野生魯邦種鄉村大歐包',
    subTitle: 'Ancient Levain Country Sourdough',
    price: 180,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80',
    tags: ['鎮店之寶', '無油無糖'],
    crunchLevel: '🔥🔥🔥🔥 4/5',
    specs: { fermentation: '48小時低溫雙重發酵', flour: '法國石磨T65+全麥', allergens: '含麩質穀物' },
    desc: '嚴選百年活體魯邦野生酵母，高達82%含水量！厚實焦香脆殼下，包裹著如軟豆腐般潤澤的大氣孔組織，回甘帶有溫和優雅的天然乳酸酸香。',
    servingTip: '切厚片微烤至邊緣微焦，抹上極致奶油、浸泡橄欖油海鹽或搭配燉肉濃湯，風味絕頂！'
  },
  {
    id: 'multigrain-power',
    category: 'multigrain',
    title: '阿爾卑斯能量多穀物黑麥包',
    subTitle: 'Alps Alpine Multigrain Rye Bread',
    price: 160,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
    tags: ['高纖能量', '純素友善'],
    crunchLevel: '🔥🔥🔥 3/5',
    specs: { fermentation: '24小時冷藏種', flour: '德國有機全裸麥+7種種子', allergens: '堅果、含麩質穀物' },
    desc: '滿載向日葵籽、黃金亞麻仁、南瓜子、黑芝麻與厚燕麥片！每一口都是大地麥香與烘烤堅果油脂的狂暴噴發，低升糖、高膳食纖維的活力來源。',
    servingTip: '切薄片搭配熟成乾酪、煙燻鮭魚或牛油果，即是北歐風極致高能量早午餐。'
  },
  {
    id: 'croissant-chocolate',
    category: 'croissant',
    title: '法芙娜雙重黑巧可頌',
    subTitle: 'Valrhona Double Chocolate Croissant',
    price: 95,
    image: 'https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=800&q=80',
    tags: ['主廚特選', '法芙娜70%可可'],
    crunchLevel: '🔥🔥🔥🔥 4/5',
    specs: { fermentation: '36小時工法', flour: '法國T55粉+可可麵糰', allergens: '奶類、大豆、含麩質穀物' },
    desc: '包裹兩根法國原裝 Valrhona 70% 苦甜黑巧克力棒，烘烤後融化成微稠流心，與金黃酥皮在口中達成苦甘奢華的完美交響。',
    servingTip: '微烤90秒讓黑巧克力微微溫熱融潤，香濃誘人！'
  },
  {
    id: 'classic-baguette',
    category: 'classic',
    title: '正統巴黎傳統T65石板長棍',
    subTitle: 'Authentic Traditional Baguette Tradition',
    price: 80,
    image: 'https://images.unsplash.com/photo-1534620808146-d33bb39128b2?auto=format&fit=crop&w=800&q=80',
    tags: ['歐陸經典', '石板噴蒸烘烤'],
    crunchLevel: '🔥🔥🔥🔥🔥 5/5',
    specs: { fermentation: '28小時液種老麵', flour: '法國紅標Label Rouge T65', allergens: '含麩質穀物' },
    desc: '僅用麵粉、水、老麵與海鹽四種純粹元素！400度石板高溫蒸氣爆烤，割紋俐落爆裂，金褐外皮如玻璃般酥脆，麥香濃醇回甘無窮。',
    servingTip: '雙手掰開聽那聲清脆喀擦！抹上海鹽發酵奶油或做成法式火腿乾酪三明治（Jambon-Beurre）。'
  },
  {
    id: 'sourdough-fig-walnut',
    category: 'sourdough',
    title: '地中海野生無花果核桃酸種',
    subTitle: 'Wild Fig & Roasted Walnut Sourdough',
    price: 150,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
    tags: ['果香芬芳', '低糖少油'],
    crunchLevel: '🔥🔥🔥🔥 4/5',
    specs: { fermentation: '36小時冷藏發酵', flour: '石磨裸麥+小麥粉', allergens: '堅果、含麩質穀物' },
    desc: '浸漬在天然麥汁中的整顆無花果乾，伴隨低溫烘烤至香脆的加州厚核桃，微酸麥香與蜜糖般的無花果籽在舌尖彈跳！',
    servingTip: '搭配藍紋乳酪或卡門貝爾乳酪，再佐以一杯黑皮諾紅酒，無懈可擊。'
  },
  {
    id: 'classic-focaccia',
    category: 'classic',
    title: '義大利特級初榨橄欖油迷迭香佛卡夏',
    subTitle: 'Rosemary & Sea Salt Olive Oil Focaccia',
    price: 110,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    tags: ['義式經典', '初榨橄欖油'],
    crunchLevel: '🔥🔥🔥 3/5',
    specs: { fermentation: '24小時高含水工藝', flour: '杜蘭小麥粉+T55', allergens: '含麩質穀物' },
    desc: '淋滿冷壓特級初榨橄欖油，手指壓出深凹坑穴填入新鮮有機迷迭香與地中海片鹽，底部酥脆、內層如雲朵般蓬鬆多汁！',
    servingTip: '常溫或平底鍋乾煎2分鐘，沾取油醋醬品嚐最道地的南歐滋味。'
  },
  {
    id: 'croissant-almond',
    category: 'croissant',
    title: '普羅旺斯酥烤杏仁碎可頌',
    subTitle: 'Provence Double-Baked Almond Croissant',
    price: 95,
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=800&q=80',
    tags: ['二度烘烤', '法式杏仁奶油'],
    crunchLevel: '🔥🔥🔥🔥 4/5',
    specs: { fermentation: '二度入爐炙烤', flour: '法國T55粉+西西里杏仁粉', allergens: '堅果、奶類、蛋、含麩質' },
    desc: '浸泡橙花糖水後塗滿手打西西里杏仁奶油霜，二次高溫烘烤，頂層鋪滿金黃薄脆杏仁片與細緻糖霜，層次繁複華麗。',
    servingTip: '濃郁甜美，搭配英式伯爵茶或拿鐵最對味！'
  }
];

function renderProductGrid(filter = 'all') {
  const container = document.getElementById('productsGridContainer');
  if (!container) return;

  const filtered = filter === 'all' 
    ? BREAD_PRODUCTS 
    : BREAD_PRODUCTS.filter(p => p.category === filter);

  let html = '';
  filtered.forEach(p => {
    html += `
      <article class="product-item" data-category="${p.category}">
        <div class="product-thumb" onclick="openProductModal('${p.id}')">
          <img src="${p.image}" alt="${p.title}" loading="lazy">
          <div class="product-badges">
            ${p.tags.map(t => `<span class="badge badge-fire">${t}</span>`).join('')}
          </div>
        </div>
        <div class="product-body">
          <div class="product-tags">${p.subTitle}</div>
          <h3 class="product-title" style="cursor:pointer;" onclick="openProductModal('${p.id}')">${p.title}</h3>
          <p class="product-desc">${p.desc}</p>
          
          <div class="product-meta-specs">
            <div class="spec-item"><strong>⏳ 發酵:</strong> ${p.specs.fermentation}</div>
            <div class="spec-item"><strong>🌾 麵粉:</strong> ${p.specs.flour}</div>
          </div>

          <div class="crunch-meter" style="margin-bottom: 12px; padding: 6px 10px;">
            <span>脆度指數:</span>
            <span class="crunch-flames">${p.crunchLevel}</span>
          </div>

          <div class="product-footer">
            <div class="product-price"><small>NT$</small> ${p.price}</div>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-outline-dark btn-sm" onclick="openProductModal('${p.id}')">
                詳情
              </button>
              <button type="button" class="btn btn-fire btn-sm" onclick="LeFengStore.addItem({id:'${p.id}', title:'${p.title}', price:${p.price}, image:'${p.image}'})">
                + 預購
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  });

  container.innerHTML = html;
}

// 產品詳情 Modal
function openProductModal(id) {
  const product = BREAD_PRODUCTS.find(p => p.id === id);
  if (!product) return;

  const backdrop = document.getElementById('productDetailModal');
  const body = document.getElementById('productModalBody');
  if (!backdrop || !body) return;

  body.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1.1fr; gap: 24px;">
      <div style="border-radius: var(--radius-md); overflow: hidden; height: 360px;">
        <img src="${product.image}" alt="${product.title}" style="width:100%; height:100%; object-fit:cover;">
      </div>
      <div>
        <div class="badge badge-yellow" style="margin-bottom: 8px;">${product.subTitle}</div>
        <h2 style="font-size: 26px; color: var(--c-blue); margin-bottom: 8px;">${product.title}</h2>
        <div class="product-price" style="margin-bottom: 14px;"><small>NT$</small> ${product.price}</div>
        
        <p style="font-size: 14px; color: var(--c-text-secondary); margin-bottom: 16px; line-height: 1.7;">
          ${product.desc}
        </p>

        <div style="background: var(--c-parchment); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 13px;">
          <div style="margin-bottom: 6px;"><strong>🔥 酥脆破壞力：</strong> ${product.crunchLevel}</div>
          <div style="margin-bottom: 6px;"><strong>⏳ 發酵堅持：</strong> ${product.specs.fermentation}</div>
          <div style="margin-bottom: 6px;"><strong>🌾 小麥基底：</strong> ${product.specs.flour}</div>
          <div><strong>⚠️ 過敏原標記：</strong> ${product.specs.allergens}</div>
        </div>

        <div style="background: rgba(229, 169, 60, 0.15); border-left: 3px solid var(--c-yellow); padding: 10px 14px; font-size: 13px; margin-bottom: 20px;">
          <strong>💡 職人品嚐建議：</strong> ${product.servingTip}
        </div>

        <button type="button" class="btn btn-fire" style="width: 100%;" onclick="LeFengStore.addItem({id:'${product.id}', title:'${product.title}', price:${product.price}, image:'${product.image}'}); closeProductModal();">
          🔥 立刻加入出爐預購提袋 (NT$ ${product.price})
        </button>
      </div>
    </div>
  `;

  backdrop.classList.add('active');
}

function closeProductModal() {
  const backdrop = document.getElementById('productDetailModal');
  if (backdrop) backdrop.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // 產品過濾按鈕事件
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter') || 'all';
      renderProductGrid(category);
    });
  });

  // 初始渲染全部商品
  renderProductGrid('all');

  // 詳情彈窗點擊關閉事件
  const modalBackdrop = document.getElementById('productDetailModal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeProductModal();
    });
  }

  const modalCloseBtn = document.getElementById('productModalClose');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProductModal);
  }
});
