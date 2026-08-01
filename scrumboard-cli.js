#!/usr/bin/env node

const { Command } = require("commander");
const { login } = require("./lib/auth");
const { exportBoard } = require("./lib/export");
const {
  setProjectId,
  getProjectId,
  DEFAULT_BASE_URL,
} = require("./lib/session-store");

const program = new Command();

program
  .command("login")
  .description("Open a browser window to log in and save your session")
  .action(async () => {
    try {
      const sessionPath = await login({
        loginUrl: DEFAULT_BASE_URL + "/login",
      });
      console.log(`✅ Logged in. Session saved to ${sessionPath}`);
    } catch (err) {
      console.error("❌ Login failed or timed out:", err.message);
      process.exit(1);
    }
  });

program
  .command("project [id]")
  .description("Get or set the active project ID")
  .action((id) => {
    if (id) {
      setProjectId(id);
      console.log(`✅ Active project set to ${id}`);
    } else {
      const current = getProjectId();
      console.log(
        current
          ? `Active project: ${current}`
          : "No project set. Run `scrumboard-cli project <id>`.",
      );
    }
  });

program
  .command("export")
  .description("Export the active project's board to JSON")
  .option("-d, --details", "Include card details")
  .option("-o, --out-dir <dir>", "Output directory")
  .action(async (options) => {
    try {
      await exportBoard({ details: options.details, outDir: options.outDir });
      console.log("✅ Export complete");
    } catch (err) {
      console.error("❌ Export failed:", err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
