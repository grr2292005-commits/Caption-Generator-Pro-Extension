// Caption Styles Data Model & Presets
var CaptionStyles = {
    presets: {
        standard: {
            id: "standard",
            name: "Standard (Default)",
            description: "Clean classic subtitle layout",
            mode: "standard",
            fontSize: 24,
            primaryColor: "#FFFFFF",
            highlightColor: "#FFD700",
            position: "bottom",
            animation: "none"
        },
        clean_pro: {
            id: "clean_pro",
            name: "Clean Professional",
            description: "Modern minimalist lower-third captions",
            mode: "standard",
            fontSize: 26,
            primaryColor: "#FFFFFF",
            highlightColor: "#00E5FF",
            position: "bottom",
            animation: "none"
        },
        hormozi: {
            id: "hormozi",
            name: "Hormozi Pop",
            description: "Bold energetic centered text with pop animations",
            mode: "kinetic",
            fontSize: 32,
            primaryColor: "#FFFF00",
            highlightColor: "#FF0055",
            position: "center",
            animation: "pop"
        },
        karaoke: {
            id: "karaoke",
            name: "Karaoke Highlight",
            description: "Word-by-word active highlight glow",
            mode: "karaoke",
            fontSize: 28,
            primaryColor: "#FFFFFF",
            highlightColor: "#00FF66",
            position: "center",
            animation: "highlight"
        },
        podcast: {
            id: "podcast",
            name: "Podcast Soft",
            description: "Soft elegant subtitle layout for longform audio",
            mode: "standard",
            fontSize: 22,
            primaryColor: "#E0E0E0",
            highlightColor: "#BB86FC",
            position: "bottom",
            animation: "none"
        }
    },

    getStyle: function(id) {
        return this.presets[id] || this.presets.standard;
    }
};

// User Preferences Persistence (localStorage)
var UserPreferences = {
    STORAGE_KEY: "cgp_user_prefs",

    defaults: {
        model: "base",
        maxChars: 37,
        maxDur: 30,
        gapFrames: 0,
        lineMode: "double",
        removeFillers: true,
        sourceLang: "auto",
        targetLang: "none",
        versioning: true,
        hardware: "cuda",
        captionStyle: "standard"
    },

    load: function() {
        try {
            var stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return Object.assign({}, this.defaults, JSON.parse(stored));
            }
        } catch(e) {}
        return Object.assign({}, this.defaults);
    },

    save: function(prefs) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
        } catch(e) {}
    },

    gather: function() {
        var prefs = {};
        var sel = document.getElementById("selectModel");
        if (sel) prefs.model = sel.value;
        var sChars = document.getElementById("sliderMaxChars");
        if (sChars) prefs.maxChars = parseInt(sChars.value, 10);
        var sDur = document.getElementById("sliderMaxDur");
        if (sDur) prefs.maxDur = parseInt(sDur.value, 10);
        var sGap = document.getElementById("sliderGapFrames");
        if (sGap) prefs.gapFrames = parseInt(sGap.value, 10);
        var radios = document.querySelectorAll('input[name="lineMode"]');
        radios.forEach(function(r) { if (r.checked) prefs.lineMode = r.value; });
        var chkFill = document.getElementById("chkRemoveFillers");
        if (chkFill) prefs.removeFillers = chkFill.checked;
        var selSrc = document.getElementById("selectSourceLang");
        if (selSrc) prefs.sourceLang = selSrc.value;
        var selTgt = document.getElementById("selectTargetLang");
        if (selTgt) prefs.targetLang = selTgt.value;
        var chkVer = document.getElementById("chkVersioning");
        if (chkVer) prefs.versioning = chkVer.checked;
        var selHw = document.getElementById("selectHardware");
        if (selHw) prefs.hardware = selHw.value;
        var selStyle = document.getElementById("selectCaptionStyle");
        if (selStyle) prefs.captionStyle = selStyle.value;
        return prefs;
    },

    restore: function(prefs) {
        var sel = document.getElementById("selectModel");
        if (sel) sel.value = prefs.model || this.defaults.model;
        var sChars = document.getElementById("sliderMaxChars");
        var lblChars = document.getElementById("lblMaxCharsVal");
        if (sChars) { sChars.value = prefs.maxChars; if (lblChars) lblChars.innerText = prefs.maxChars; }
        var sDur = document.getElementById("sliderMaxDur");
        var lblDur = document.getElementById("lblMaxDurVal");
        if (sDur) { sDur.value = prefs.maxDur; if (lblDur) lblDur.innerText = (prefs.maxDur / 10.0).toFixed(1) + "s"; }
        var sGap = document.getElementById("sliderGapFrames");
        var lblGap = document.getElementById("lblGapFramesVal");
        if (sGap) { sGap.value = prefs.gapFrames; if (lblGap) lblGap.innerText = prefs.gapFrames + " frames"; }
        var radios = document.querySelectorAll('input[name="lineMode"]');
        radios.forEach(function(r) { r.checked = (r.value === (prefs.lineMode || "double")); });
        var chkFill = document.getElementById("chkRemoveFillers");
        if (chkFill) chkFill.checked = prefs.removeFillers !== false;
        var selSrc = document.getElementById("selectSourceLang");
        if (selSrc) selSrc.value = prefs.sourceLang || "auto";
        var selTgt = document.getElementById("selectTargetLang");
        if (selTgt) selTgt.value = prefs.targetLang || "none";
        var chkVer = document.getElementById("chkVersioning");
        if (chkVer) chkVer.checked = prefs.versioning !== false;
        var selHw = document.getElementById("selectHardware");
        if (selHw) selHw.value = prefs.hardware || "cuda";
        var selStyle = document.getElementById("selectCaptionStyle");
        if (selStyle) selStyle.value = prefs.captionStyle || "standard";
    },

    autoSave: function() {
        var self = this;
        this.save(this.gather());
    }
};

// Main Application Panel Controller
document.addEventListener("DOMContentLoaded", function() {
    // 1. Tab Navigation Logic
    var tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(function(tab) {
        tab.addEventListener("click", function() {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            tab.classList.add("active");
            var target = document.getElementById(tab.getAttribute("data-tab"));
            if (target) target.classList.add("active");
        });
    });

    // 2. Restore saved preferences BEFORE setting up listeners
    var savedPrefs = UserPreferences.load();
    UserPreferences.restore(savedPrefs);

    // 3. Transcribe Sliders with auto-save
    var sChars = document.getElementById("sliderMaxChars");
    var lblChars = document.getElementById("lblMaxCharsVal");
    if (sChars && lblChars) {
        sChars.addEventListener("input", function() {
            lblChars.innerText = sChars.value;
            UserPreferences.autoSave();
        });
    }

    var sDur = document.getElementById("sliderMaxDur");
    var lblDur = document.getElementById("lblMaxDurVal");
    if (sDur && lblDur) {
        sDur.addEventListener("input", function() {
            lblDur.innerText = (parseFloat(sDur.value) / 10.0).toFixed(1) + "s";
            UserPreferences.autoSave();
        });
    }

    var sGap = document.getElementById("sliderGapFrames");
    var lblGap = document.getElementById("lblGapFramesVal");
    if (sGap && lblGap) {
        sGap.addEventListener("input", function() {
            lblGap.innerText = sGap.value + " frames";
            UserPreferences.autoSave();
        });
    }

    // Reset Buttons for Sliders (also auto-save)
    var rChars = document.getElementById("resetMaxChars");
    if (rChars && sChars && lblChars) {
        rChars.addEventListener("click", function() {
            sChars.value = 37;
            lblChars.innerText = "37";
            UserPreferences.autoSave();
        });
    }

    var rDur = document.getElementById("resetMaxDur");
    if (rDur && sDur && lblDur) {
        rDur.addEventListener("click", function() {
            sDur.value = 30;
            lblDur.innerText = "3.0s";
            UserPreferences.autoSave();
        });
    }

    var rGap = document.getElementById("resetGapFrames");
    if (rGap && sGap && lblGap) {
        rGap.addEventListener("click", function() {
            sGap.value = 0;
            lblGap.innerText = "0 frames";
            UserPreferences.autoSave();
        });
    }

    // Auto-save on model, style, radio, and checkbox changes
    var selectModel = document.getElementById("selectModel");
    if (selectModel) selectModel.addEventListener("change", function() { UserPreferences.autoSave(); });

    var selectStyle = document.getElementById("selectCaptionStyle");
    if (selectStyle) {
        selectStyle.addEventListener("change", function() {
            UserPreferences.autoSave();
            if (typeof SubtitleEditor !== "undefined" && SubtitleEditor.render) {
                SubtitleEditor.render();
            }
        });
    }

    var selSrc = document.getElementById("selectSourceLang");
    if (selSrc) selSrc.addEventListener("change", function() { UserPreferences.autoSave(); });

    var selTgt = document.getElementById("selectTargetLang");
    if (selTgt) selTgt.addEventListener("change", function() { UserPreferences.autoSave(); });

    var radios = document.querySelectorAll('input[name="lineMode"]');
    radios.forEach(function(r) { r.addEventListener("change", function() { UserPreferences.autoSave(); }); });

    var chkIds = ["chkRemoveFillers", "chkVersioning"];
    chkIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("change", function() { UserPreferences.autoSave(); });
    });

    // 4. Initialize Sub-Managers
    SubtitleEditor.init();
    SettingsManager.init();

    // 5. UI Buttons
    var btnTranscribe = document.getElementById("btnTranscribe");
    var btnApplyEdits = document.getElementById("btnApplyEdits");
    var btnExportSRT = document.getElementById("btnExportSRT");
    var btnModalCancel = document.getElementById("btnModalCancel");
    var btnModalClose = document.getElementById("btnModalClose");

    if (btnTranscribe) {
        btnTranscribe.addEventListener("click", function() {
            runTranscribeWorkflow();
        });
    }

    if (btnApplyEdits) {
        btnApplyEdits.addEventListener("click", function() {
            console.log("[CaptionGeneratorPro] #btnApplyEdits clicked");
            importSubtitlesToSequence();
        });
    }

    if (btnExportSRT) {
        btnExportSRT.addEventListener("click", function() {
            exportSRTFile();
        });
    }

    if (btnModalCancel) {
        btnModalCancel.addEventListener("click", function() {
            DependencyInstaller.cancelDownload();
            document.getElementById("statusLog").innerText = "Download cancelled by user.";
            btnModalCancel.style.display = "none";
            btnModalClose.style.display = "inline-block";
        });
    }

    if (btnModalClose) {
        btnModalClose.addEventListener("click", function() {
            document.getElementById("installerModal").style.display = "none";
        });
    }

    // 6. Silent background dependency check (populates installed model dropdown)
    DependencyInstaller.checkStatus(function(status) {
        if (status && status.installed_models) {
            updateModelDropdown(status.installed_models);
            // Re-apply saved model selection after dropdown is populated
            var savedModel = UserPreferences.load().model;
            var sel = document.getElementById("selectModel");
            if (sel && savedModel) sel.value = savedModel;
        }
    });
});

var ALL_MODELS_ORDER = [
    { key: "tiny", name: "Tiny (75 MB)" },
    { key: "base", name: "Base (145 MB)" },
    { key: "small", name: "Small (480 MB)" },
    { key: "medium", name: "Medium (1.5 GB)" },
    { key: "large-v3", name: "Large-v3 (3.0 GB)" }
];

function updateModelDropdown(installedModels) {
    var select = document.getElementById("selectModel");
    if (!select) return;

    installedModels = installedModels || [];
    var currentVal = select.value || "base";

    select.innerHTML = "";

    ALL_MODELS_ORDER.forEach(function(m) {
        var opt = document.createElement("option");
        opt.value = m.key;
        var isInstalled = installedModels.indexOf(m.key) !== -1;
        opt.innerText = m.name + (isInstalled ? " [Installed]" : "");
        select.appendChild(opt);
    });

    if (installedModels.indexOf(currentVal) !== -1) {
        select.value = currentVal;
    } else if (installedModels.length > 0) {
        select.value = installedModels[0];
    } else {
        select.value = "base";
    }
}

function showInstallerModalForModel(modelKey) {
    var modal = document.getElementById("installerModal");
    var title = document.getElementById("installerModalTitle");
    var statusLog = document.getElementById("statusLog");
    var statusMetrics = document.getElementById("statusMetrics");
    var fill = document.getElementById("progressFill");
    var cancelBtn = document.getElementById("btnModalCancel");
    var closeBtn = document.getElementById("btnModalClose");

    if (!modal) return;

    if (title) title.innerText = "Downloading " + modelKey.toUpperCase() + " Speech Model";
    modal.style.display = "flex";
    fill.style.width = "0%";
    statusLog.innerText = "Connecting to server...";
    if (statusMetrics) {
        statusMetrics.style.display = "none";
        statusMetrics.innerText = "";
    }
    cancelBtn.style.display = "inline-block";
    closeBtn.style.display = "none";

    DependencyInstaller.installModel(modelKey,
        function(percent, msg) {
            fill.style.width = percent + "%";

            if (msg && msg.indexOf(" | Speed:") !== -1) {
                var parts = msg.split(" | ");
                statusLog.innerText = "Downloading file: " + parts[0];
                if (statusMetrics) {
                    statusMetrics.style.display = "block";
                    statusMetrics.innerText = parts[1] + "  |  " + parts[2];
                }
            } else {
                statusLog.innerText = msg;
                if (statusMetrics) statusMetrics.style.display = "none";
            }
        },
        function(err, res) {
            cancelBtn.style.display = "none";
            closeBtn.style.display = "inline-block";
            if (err) {
                statusLog.innerText = "Download error: " + err;
                if (statusMetrics) statusMetrics.style.display = "none";
            } else {
                statusLog.innerText = "Model installed successfully!";
                if (statusMetrics) statusMetrics.style.display = "none";
                fill.style.width = "100%";
                DependencyInstaller.checkStatus(function(status) {
                    if (status && status.installed_models) {
                        updateModelDropdown(status.installed_models);
                    }
                    if (SettingsManager) {
                        SettingsManager.renderModelManager();
                    }
                });
            }
        }
    );
}


function ensureLicensedAction(actionName, callback) {
    if (typeof LicenseManager === "undefined") {
        if (typeof showAlertModal === "function") {
            showAlertModal("License Required", "Please activate your license in the Settings tab.");
        }
        return;
    }

    LicenseManager.validate(function(valid, message) {
        if (valid) {
            callback();
        } else {
            if (typeof showAlertModal === "function") {
                showAlertModal("License Required", "Please activate your license in the Settings tab.");
            }
        }
    });
}

function runTranscribeWorkflow() {
    ensureLicensedAction("transcribe", function() {
        var btn = document.getElementById("btnTranscribe");
        if (!btn || btn.disabled) return;

        var originalText = "Transcribe Timeline";
        btn.disabled = true;
        btn.innerText = "Processing...";

        var proceedWithAudioPath = function(audioPath, projectDetails) {
            btn.innerText = "Transcribing Speech AI...";
            runPythonBackend(audioPath, projectDetails, function(backendRes) {
                if (!backendRes || !backendRes.success) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    var rawErr = (backendRes && backendRes.error) ? backendRes.error : "Unknown backend engine error";
                    console.error("Transcription Engine Technical Log:", rawErr);

                    if (rawErr.toLowerCase().indexOf("model") !== -1 || rawErr.toLowerCase().indexOf("not found") !== -1) {
                        showAlertModal("Model Required", "Whisper model is missing. Please download it from the Settings tab.");
                    } else {
                        showAlertModal("Transcription Notice", "Transcription failed. Please try again or choose a different model.");
                    }
                    return;
                }

                btn.disabled = false;
                btn.innerText = "Done!";
                setTimeout(function() {
                    btn.innerText = originalText;
                }, 1800);

                // Load Cues and Word Timestamps directly into Subtitle Editor for user review & editing
                SubtitleEditor.loadCaptions(backendRes.captions, backendRes.words);

                // Switch to Editor Tab so user can edit before pushing to sequence
                var tabEditor = document.querySelector('.tab-btn[data-tab="tab-editor"]');
                if (tabEditor) tabEditor.click();
            });
        };

        ExtendScriptBridge.getProjectDetails(function(projectDetails) {
            var tempAudioPath = getTempAudioPath();

            ExtendScriptBridge.exportAudio(tempAudioPath, function(exportRes) {
                if (!exportRes || !exportRes.success) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    var rawErr = (exportRes && exportRes.error) ? exportRes.error : "No sequence media found";
                    console.warn("Timeline Audio Export Technical Log:", rawErr);

                    if (rawErr.toLowerCase().indexOf("sequence") !== -1) {
                        showAlertModal("Active Sequence Required", "Could not read the active sequence. Make sure a sequence is open.");
                    } else {
                        showAlertModal("Timeline Clip Required", "No audio or video clip found on the timeline. Please add a clip first.");
                    }
                    return;
                }

                proceedWithAudioPath(exportRes.audioPath, projectDetails);
            });
        });
    });
}

function runPythonBackend(audioPath, projectDetails, callback) {
    if (typeof require === "undefined") {
        // Preview mode mock response
        setTimeout(function() {
            callback({
                success: true,
                files: { srt: "mock.srt", json: "mock.json" },
                captions: [
                    { start: 0.5, end: 3.0, text: "Welcome to Caption Generator Pro." },
                    { start: 3.2, end: 6.0, text: "Edit your subtitle cues here before importing." }
                ]
            });
        }, 1200);
        return;
    }

    var cp = require("child_process");
    var path = require("path");

    var baseDir = DependencyInstaller.getExtensionPath();
    var pythonExe = DependencyInstaller.getPythonExecutable();
    var pyScript = path.join(baseDir, "backend", "engine.py");

    var model = document.getElementById("selectModel").value;
    var removeFillers = document.getElementById("chkRemoveFillers").checked;
    var sourceLangEl = document.getElementById("selectSourceLang");
    var sourceLang = sourceLangEl ? sourceLangEl.value : "auto";
    var targetLangEl = document.getElementById("selectTargetLang");
    var targetLang = targetLangEl ? targetLangEl.value : "none";
    var versioning = document.getElementById("chkVersioning").checked;
    var maxChars = document.getElementById("sliderMaxChars").value;
    var maxDur = (parseFloat(document.getElementById("sliderMaxDur").value) / 10.0).toFixed(1);
    var gapFrames = document.getElementById("sliderGapFrames").value;
    var lineModeRadio = document.querySelector('input[name="lineMode"]:checked');
    var lineMode = lineModeRadio ? lineModeRadio.value : "double";
    var hardware = SettingsManager.settings ? SettingsManager.settings.hardware : "cuda";

    var args = [
        pyScript,
        "--audio", audioPath,
        "--model", model,
        "--device", hardware,
        "--language", sourceLang,
        "--target_language", targetLang,
        "--project_path", projectDetails.path || "",
        "--project_name", projectDetails.name || "UntitledProject",
        "--max_chars", maxChars.toString(),
        "--max_dur", maxDur.toString(),
        "--gap_frames", gapFrames.toString(),
        "--line_mode", lineMode
    ];

    if (removeFillers) args.push("--remove_fillers");
    if (versioning) args.push("--enable_versioning");

    var proc = cp.spawn(pythonExe, args, { cwd: baseDir });
    var stdoutData = "";

    proc.stdout.on("data", function(data) {
        stdoutData += data.toString();
    });

    proc.stderr.on("data", function(data) {
        console.warn("Backend log:", data.toString());
    });

    proc.on("close", function(code) {
        if (code === 0) {
            try {
                var jsonMatch = stdoutData.match(/---RESULT_JSON_START---\s*([\s\S]*?)\s*---RESULT_JSON_END---/);
                if (jsonMatch && jsonMatch[1]) {
                    var parsed = JSON.parse(jsonMatch[1]);
                    callback(parsed);
                    return;
                }
            } catch(e) {
                console.error("JSON parse error:", e);
            }
        }
        callback({ success: false });
    });
}

var importCounter = 1;

function importSubtitlesToSequence() {
    console.log("[CaptionGeneratorPro] importSubtitlesToSequence() triggered.");

    var captions = SubtitleEditor.captions;
    var words = SubtitleEditor.words || [];
    if (!captions || captions.length === 0) {
        console.warn("[CaptionGeneratorPro] importSubtitlesToSequence: captions list is empty.");
        showAlertModal("No Subtitles", "No subtitles available. Please transcribe first.");
        return;
    }

    ensureLicensedAction("import", function() {
        var btn = document.getElementById("btnApplyEdits");
        var originalText = "Create Subtitles";

        if (btn) {
            btn.disabled = true;
            btn.innerText = "Processing...";
        }

        var currentStyleId = UserPreferences.load().captionStyle || "standard";
        var styleObj = (typeof CaptionStyles !== "undefined") ? CaptionStyles.getStyle(currentStyleId) : { id: "standard", name: "Standard" };

        if (typeof require !== "undefined") {
            var fs = require("fs");
            var path = require("path");

            var now = new Date();
            var pad = function(n) { return n < 10 ? '0' + n : String(n); };
            var timeStr = pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
            
            var filename = "Sub_v" + importCounter + "_" + timeStr;
            importCounter++;

            var tempSrt = path.join(getTempFolder(), filename + ".srt");
            var tempJson = path.join(getTempFolder(), filename + ".json");
            var tempStyledJson = path.join(getTempFolder(), filename + "_styled.json");

            // Write updated SRT
            var srtContent = "";
            captions.forEach(function(cap, i) {
                srtContent += `${i + 1}\n${fmtTime(cap.start, "srt")} --> ${fmtTime(cap.end, "srt")}\n${cap.text}\n\n`;
            });
            fs.writeFileSync(tempSrt, srtContent, "utf-8");

            // Write updated JSON
            fs.writeFileSync(tempJson, JSON.stringify(captions, null, 4), "utf-8");

            var handleResult = function(res) {
                if (btn) btn.disabled = false;
                if (!res || !res.success) {
                    if (btn) btn.innerText = originalText;
                    var rawErr = (res && res.error) ? res.error : "Unknown import error";
                    console.error("Subtitle import technical error:", rawErr);
                    showAlertModal("Import Notice", "Could not create subtitles on the timeline: " + rawErr);
                    return;
                }

                if (btn) {
                    btn.innerText = "Done!";
                    setTimeout(function() {
                        btn.innerText = originalText;
                    }, 1800);
                }

                showAlertModal("Subtitles Created", "Subtitles created successfully on your sequence (" + styleObj.name + ")!");
            };

            if (currentStyleId === "standard") {
                console.log("[CaptionGeneratorPro] Standard mode: Invoking ExtendScriptBridge.importSubtitles with:", tempSrt);
                ExtendScriptBridge.importSubtitles(tempSrt, tempJson, "standard", handleResult);
            } else {
                console.log("[CaptionGeneratorPro] Styled mode (" + currentStyleId + "): Invoking ExtendScriptBridge.importStyledSubtitles");
                var styledPayload = {
                    style: styleObj,
                    captions: captions,
                    words: words
                };
                fs.writeFileSync(tempStyledJson, JSON.stringify(styledPayload, null, 4), "utf-8");
                ExtendScriptBridge.importStyledSubtitles(tempStyledJson, handleResult);
            }
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerText = "Done!";
                setTimeout(function() {
                    btn.innerText = originalText;
                }, 1800);
            }
            showAlertModal("Preview Mode", "Subtitles created on sequence (Preview Mode - " + styleObj.name + ").");
        }
    });
}

function exportSRTFile() {
    ensureLicensedAction("export", function() {
        var captions = SubtitleEditor.captions;
        if (!captions || captions.length === 0) {
            showAlertModal("No Subtitles", "No subtitles available to export.");
            return;
        }

        if (typeof require !== "undefined") {
            var fs = require("fs");
            var path = require("path");
            var os = require("os");
            var desktopPath = path.join(os.homedir(), "Desktop", "captions.srt");

            var srtContent = "";
            captions.forEach(function(cap, i) {
                srtContent += `${i + 1}\n${fmtTime(cap.start, "srt")} --> ${fmtTime(cap.end, "srt")}\n${cap.text}\n\n`;
            });

            try {
                fs.writeFileSync(desktopPath, srtContent, "utf-8");
                showAlertModal("SRT Exported", "Subtitle file (.srt) exported successfully to your Desktop:\n" + desktopPath.replace(/\\/g, "/"));
            } catch(e) {
                var tempPath = path.join(getTempFolder(), "captions.srt");
                fs.writeFileSync(tempPath, srtContent, "utf-8");
                showAlertModal("SRT Exported", "Subtitle file (.srt) exported to:\n" + tempPath.replace(/\\/g, "/"));
            }
        } else {
            showAlertModal("SRT Exported", "Subtitle file (.srt) exported (Preview Mode).");
        }
    });
}

function showAlertModal(title, message) {
    var modal = document.getElementById("alertModal");
    var lblTitle = document.getElementById("alertModalTitle");
    var divBody = document.getElementById("alertModalBody");
    var btnOk = document.getElementById("btnAlertOk");
    var btnClose = document.getElementById("btnAlertClose");

    if (!modal || !lblTitle || !divBody) {
        alert(title + ": " + message);
        return;
    }

    lblTitle.innerText = title || "Notification";

    var lines = (message || "").split("\n");
    var html = "";
    lines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.indexOf("/") !== -1 || trimmed.indexOf("\\") !== -1 || trimmed.indexOf(".srt") !== -1) {
            html += `<div style="background-color: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 4px; padding: 6px 8px; font-family: monospace; font-size: 10px; color: var(--accent-blue); margin-top: 4px; word-break: break-all; user-select: all;">${line.replace(/\\/g, "/")}</div>`;
        } else if (trimmed.length > 0) {
            html += `<div style="margin-bottom: 4px; font-size: 11px;">${line}</div>`;
        }
    });
    divBody.innerHTML = html;

    modal.style.display = "flex";

    var closeModal = function() {
        modal.style.display = "none";
    };

    if (btnOk) btnOk.onclick = closeModal;
    if (btnClose) btnClose.onclick = closeModal;
}

function getTempAudioPath() {
    if (typeof require !== "undefined") {
        var os = require("os");
        var path = require("path");
        return path.join(os.tmpdir(), "cgp_timeline_audio.wav");
    }
    return "cgp_timeline_audio.wav";
}

function getTempFolder() {
    if (typeof require !== "undefined") {
        var os = require("os");
        return os.tmpdir();
    }
    return ".";
}

function fmtTime(seconds, fmt) {
    var sec = parseFloat(seconds) || 0;
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = Math.floor(sec % 60);
    var ms = Math.floor((sec - Math.floor(sec)) * 1000);
    var sep = fmt === "srt" ? "," : ".";

    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}${sep}${ms < 100 ? (ms < 10 ? '00' : '0') : ''}${ms}`;
}
