const fs = require("fs");
const path = require("path");
const os = require("os");

const CONFIG_DIR = path.join(os.homedir(), ".scrumboard-cli");
const SESSION_FILE = path.join(CONFIG_DIR, "session.json");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

const DEFAULT_BASE_URL = "https://scrumboard.csse.canterbury.ac.nz";

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function sessionExists() {
  return fs.existsSync(SESSION_FILE);
}

function getSessionPath() {
  return SESSION_FILE;
}

function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

function setConfig(partial) {
  ensureConfigDir();
  const current = getConfig();
  const merged = { ...current, ...partial };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

function setProjectId(id) {
  return setConfig({ projectId: id });
}

function getProjectId() {
  return getConfig().projectId || null;
}

function getBoardUrl(projectId) {
  const config = getConfig();
  const id = projectId || config.projectId;
  if (!id) return null;
  return `${DEFAULT_BASE_URL}/project/${id}`;
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
  DEFAULT_BASE_URL,
};
