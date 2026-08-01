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

async function exportBoard({ details = false, outDir } = {}) {
  if (!sessionExists()) {
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: getSessionPath() });
  const page = await context.newPage();

  await page.goto(getBoardUrl());

  if (await isOnLoginPage(page)) {
    await browser.close();
    throw new Error("Not logged in. Run `scrumboard-cli login` first.");
  }
}

module.exports = { exportBoard };
