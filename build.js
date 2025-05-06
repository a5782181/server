// build.js
import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 混淆配置
const obfuscatorConfig = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.7,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: 2000,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    shuffleStringArray: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// 需要混淆的目录和文件列表
const foldersToObfuscate = [
    'admin',
    'controllers',
    'middlewares',
    'routes',
    'utils'
];

// 不需要混淆的文件和目录
const filesToCopy = [
    '.well-known',
    'cert',
    'common',
    'config',
    'public',
    '.env',
    '.htaccess',
    'package.json',
    'package-lock.json'
];

async function getAllJsFiles(directory) {
    const jsFiles = [];

    async function traverse(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await traverse(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                jsFiles.push(path.relative(__dirname, fullPath));
            }
        }
    }

    await traverse(directory);
    return jsFiles;
}

async function obfuscateFile(inputPath) {
    try {
        const fullPath = path.join(__dirname, inputPath);
        const code = await fs.readFile(fullPath, 'utf8');

        const obfuscationResult = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);

        // 创建输出目录
        const distPath = path.join(__dirname, 'dist', inputPath);
        await fs.mkdir(path.dirname(distPath), { recursive: true });

        // 写入混淆后的代码
        await fs.writeFile(distPath, obfuscationResult.getObfuscatedCode());
        console.log(`Successfully obfuscated: ${inputPath}`);
    } catch (error) {
        console.error(`Error obfuscating ${inputPath}:`, error);
    }
}

async function copyDirectory(src, dest) {
    try {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    } catch (error) {
        console.error(`Error copying directory ${src}:`, error);
    }
}

async function copyNonJsFiles() {
    try {
        for (const item of filesToCopy) {
            const sourcePath = path.join(__dirname, item);
            const targetPath = path.join(__dirname, 'dist', item);

            try {
                const stats = await fs.stat(sourcePath);
                if (stats.isDirectory()) {
                    await copyDirectory(sourcePath, targetPath);
                    console.log(`Successfully copied directory: ${item}`);
                } else {
                    await fs.copyFile(sourcePath, targetPath);
                    console.log(`Successfully copied file: ${item}`);
                }
            } catch (error) {
                console.log(`Note: ${item} not found, skipping...`);
            }
        }
    } catch (error) {
        console.error('Error during file copying:', error);
    }
}

// 主构建函数
async function build() {
    try {
        // 清理并创建 dist 目录
        await fs.rm(path.join(__dirname, 'dist'), { recursive: true, force: true });
        await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });

        // 混淆 server.js
        await obfuscateFile('server.js');

        // 混淆其他目录中的 JS 文件
        for (const folder of foldersToObfuscate) {
            const folderPath = path.join(__dirname, folder);
            try {
                const jsFiles = await getAllJsFiles(folderPath);
                for (const file of jsFiles) {
                    await obfuscateFile(file);
                }
            } catch (error) {
                console.log(`Note: ${folder} not found or empty, skipping...`);
            }
        }

        // 复制其他文件
        await copyNonJsFiles();

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();