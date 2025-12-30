#!/usr/bin/env node

import path from "path";
import minimist from "minimist";
import app from "./server.js";
import loadModels from "./utils/loadModels.js";
import open from "open";
import chalk from "chalk";
import mongoose from "mongoose";
import { input } from "@inquirer/prompts";

const args = minimist(process.argv.slice(2));

if (!args.model) {
  args.model = await input({
    message: " What's your model folder?",
    default: "./models",
    required: true,
    validate: (input) => {
      if (!input) return "Please enter a valid model folder.";
      return true;
    },
  });
}

if (typeof args.model !== "string") {
  console.log(
    chalk.red.bold("[ERROR]") +
      " The value for " +
      chalk.yellow("--model") +
      " must be a string.",
  );
  process.exit(1);
}

if (!args.db) {
  args.db = await input({
    message: " What's your database name?",
    default: "quarDB",
    required: true,
    validate: (input) => {
      if (!input) return "Please enter a valid database name.";
      return true;
    },
  });
}

if (typeof args.db !== "string") {
  console.log(
    chalk.red.bold("[ERROR]") +
      " The value for " +
      chalk.yellow("--db") +
      " must be a string.",
  );
  process.exit(1);
}

if (!args.uri) {
  args.uri = await input({
    message: " What's your database URI?",
    default: "mongodb://localhost:27017/",
    required: true,
    validate: (input) => {
      if (!input) return "Please enter a valid database URI.";
      return true;
    },
  });
}

const modelDir = path.resolve(process.cwd(), args.model);
const fullModelPath = path.resolve(modelDir);

// 🔃 Load Models and Start Server
try {
  loadModels(fullModelPath);
  app.locals.modelPath = fullModelPath;

  (async () => {
    await mongoose.connect(
      `${args.uri || "mongodb://localhost:27017/"}${args.db}`,
    );
    console.log(
      chalk.blue.bold("[INFO]"),
      chalk.gray("Quar: Database connection established"),
    );

    app.listen(app.get("port"), () => {
      const url = `http://127.0.0.1:${app.get("port")}`;
      console.log(
        chalk.green.bold("[SUCCESS]") +
          chalk.gray(` Server is running on ${chalk.underline(url)}`),
      );
      if (args.open) open(url);
    });
  })();
} catch (err) {
  console.log(
    chalk.red.bold("[FATAL ERROR]") + " Failed to launch the server.",
  );
  console.error(chalk.red(err.stack));
  process.exit(1);
}
