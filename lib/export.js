const { launchChromium } = require("./browser");
const {
  sessionExists,
  getSessionPath,
  getBoardUrl,
  DEFAULT_BASE_URL,
} = require("./session-store");
const { isOnLoginPage } = require("./auth");
const { writeExport } = require("./file-export");

/**
 * Scrapes all task cards from the sprint board's columns.
 *
 * @param {import("playwright").Page} page - Page currently on the board.
 * @returns {Promise<Object[]>} One entry per task card, with its title,
 *   priority, complexity, time tracking, assignees, reviewers, and status.
 */
async function scrapeTasks(page) {
  return page.$$eval(".sprintboard-column", (cols) => {
    const tasks = [];
    cols.forEach((col) => {
      const status =
        col.querySelector(".column-name")?.textContent.trim() ?? "Unknown";
      col.querySelectorAll(".task-card").forEach((card) => {
        tasks.push({
          title:
            card.querySelector(".task-name strong")?.textContent.trim() ?? "",
          priority:
            card.querySelector("#card-priority")?.textContent.trim() ?? "",
          complexity:
            card.querySelector("#card-complexity")?.textContent.trim() ?? "",
          time: {
            current:
              card.querySelector("#time-remaining")?.textContent.trim() ?? "",
            estimated:
              card.querySelector("#time-estimated")?.textContent.trim() ?? "",
          },
          assignees: Array.from(
            card.querySelectorAll("#assignee-select .avatar-container"),
          ).map(
            (el) =>
              el.querySelector(".name-tooltip")?.textContent.trim() ??
              el.querySelector("img")?.alt ??
              "",
          ),
          reviewers: Array.from(
            card.querySelectorAll("#reviewer-select .avatar-container"),
          ).map(
            (el) =>
              el.querySelector(".name-tooltip")?.textContent.trim() ??
              el.querySelector("img")?.alt ??
              "",
          ),
          status,
        });
      });
    });
    return tasks;
  });
}

/**
 * Reads the trimmed text content of the first match for a locator, or ""
 * if it has no matches.
 *
 * @param {import("playwright").Locator} locator
 * @returns {Promise<string>}
 */
async function textOrEmpty(locator, timeout = 5000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
  } catch {
    return "";
  }
  return ((await locator.first().textContent()) ?? "").trim();
}

/**
 * Scrapes the acceptance criteria listed within a story's detail modal.
 *
 * @param {import("playwright").Locator} modal
 * @returns {Promise<Object[]>} One entry per AC, with its label and text.
 */
async function scrapeACs(modal) {
  const items = await modal.locator('[id^="full-story-ac-"]').all();

  return Promise.all(
    items.map(async (item) => ({
      ac: await textOrEmpty(item.locator(".fw-bold")),
      text: await textOrEmpty(
        item.locator("span[style*='white-space: pre-wrap']"),
      ),
    })),
  );
}

/**
 * Scrapes all stories from the sprint board. When `includeDetails` is set,
 * opens each story's detail modal to also pull its description and
 * acceptance criteria.
 *
 * @param {import("playwright").Page} page - Page currently on the board.
 * @param {boolean} includeDetails
 * @returns {Promise<Object[]>} One entry per story, with its name,
 *   description, and acceptance criteria (empty unless includeDetails).
 */
async function scrapeStories(page, includeDetails) {
  const storyEls = await page.locator(".accordion.story").all();
  const stories = [];

  for (const story of storyEls) {
    const name = await textOrEmpty(story.locator('[id^="story-name-"]'));

    if (!includeDetails) {
      stories.push({ name });
      continue;
    }

    let description = "";
    let acs = [];

    const viewButton = story.locator('[id^="view-story-details-"]');

    if (await viewButton.count()) {
      await viewButton.click();

      const modal = page.locator("[id^='full-story-view-']");
      await modal.waitFor({ state: "visible" });

      description = await textOrEmpty(
        modal.locator("[id^='full-story-description-'] span p"),
      );
      acs = await scrapeACs(modal);

      await modal.locator(".btn-close").click();
      await modal.waitFor({ state: "hidden" });
    }

    stories.push({ name, description, acs });
  }

  return stories;
}

/**
 * Logs into the active project's board using the saved session, scrapes
 * its tasks and stories, and writes the result to disk as JSON.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.details=false] - Whether to open each story's
 *   detail modal to also scrape its description and acceptance criteria.
 * @param {string} [opts.out] - Output directory or exact `.json` file path.
 * @param {boolean} [opts.headed=false] - Run the browser with a visible
 *   window instead of headless.
 * @returns {Promise<string>} Absolute path to the exported JSON file.
 */
async function exportBoard({ details = false, out, headed = false } = {}) {
  if (!sessionExists()) {
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }

  const browser = await launchChromium({ headless: !headed });
  const context = await browser.newContext({ storageState: getSessionPath() });
  const page = await context.newPage();

  await page.goto(getBoardUrl());
  await page.waitForLoadState("networkidle");

  if (await isOnLoginPage(page)) {
    await browser.close();
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }

  if (page.url().replace(/\/$/, "") === DEFAULT_BASE_URL) {
    await browser.close();
    throw new Error(
      "Redirected to the scrumboard home page — check that `scrumboard project <id>` is set to a valid project.",
    );
  }

  if (await page.getByText("This project does not have an active sprint").count()) {
    await browser.close();
    throw new Error("This project does not have an active sprint");
  }

  const tasks = await scrapeTasks(page);
  const stories = await scrapeStories(page, details);

  await browser.close();

  return writeExport({ tasks, stories }, out);
}

module.exports = { exportBoard };
