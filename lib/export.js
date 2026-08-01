const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const {
  sessionExists,
  getSessionPath,
  getConfig,
  getBoardUrl,
} = require("./session-store");
const { isOnLoginPage } = require("./auth");

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

  const config = getConfig();
  const resolvedOut = path.resolve(process.cwd(), out || config.out || ".");

  const isExactFile = resolvedOut.endsWith(".json");
  const outFile = isExactFile
    ? resolvedOut
    : path.join(
        resolvedOut,
        `export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      );

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify({ tasks }, null, 2));

  return outFile;
}

module.exports = { exportBoard };
