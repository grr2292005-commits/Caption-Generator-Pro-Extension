const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const ROOT_DIR = __dirname;
const RELEASE_DIR = path.join(ROOT_DIR, "release");

const OBFUSCATE_FILES = [
    "main.js",
    "license.js",
    "extendscript_bridge.js",
    "settings.js",
    "editor.js",
    "installer.js"
];

const OBFUSCATOR_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    renameGlobals: false,
    selfDefending: false
};

function copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            if (childItemName === "node_modules" || childItemName === ".git" || childItemName === "release" || childItemName === "package-lock.json") {
                return;
            }
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        var destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(src, dest);
    }
}

console.log("=================================================");
console.log("  CAPTION GENERATOR PRO - SAFE RELEASE BUILDER   ");
console.log("=================================================");

if (fs.existsSync(RELEASE_DIR)) {
    console.log("🧹 Cleaning old release directory...");
    fs.rmSync(RELEASE_DIR, { recursive: true, force: true });
}
fs.mkdirSync(RELEASE_DIR, { recursive: true });

console.log("📁 Copying development source to release/ ...");

const targets = ["Premiere Pro", "After Effects", "install_all.bat", "clean_uninstall_all.bat", "README.md"];

targets.forEach(function(item) {
    const srcPath = path.join(ROOT_DIR, item);
    const destPath = path.join(RELEASE_DIR, item);
    if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
    }
});

console.log("🔒 Obfuscating client JS files in release folder...");

let obfuscatedCount = 0;

function processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    items.forEach(function(item) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile()) {
            const fileName = path.basename(fullPath);
            const relativePath = path.relative(RELEASE_DIR, fullPath).replace(/\\/g, "/");

            if (OBFUSCATE_FILES.includes(fileName)) {
                // Ensure it is inside client/js/ and NOT in lib/ (CSInterface.js), host/, or backend/
                if (relativePath.includes("client/js/") && !relativePath.includes("client/js/lib/")) {
                    console.log("  ⚡ Obfuscated: " + relativePath);
                    const rawCode = fs.readFileSync(fullPath, "utf-8");
                    const obfuscatedResult = JavaScriptObfuscator.obfuscate(rawCode, OBFUSCATOR_OPTIONS);
                    fs.writeFileSync(fullPath, obfuscatedResult.getObfuscatedCode(), "utf-8");
                    obfuscatedCount++;
                }
            }
        }
    });
}

processDirectory(RELEASE_DIR);

console.log("=================================================");
console.log(`✅ Build completed! ${obfuscatedCount} client JS files protected.`);
console.log("📍 Distribution release folder: " + RELEASE_DIR);
console.log("=================================================");
