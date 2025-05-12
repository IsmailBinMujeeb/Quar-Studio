import fs from "fs";
import path from "path";
import chalk from "chalk";

import { pathToFileURL } from "url";

export default (modelPath) => {
    if (!fs.existsSync(modelPath)) {
        console.log(
            chalk.red.bold('[ERROR]') +
                ' The specified model path does not exist:\n  ' +
                chalk.gray(modelPath)
        );
        console.log('Tip: Check the path or create the folder first.');
        process.exit(1);
    }
    
    fs.readdirSync(modelPath).forEach(async (file) => {
        if (file.endsWith('.js')) {
            const filePath = path.join(modelPath, file);
            const moduleUrl = pathToFileURL(filePath);
            await import(moduleUrl.href);
        }
    });
}