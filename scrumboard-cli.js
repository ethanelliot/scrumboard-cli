#!/usr/bin/env node

const { Command } = require("commander");
const program = new Command();

program
  .command("login")
  .option("-d, --details", "include details", false)
  .option("-o, --out <dir>", "output directory")
  .action((opts) => {
    console.log("Exporting, details:", opts.details, "outDir:", opts.out);
  });

program.parse(process.argv);
