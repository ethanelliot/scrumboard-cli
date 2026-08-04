const { chromium } = require("playwright");
const { getChromiumPath } = require("./session-store");

/**
 * Launches Chromium, converting the "browser not installed" error
 * Playwright throws into a clearer, actionable message.
 *
 * @param {Object} [opts] - Forwarded to `chromium.launch`.
 * @returns {Promise<import("playwright").Browser>}
 */
async function launchChromium(opts) {
  const executablePath = getChromiumPath();

  try {
    return await chromium.launch({
      ...(executablePath && { executablePath }),
      ...opts,
    });
  } catch (err) {
    if (err.message.includes("Executable doesn't exist")) {
      throw new Error(
        "Chromium isn't installed. Run `npm run install-browser` (or `npx playwright install chromium`) and try again.",
      );
    }
    throw err;
  }
}
module.exports = { launchChromium };
