#!/usr/bin/env node

import path from 'path';
import minimist from 'minimist';
import app from './server.js';
import loadModels from './utils/loadModels.js';
import open from 'open';
import chalk from 'chalk';
import mongoose from 'mongoose';

const args = minimist(process.argv.slice(2));

if (!args.model) {
    console.log(
        chalk.red.bold('[ERROR]') + ' Missing required flag: ' + chalk.yellow('--model')
    );
    console.log('Usage: ' + chalk.cyan('quar --model <model-folder> --db <database-name>'));
    process.exit(1);
}

if (typeof args.model !== 'string') {
    console.log(
        chalk.red.bold('[ERROR]') + ' The value for ' + chalk.yellow('--model') + ' must be a string.'
    );
    process.exit(1);
}

if (!args.db) {
    console.log(
        chalk.red.bold('[ERROR]') + ' Missing required flag: ' + chalk.yellow('--db')
    );
    console.log('Usage: ' + chalk.cyan('quar --model <model-folder> --db <database-name>'));
    process.exit(1);
}

if (typeof args.db !== 'string') {
    console.log(
        chalk.red.bold('[ERROR]') + ' The value for ' + chalk.yellow('--db') + ' must be a string.'
    );
    process.exit(1);
}

const modelDir = path.resolve(process.cwd(), args.model);
const fullModelPath = path.resolve(modelDir);

// 🔃 Load Models and Start Server
try {
    loadModels(fullModelPath);
    app.locals.modelPath = fullModelPath;

    (async () => {

        await mongoose.connect(`${args.uri || "mongodb://localhost:27017/"}${args.db}`)
        console.log(chalk.blue.bold('[INFO]'), chalk.gray("Quar: Database connection established"))

        app.listen(app.get('port'), () => {
            const url = `http://127.0.0.1:${app.get('port')}`;
            console.log(chalk.green.bold('[SUCCESS]') + chalk.gray(` Server is running on ${chalk.underline(url)}`));
            if (args.open) open(url);
        });
    })();
} catch (err) {
    console.log(chalk.red.bold('[FATAL ERROR]') + ' Failed to launch the server.');
    console.error(chalk.red(err.stack));
    process.exit(1);
}
