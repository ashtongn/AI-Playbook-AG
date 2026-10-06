import { createHash } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { CSAF_LETTER } from "../../content/leadership";
import { ALL_LIBRARY, SHELF_FILTERS, STRATEGY_STACK } from "../../content/library";

test.beforeEach(async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
});

test("published leadership intent retains its provenance without claiming endorsement", async ({ page, request }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#playbook-title")).toHaveText("Airman's AI Playbook");
  await expect(page.locator("#leadership-source blockquote")).toHaveText(`“${CSAF_LETTER.quote}”`);
  await expect(page.locator("#leadership-source")).toContainText("Not an endorsement of this Playbook.");
  await expect(page.locator("#leadership-source time")).toHaveAttribute("datetime", "2025-11-03");
  await expect(page.locator("main img[src*='af-symbol']")).toHaveCount(0);
  const signature = page.locator("[data-leadership-signature]");
  await expect(signature).toHaveAttribute("src", CSAF_LETTER.signatureUrl);
  expect(await signature.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 596 && image.naturalHeight === 138)).toBe(true);
  await page.getByText("About the signature & its source", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Official letter", exact: true })).toHaveAttribute("href", CSAF_LETTER.officialUrl);
  await expect(page.getByRole("link", { name: "Archived official copy" })).toHaveAttribute("href", CSAF_LETTER.archivedUrl);
  await expect(page.getByRole("link", { name: "Read the complete letter (PDF)" })).toHaveAttribute("href", CSAF_LETTER.localUrl);
  const pdf = await request.get(CSAF_LETTER.localUrl);
  expect(pdf.status()).toBe(200);
  expect(createHash("sha256").update(await pdf.body()).digest("hex")).toBe(CSAF_LETTER.sourceSha256);
  const strategy = page.locator("section", { has: page.locator("#direction-title") });
  await expect(strategy).toContainText("Troy E. Meink");
  await expect(strategy).toContainText("Secretary of the Air Force");
  await expect(strategy.getByRole("link", { name: "Read the strategy" })).toHaveAttribute("href", "/reader/daf-ai-strategy");
});

test("signature reveal precedes identity emphasis and reduced motion shows everything immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload({ waitUntil: "networkidle" });
  const motion = await page.locator("[data-leadership-signature]").evaluate((image) => {
    const animation = image.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    const start = getComputedStyle(image).clipPath;
    animation.currentTime = 800;
    const middle = getComputedStyle(image).clipPath;
    animation.currentTime = 1600;
    const end = getComputedStyle(image).clipPath;
    const timing = animation.effect!.getTiming();
    const wordmark = document.querySelector("#playbook-title")!;
    return { start, middle, end, duration: timing.duration, iterations: timing.iterations, identityDelay: getComputedStyle(wordmark).animationDelay };
  });
  expect(motion.start).toBe("inset(0px 100% 0px 0px)");
  expect(motion.middle).not.toBe(motion.start);
  expect(motion.middle).not.toBe(motion.end);
  expect(motion.end).toBe("inset(0px 0% 0px 0px)");
  expect(motion.duration).toBe(1600);
  expect(motion.iterations).toBe(1);
  expect(motion.identityDelay).toBe("1.5s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("[data-leadership-signature]")).toHaveCSS("animation-name", "none");
  await expect(page.locator("#playbook-title")).toHaveCSS("animation-name", "none");
  await expect(page.locator("#playbook-title")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("link", { name: "Find your next move", exact: true })).toBeVisible();
});

test("optional setup saves preferences and saved items remain removable", async ({ page }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Set up Home", exact: true }).click();
  const setup = page.getByRole("dialog", { name: "Set up Home", exact: true });
  await expect(setup).toBeVisible();
  await setup.getByRole("button", { name: /^Find a tool/ }).click();
  await setup.getByRole("button", { name: /^Make it repeatable/ }).click();
  await setup.getByRole("button", { name: "Save setup", exact: true }).click();
  await expect(setup).toHaveCount(0);
  await page.reload({ waitUntil: "networkidle" });
  const reference = page.locator("[data-home-reference]");
  await expect(reference).toContainText("Find a tool");
  await expect(reference.getByRole("link", { name: "Start here", exact: true })).toHaveAttribute("href", "/tools");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Tools", exact: true }).click();
  await page.getByRole("button", { name: "Add GenAI.mil to Home", exact: true }).click();
  await page.getByRole("link", { name: "Airman's AI Playbook home", exact: true }).click();
  await expect(reference.getByRole("link", { name: "Tool GenAI.mil", exact: true })).toHaveAttribute("href", "https://genai.mil");
  await reference.getByRole("button", { name: "Remove GenAI.mil", exact: true }).click();
  await expect(reference.getByText("Star a play or tool to save it here", { exact: false })).toBeVisible();
  await reference.getByRole("button", { name: "Change Home setup" }).click();
  await page.keyboard.press("Escape");
  await expect(setup).toHaveCount(0);
});

test("reference tabs, strategy disclosures, and source filters retain keyboard and content behavior", async ({ page }) => {
  const reference = page.locator("[data-home-reference]");
  const saved = reference.getByRole("tab", { name: "Saved work", exact: true });
  await saved.focus();
  await page.keyboard.press("ArrowRight");
  await expect(reference.getByRole("tab", { name: "Strategy", exact: true })).toBeFocused();
  await expect(reference.getByRole("tab", { name: "Strategy", exact: true })).toHaveAttribute("aria-selected", "true");
  const panel = reference.getByRole("tabpanel");
  await expect(panel).toHaveCount(1);
  await expect(panel).toContainText("Not a CSAF endorsement.");
  for (const doc of STRATEGY_STACK) {
    const disclosure = panel.getByRole("button", { name: new RegExp(doc.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(disclosure.locator("a")).toHaveCount(0);
    await expect(panel.getByText(doc.translation_line!, { exact: true })).toBeVisible();
    await disclosure.click();
  }
  await reference.getByRole("tab", { name: "Strategy", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(reference.getByRole("tab", { name: "Sources", exact: true })).toBeFocused();
  for (const filter of SHELF_FILTERS) {
    await panel.getByRole("group", { name: "Filter sources" }).getByRole("button", { name: filter.label, exact: true }).click();
    const expected = filter.id === "all" ? ALL_LIBRARY : ALL_LIBRARY.filter((doc) => doc.category === filter.id);
    await expect(panel.locator("article")).toHaveCount(expected.length);
    await expect(panel.getByRole("status")).toContainText(`${expected.length} sources shown`);
  }
  await reference.getByRole("tab", { name: "Sources", exact: true }).focus();
  await page.keyboard.press("Home");
  await expect(saved).toBeFocused();
  await expect(saved).toHaveAttribute("aria-selected", "true");
});

test("adoption actions, global search, strategy and guide remain reachable", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Find your next move", exact: true })).toHaveAttribute("href", "/plays");
  const progression = page.getByRole("navigation", { name: "From leadership intent to mission execution" });
  await expect(progression.getByRole("link")).toHaveCount(4);
  await progression.getByRole("link", { name: /Airman adoption/ }).click();
  await expect(page).toHaveURL(/#start-here$/);
  await page.getByRole("button", { name: "Read the user guide", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "User Guide" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#home-search").fill("awards");
  await page.locator("main form").getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=awards$/);
  await expect(page.getByRole("textbox", { name: "Search the AI Playbook" })).toHaveValue("awards");
});

for (const width of [1440, 1024, 768, 390]) {
  test(`leadership composition and home reference accessibility at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: testInfo.outputPath(`leadership-${width}.png`), fullPage: true });
    if (width === 390) {
      const quote = await page.locator("#leadership-source blockquote").boundingBox();
      expect(quote!.y + quote!.height).toBeLessThan(700);
      const title = await page.locator("#playbook-title").boundingBox();
      expect(title!.y).toBeLessThan(900);
      const cta = await page.getByRole("link", { name: "Find your next move", exact: true }).boundingBox();
      expect(cta!.y + cta!.height).toBeLessThan(1200);
    }
    for (const tab of ["Saved work", "Strategy", "Sources"]) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
    const shortControls = await page.locator("main button:visible, main summary:visible")
      .evaluateAll((elements) => elements.filter((element) => element.getBoundingClientRect().height < 44).map((element) => element.textContent));
    expect(shortControls).toEqual([]);
  });
}
