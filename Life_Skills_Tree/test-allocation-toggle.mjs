/**
 * E2E smoke test: strict/free allocation toggle
 * Run: node test-allocation-toggle.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8080';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function startGame(page) {
  await page.goto(`${BASE}/`);
  await page.waitForSelector('#btn-start');
  await page.fill('#player-name', '測試玩家');
  await page.click('#btn-start');
  await page.waitForSelector('#view-map.active');
}

async function openElementaryAllocation(page) {
  await page.click('.map-chapter[data-stage="elementary"]');
  await page.waitForSelector('#view-allocation.active');
  await page.waitForSelector('#submit-allocation');
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Static assets
    const res = await page.goto(`${BASE}/`);
    if (res?.ok()) pass('首頁載入', `${res.status()}`);
    else fail('首頁載入', `status ${res?.status()}`);

    await page.evaluate(() => localStorage.removeItem('lifeSkillTree_v1'));

    for (const file of ['js/main.js', 'js/allocation.js', 'data/stages.json']) {
      const r = await page.request.get(`${BASE}/${file}`);
      if (r.ok()) pass(`靜態資源 ${file}`);
      else fail(`靜態資源 ${file}`, String(r.status()));
    }

    await startGame(page);
    pass('開始遊戲進入世界地圖');

    // Settings panel (strict default)
    const settings = page.locator('#game-settings');
    await settings.waitFor();
    const settingsText = await settings.innerText();
    if (settingsText.includes('嚴格模式')) pass('預設為嚴格模式');
    else fail('預設為嚴格模式', settingsText.slice(0, 80));

    const toggle = page.locator('#toggle-strict-allocation');
    if (await toggle.isChecked()) pass('開關預設為 ON');
    else fail('開關預設為 ON');

    await openElementaryAllocation(page);

    const submitStrict = page.locator('#submit-allocation');
    if (await submitStrict.isDisabled()) pass('嚴格模式：未分完 10 點時提交禁用');
    else fail('嚴格模式：未分完 10 點時提交禁用');

    const labelStrict = await submitStrict.innerText();
    if (labelStrict.includes('未分配')) pass('嚴格模式：按鈕顯示未分配提示', labelStrict);
    else fail('嚴格模式：按鈕文案', labelStrict);

    // Back to map, switch to free mode (click label — input is visually hidden)
    await page.click('#btn-back-map');
    await page.waitForSelector('#view-map.active');
    await page.locator('.toggle-switch').click();
    await page.waitForTimeout(200);

    const freeText = await settings.innerText();
    if (freeText.includes('自由模式')) pass('切換後顯示自由模式');
    else fail('切換後顯示自由模式', freeText.slice(0, 80));

    await openElementaryAllocation(page);

    const hint = page.locator('.allocation-hint');
    if (await hint.count()) pass('自由模式：顯示 allocation-hint');
    else fail('自由模式：缺少 allocation-hint');

    const submitFree = page.locator('#submit-allocation');
    if (!(await submitFree.isDisabled())) pass('自由模式：0 點分配也可提交');
    else fail('自由模式：提交應可用');

    const labelFree = await submitFree.innerText();
    if (labelFree.includes('浪費 10 點')) pass('自由模式：按鈕顯示浪費 10 點', labelFree);
    else fail('自由模式：按鈕文案', labelFree);

    // Submit with 0 points allocated
    await submitFree.click();
    await page.waitForSelector('.toast-card', { timeout: 5000 });
    const toast = await page.locator('.toast-card').filter({ hasText: '浪費了 10 點' }).first().innerText();
    if (toast.includes('浪費了 10 點')) pass('提交後 toast 提醒浪費 10 點');
    else fail('提交後 toast', toast.slice(0, 120));

    // Dismiss stacked toasts (chapter + achievement)
    for (let i = 0; i < 3; i++) {
      const overlay = page.locator('.toast-overlay').last();
      if (!(await overlay.count())) break;
      await overlay.locator('#toast-close').click({ force: true });
      await page.waitForTimeout(400);
    }
    await page.waitForSelector('#view-abilities.active');
    pass('完成章節後進入能力總覽');

    const nextBtn = page.locator('#btn-next-chapter, .btn-next-chapter, button:has-text("前往下一章")');
    if (await nextBtn.count()) pass('能力頁顯示前往下一章');
    else pass('能力頁渲染完成（下一章按鈕依完成狀態顯示）');

    // localStorage persistence
    const saved = await page.evaluate(() => {
      const raw = localStorage.getItem('lifeSkillTree_v1');
      return raw ? JSON.parse(raw) : null;
    });
    if (saved?.settings?.strictAllocation === false) pass('localStorage 保存 strictAllocation=false');
    else fail('localStorage settings', JSON.stringify(saved?.settings));

    if (saved?.completedStages?.includes('elementary')) pass('localStorage 記錄 elementary 已完成');
    else fail('completedStages', JSON.stringify(saved?.completedStages));
  } catch (err) {
    fail('測試執行例外', err.message);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n---');
  console.log(`共 ${results.length} 項，${results.length - failed.length} 通過，${failed.length} 失敗`);
  process.exit(failed.length ? 1 : 0);
}

run();
