const { chromium } = require("playwright");
const {
  sessionExists,
  getSessionPath,
  getBoardUrl,
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
 * Logs into the active project's board using the saved session, scrapes
 * its tasks, and writes the result to disk as JSON.
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.details=false] - Reserved for including extra
 *   card/story detail in the scrape.
 * @param {string} [opts.out] - Output directory or exact `.json` file path.
 * @returns {Promise<string>} Absolute path to the exported JSON file.
 */
async function exportBoard({ details = false, out } = {}) {
  if (!sessionExists()) {
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: getSessionPath() });
  const page = await context.newPage();

  await page.goto(getBoardUrl());
  await page.waitForLoadState("networkidle");

  if (await isOnLoginPage(page)) {
    await browser.close();
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }

  const tasks = await scrapeTasks(page);

  await browser.close();

  return writeExport({ tasks }, out);
}

module.exports = { exportBoard };
