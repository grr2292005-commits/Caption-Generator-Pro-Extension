// Dependency & Model Installer Manager
var DependencyInstaller = {
    csInterface: new CSInterface(),
    currentProc: null,

    getExtensionPath: function() {
        var extPath = this.csInterface.getSystemPath(SystemPath.EXTENSION);
        if (!extPath || extPath === ".") {
            if (typeof __dirname !== "undefined") {
                var path = require("path");
                extPath = path.resolve(__dirname, "../../");
            } else {
                extPath = ".";
            }
        }
        return extPath;
    },

    getPythonExecutable: function() {
        if (typeof require === "undefined") return "python";
        var fs = require("fs");
        var path = require("path");
        var os = require("os");

        var userHome = os.homedir();
        var candidates = [
            "C:\\Python314\\python.exe",
            "C:\\Python313\\python.exe",
            "C:\\Python312\\python.exe",
            "C:\\Python311\\python.exe",
            "C:\\Python310\\python.exe",
            "C:\\Python39\\python.exe",
            path.join(userHome, "AppData\\Local\\Programs\\Python\\Python314\\python.exe"),
            path.join(userHome, "AppData\\Local\\Programs\\Python\\Python313\\python.exe"),
            path.join(userHome, "AppData\\Local\\Programs\\Python\\Python312\\python.exe"),
            path.join(userHome, "AppData\\Local\\Programs\\Python\\Python311\\python.exe"),
            path.join(userHome, "AppData\\Local\\Programs\\Python\\Python310\\python.exe"),
            "C:\\Program Files\\Python314\\python.exe",
            "C:\\Program Files\\Python313\\python.exe",
            "C:\\Program Files\\Python312\\python.exe",
            "C:\\Program Files\\Python311\\python.exe",
            "C:\\Program Files\\Python310\\python.exe"
        ];

        for (var i = 0; i < candidates.length; i++) {
            if (fs.existsSync(candidates[i])) {
                return candidates[i];
            }
        }

        try {
            var cp = require("child_process");
            var out = cp.execSync("where python", { encoding: "utf8" });
            if (out) {
                var firstLine = out.trim().split(/[\r\n]+/)[0];
                if (firstLine && fs.existsSync(firstLine)) {
                    return firstLine;
                }
            }
        } catch(e) {}

        return "python";
    },

    checkStatus: function(callback) {
        if (typeof require === "undefined") {
            callback({
                python: true,
                python_version: "3.10",
                pytorch: true,
                pytorch_version: "2.1",
                cuda_available: false,
                whisper_pkg: true,
                ffmpeg: true,
                cache_ready: true,
                cache_dir: "~/.cache/whisper",
                installed_models: ["base", "medium"],
                models_detailed: [
                    { key: "tiny", name: "Tiny", size: "75 MB", desc: "Fastest execution, lower accuracy.", installed: false },
                    { key: "base", name: "Base", size: "145 MB", desc: "Fast and standard accuracy. Recommended.", installed: true },
                    { key: "small", name: "Small", size: "480 MB", desc: "Balanced speed and accuracy.", installed: false },
                    { key: "medium", name: "Medium", size: "1.5 GB", desc: "High accuracy.", installed: true },
                    { key: "large-v3", name: "Large-v3", size: "3.0 GB", desc: "Maximum accuracy.", installed: false }
                ]
            });
            return;
        }

        var cp = require("child_process");
        var path = require("path");
        
        var baseDir = this.getExtensionPath();
        var pythonExe = this.getPythonExecutable();
        var pyScript = path.join(baseDir, "backend", "dependency_checker.py");
        var cmd = `"${pythonExe}" "${pyScript}" --action status --base_dir "${baseDir}"`;

        cp.exec(cmd, { cwd: baseDir }, function(err, stdout, stderr) {
            if (err) {
                console.error("Dependency check error:", err);
                callback({ ffmpeg: true, installed_models: [], models_detailed: [] });
                return;
            }
            try {
                var data = JSON.parse(stdout);
                callback(data);
            } catch(e) {
                console.error("Dependency JSON parse error:", e, stdout);
                callback({ ffmpeg: true, installed_models: [], models_detailed: [] });
            }
        });
    },

    installModel: function(modelName, onProgress, onComplete) {
        this.installSelected([modelName], onProgress, onComplete);
    },

    installSelected: function(models, onProgress, onComplete) {
        if (typeof require === "undefined") {
            onProgress(100, "Installer running in preview mode...");
            setTimeout(onComplete, 1000);
            return;
        }

        var cp = require("child_process");
        var path = require("path");
        
        var baseDir = this.getExtensionPath();
        var pythonExe = this.getPythonExecutable();
        var pyScript = path.join(baseDir, "backend", "dependency_checker.py");
        var args = [pyScript, "--action", "install", "--base_dir", baseDir, "--models"].concat(models);

        try {
            this.currentProc = cp.spawn(pythonExe, args, { cwd: baseDir });
        } catch(spawnErr) {
            onProgress(0, "Error launching Python installer: " + (spawnErr.message || spawnErr));
            if (onComplete) onComplete(spawnErr);
            return;
        }

        var self = this;

        this.currentProc.on("error", function(err) {
            console.error("Installer process error:", err);
            onProgress(0, "Process Error: " + (err.message || err.toString()));
            if (onComplete) onComplete(err);
        });

        this.currentProc.stdout.on("data", function(data) {
            var lines = data.toString().split("\n");
            lines.forEach(function(line) {
                line = line.trim();
                if (line.startsWith("PROGRESS:")) {
                    var parts = line.split(":");
                    var pct = parseInt(parts[1], 10);
                    var msg = parts.slice(2).join(":");
                    onProgress(pct, msg);
                }
            });
        });

        this.currentProc.stderr.on("data", function(data) {
            console.warn("Installer stderr:", data.toString());
        });

        this.currentProc.on("close", function(code) {
            self.currentProc = null;
            if (code === 0) {
                onProgress(100, "Installation completed successfully!");
                if (onComplete) setTimeout(function() { onComplete(null, true); }, 500);
            } else if (code === null) {
                onProgress(0, "Download cancelled by user.");
                if (onComplete) onComplete("Cancelled");
            } else {
                onProgress(0, "Download failed (code " + code + "). Check python output.");
                if (onComplete) onComplete("Failed with code " + code);
            }
        });
    },

    cancelDownload: function() {
        if (this.currentProc) {
            try {
                this.currentProc.kill();
            } catch(e) {
                console.error("Error cancelling process:", e);
            }
            this.currentProc = null;
        }
    },

    deleteModel: function(modelName, callback) {
        if (typeof require === "undefined") {
            if (callback) callback(true);
            return;
        }

        var cp = require("child_process");
        var path = require("path");

        var baseDir = this.getExtensionPath();
        var pythonExe = this.getPythonExecutable();
        var pyScript = path.join(baseDir, "backend", "dependency_checker.py");
        var cmd = `"${pythonExe}" "${pyScript}" --action delete --base_dir "${baseDir}" --models "${modelName}"`;

        cp.exec(cmd, { cwd: baseDir }, function(err, stdout, stderr) {
            if (err) {
                if (callback) callback(false);
                return;
            }
            try {
                var res = JSON.parse(stdout);
                if (callback) callback(res.success);
            } catch(e) {
                if (callback) callback(false);
            }
        });
    }
};
