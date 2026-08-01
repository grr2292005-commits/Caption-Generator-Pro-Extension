var ExtendScriptBridge = {
    csInterface: new CSInterface(),
    hostLoaded: false,

    loadHost: function(callback) {
        if (this.hostLoaded) {
            if (callback) callback(true);
            return;
        }

        var extPath = this.csInterface.getSystemPath(SystemPath.EXTENSION);
        var jsxPath = (extPath + "/host/index.jsx").replace(/\\/g, "/");

        // Use $.evalFile with proper escaping
        var loadCmd = 'try { $.evalFile("' + jsxPath + '"); typeof $._PPP_ !== "undefined" ? "OK" : "MISSING"; } catch(e) { "ERROR:" + e.toString(); }';

        var self = this;
        this.csInterface.evalScript(loadCmd, function(result) {
            if (result === "OK") {
                self.hostLoaded = true;
                if (callback) callback(true);
            } else {
                if (callback) callback(false, "Load failed: " + result + " | Path: " + jsxPath);
            }
        });
    },

    exportAudio: function(targetPath, callback) {
        if (typeof targetPath === "function") {
            callback = targetPath;
        }

        this.loadHost(function(ok, err) {
            if (!ok) {
                callback({ success: false, error: "Host script failed to load: " + (err || "unknown error") });
                return;
            }

            ExtendScriptBridge.csInterface.evalScript("$._PPP_.exportAudio()", function(result) {
                if (!result || result === "EvalScript error.") {
                    callback({ success: false, error: "ExtendScript evaluation failed. Result: " + result });
                    return;
                }
                if (result.indexOf("OK|") === 0) {
                    callback({ success: true, audioPath: result.substring(3) });
                } else if (result.indexOf("ERR|") === 0) {
                    callback({ success: false, error: result.substring(4) });
                } else {
                    callback({ success: false, error: result });
                }
            });
        });
    },

    getProjectDetails: function(callback) {
        this.loadHost(function(ok, err) {
            if (!ok) {
                callback({ name: "UntitledProject", path: "", error: err });
                return;
            }
            ExtendScriptBridge.csInterface.evalScript("$._PPP_.getProjectDetails()", function(result) {
                var name = "UntitledProject", path = "";
                if (result && result.indexOf("OK|") === 0) {
                    var parts = result.split("|");
                    name = parts[1] || name;
                    path = parts[2] || "";
                }
                callback({ name: name, path: path });
            });
        });
    },

    hasExistingSubtitles: function(callback) {
        this.loadHost(function(ok) {
            if (!ok) {
                callback(false);
                return;
            }
            ExtendScriptBridge.csInterface.evalScript("$._PPP_.hasExistingSubtitles()", function(result) {
                callback(result === "YES");
            });
        });
    },

    importSubtitles: function(srtPath, jsonPath, importMethod, replaceExisting, callback) {
        var cleanSrt = srtPath.replace(/\\/g, "/");
        var cleanJson = (jsonPath || "").replace(/\\/g, "/");
        var method = importMethod || "direct";
        var replace = (replaceExisting === true) ? "true" : "false";

        this.loadHost(function(ok, err) {
            if (!ok) {
                callback({ success: false, error: err });
                return;
            }
            var script = "$._PPP_.importSubtitles('" + cleanSrt + "', '" + cleanJson + "', '" + method + "', " + replace + ")";
            ExtendScriptBridge.csInterface.evalScript(script, function(result) {
                if (result && result.indexOf("OK|") === 0) {
                    callback({ success: true, message: result.substring(3) });
                } else if (result && result.indexOf("ERR|") === 0) {
                    callback({ success: false, error: result.substring(4) });
                } else {
                    callback({ success: false, error: result || "Import failed" });
                }
            });
        });
    },

    setPlayhead: function(seconds, callback) {
        var sec = parseFloat(seconds) || 0;
        this.loadHost(function(ok) {
            if (!ok) {
                if (callback) callback({ success: false });
                return;
            }
            ExtendScriptBridge.csInterface.evalScript("$._PPP_.setPlayhead(" + sec + ")", function(result) {
                if (callback) callback({ success: result && result.indexOf("OK|") === 0 });
            });
        });
    },

    testEvalScript: function(callback) {
        this.csInterface.evalScript('1+1', function(result) {
            if (callback) callback("1+1 result: " + result);
        });
    }
};


