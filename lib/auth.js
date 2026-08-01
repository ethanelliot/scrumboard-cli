const { chromium } = require("playwright");
const { getSessionPath, ensureConfigDir } = require("./session-store");

/**
 * Opens a browser for manual login, waits for ANY redirect away from
 * the initial login URL, then saves the session.
 *
 * @param {Object} opts
 * @param {string} opts.loginUrl - URL to open for login
 * @param {number} [opts.timeout=0] - ms to wait before giving up (0 = wait forever)
 */
async function login({ loginUrl, timeout = 0 }) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(loginUrl);
  const initialUrl = page.url();

  console.log("Waiting for login... complete it in the browser window.");

  // Wait for the URL to become anything other than the initial one
  await page.waitForURL((url) => url.toString() !== initialUrl, { timeout });

  console.log(`Redirect detected → ${page.url()}`);

  ensureConfigDir();
  await context.storageState({ path: getSessionPath() });

  await browser.close();

  return getSessionPath();
}

async function isOnLoginPage(page) {
  const hasPasswordField = await page.$('input[type="password"]');
  return !!hasPasswordField;
}

module.exports = { login, isOnLoginPage };
