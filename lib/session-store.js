const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".scrumboard-cli");
const SESSION_FILE = path.join(CONFIG_DIR, "session.json");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_BASE_URL = "https://scrumboard.csse.canterbury.ac.nz";

/**
 * Creates the ~/.scrumboard-cli config directory if it doesn't already exist.
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

/**
 * Checks whether a saved login session exists on disk.
 *
 * @returns {boolean}
 */
function sessionExists() {
  return fs.existsSync(SESSION_FILE);
}

/**
 * Gets the path where the Playwright session (storage state) is saved.
 *
 * @returns {string}
 */
function getSessionPath() {
  return SESSION_FILE;
}

/**
 * Reads the persisted config file, if any.
 *
 * @returns {Object} The saved config, or `{}` if none exists yet.
 */
function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

/**
 * Merges the given values into the persisted config and writes it to disk.
 *
 * @param {Object} partial - Config keys to set/overwrite.
 * @returns {Object} The full merged config that was written.
 */
function setConfig(partial) {
  ensureConfigDir();
  const current = getConfig();
  const merged = { ...current, ...partial };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

/**
 * Sets the chromiumPath in the persisted config.
 *
 * @param {string} path path to chromium executable
 * @returns {Object} The full merged config that was written.
 */
function setChromiumPath(path) {
  return setConfig({ chromiumPath: path });
}

/**
 * Gets the chromiumPath from the persisted config.
 *
 * @returns {string|null}
 */
function getChromiumPath() {
  return getConfig().chromiumPath || null;
}

/**
 * Sets the active project ID in the persisted config.
 *
 * @param {string} id
 * @returns {Object} The full merged config that was written.
 */
function setProjectId(id) {
  return setConfig({ projectId: id });
}

/**
 * Gets the active project ID from the persisted config.
 *
 * @returns {string|null}
 */
function getProjectId() {
  return getConfig().projectId || null;
}

/**
 * Builds the board URL for a project.
 *
 * @param {string} [projectId] - Defaults to the active project ID in config.
 * @returns {string|null} The board URL, or `null` if no project ID is set.
 */
function getBoardUrl(projectId) {
  const config = getConfig();
  const id = projectId || config.projectId;
  if (!id) return null;
  return `${DEFAULT_BASE_URL}/project/${id}/board`;
}

module.exports = {
  ensureConfigDir,
  sessionExists,
  getSessionPath,
  getConfig,
  setConfig,
  getBoardUrl,
  setProjectId,
  getProjectId,
  setChromiumPath,
  getChromiumPath,
  DEFAULT_BASE_URL,
};
