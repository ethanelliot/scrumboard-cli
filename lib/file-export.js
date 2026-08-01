const fs = require("fs");
const path = require("path");
const { getConfig } = require("./session-store");

function resolveOutFile(out) {
  const config = getConfig();
  const resolvedOut = path.resolve(process.cwd(), out || config.out || ".");

  if (resolvedOut.endsWith(".json")) return resolvedOut;

  return path.join(
    resolvedOut,
    `export-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
}

function writeExport(data, out) {
  const outFile = resolveOutFile(out);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  return outFile;
}

module.exports = { writeExport };
