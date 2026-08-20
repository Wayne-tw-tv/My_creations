from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8000"
OUT = Path(__file__).resolve().parent / "images"
OUT.mkdir(exist_ok=True)
USER = "admin"
PASSWORD = "admin123"


def shot(page, name: str) -> None:
    page.wait_for_timeout(400)
    page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
    print("saved", name)


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="zh-TW",
            device_scale_factor=1.25,
        )
        page = context.new_page()

        page.goto(f"{BASE}/login", wait_until="networkidle")
        shot(page, "01-login")

        page.fill('input[name="username"]', USER)
        page.fill('input[name="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        if "/login" in page.url:
            shot(page, "01-login-failed")
            raise SystemExit("登入失敗：請確認本機系統仍可用 admin / admin123")

        for name, path in [
            ("02-employees", "/employees"),
            ("03-training-bulk", "/training/bulk"),
            ("04-training", "/training"),
            ("05-certificates", "/certificates"),
            ("06-excel", "/excel"),
            ("07-notes", "/notes"),
            ("08-change-password", "/change-password"),
        ]:
            page.goto(f"{BASE}{path}", wait_until="networkidle")
            shot(page, name)

        page.goto(f"{BASE}/certificates", wait_until="networkidle")
        emp = page.locator('select[name="employee_id"] option[value]:not([value=""]):not([value="all"])').first
        emp_id = emp.get_attribute("value")
        if emp_id:
            page.select_option('select[name="employee_id"]', emp_id)
            page.fill('input[name="date_from"]', "2026-01-01")
            page.fill('input[name="date_to"]', "2026-12-31")
            with context.expect_page() as popup_info:
                page.click('button[type="submit"]')
            print_page = popup_info.value
            print_page.wait_for_load_state("networkidle")
            print_page.set_viewport_size({"width": 1200, "height": 1600})
            shot(print_page, "09-certificate-print")
            print_page.close()

        browser.close()
        print("done", OUT)


if __name__ == "__main__":
    main()
