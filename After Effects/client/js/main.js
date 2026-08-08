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

// Comprehensive Whisper-supported Language Lists
var WHISPER_LANGUAGES_SOURCE = [
    { code: "auto", name: "Auto (Detect Automatically)" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "hi", name: "Hindi" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "ar", name: "Arabic" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ru", name: "Russian" },
    { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" },
    { code: "tr", name: "Turkish" },
    { code: "pl", name: "Polish" },
    { code: "uk", name: "Ukrainian" },
    { code: "sv", name: "Swedish" },
    { code: "vi", name: "Vietnamese" },
    { code: "id", name: "Indonesian" },
    { code: "th", name: "Thai" },
    { code: "bn", name: "Bengali" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "pa", name: "Punjabi" },
    { code: "fa", name: "Persian" },
    { code: "he", name: "Hebrew" },
    { code: "el", name: "Greek" },
    { code: "cs", name: "Czech" },
    { code: "ro", name: "Romanian" },
    { code: "hu", name: "Hungarian" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" },
    { code: "sk", name: "Slovak" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sr", name: "Serbian" },
    { code: "ms", name: "Malay" },
    { code: "ur", name: "Urdu" },
    { code: "sw", name: "Swahili" },
    { code: "af", name: "Afrikaans" },
    { code: "sq", name: "Albanian" },
    { code: "am", name: "Amharic" },
    { code: "hy", name: "Armenian" },
    { code: "az", name: "Azerbaijani" },
    { code: "eu", name: "Basque" },
    { code: "be", name: "Belarusian" },
    { code: "bs", name: "Bosnian" },
    { code: "ca", name: "Catalan" },
    { code: "et", name: "Estonian" },
    { code: "gl", name: "Galician" },
    { code: "ka", name: "Georgian" },
    { code: "is", name: "Icelandic" },
    { code: "kk", name: "Kazakh" },
    { code: "km", name: "Khmer" },
    { code: "lo", name: "Lao" },
    { code: "lat", name: "Latin" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "mk", name: "Macedonian" },
    { code: "mg", name: "Malagasy" },
    { code: "mt", name: "Maltese" },
    { code: "mi", name: "Maori" },
    { code: "mn", name: "Mongolian" },
    { code: "ne", name: "Nepali" },
    { code: "ps", name: "Pashto" },
    { code: "si", name: "Sinhala" },
    { code: "sl", name: "Slovenian" },
    { code: "so", name: "Somali" },
    { code: "tl", name: "Tagalog" },
    { code: "tg", name: "Tajik" },
    { code: "uz", name: "Uzbek" },
    { code: "cy", name: "Welsh" },
    { code: "yi", name: "Yiddish" }
];

var WHISPER_LANGUAGES_TARGET = [
    { code: "none", name: "None (Original Language)" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "hi", name: "Hindi" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "ar", name: "Arabic" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ru", name: "Russian" },
    { code: "it", name: "Italian" },
    { code: "nl", name: "Dutch" },
    { code: "tr", name: "Turkish" },
    { code: "pl", name: "Polish" },
    { code: "uk", name: "Ukrainian" },
    { code: "sv", name: "Swedish" },
    { code: "vi", name: "Vietnamese" },
    { code: "id", name: "Indonesian" },
    { code: "th", name: "Thai" },
    { code: "bn", name: "Bengali" },
    { code: "mr", name: "Marathi" },
    { code: "gu", name: "Gujarati" },
    { code: "kn", name: "Kannada" },
    { code: "ml", name: "Malayalam" },
    { code: "pa", name: "Punjabi" },
    { code: "fa", name: "Persian" },
    { code: "he", name: "Hebrew" },
    { code: "el", name: "Greek" },
    { code: "cs", name: "Czech" },
    { code: "ro", name: "Romanian" },
    { code: "hu", name: "Hungarian" },
    { code: "da", name: "Danish" },
    { code: "fi", name: "Finnish" },
    { code: "no", name: "Norwegian" },
    { code: "sk", name: "Slovak" },
    { code: "bg", name: "Bulgarian" },
    { code: "hr", name: "Croatian" },
    { code: "sr", name: "Serbian" },
    { code: "ms", name: "Malay" },
    { code: "ur", name: "Urdu" },
    { code: "sw", name: "Swahili" }
];

var SearchableSelect = {
    init: function(containerId, optionsList, onChangeCallback) {
        var container = document.getElementById(containerId);
        if (!container) return null;

        var inputDisplay = container.querySelector(".search-select-input");
        var hiddenVal = container.querySelector("input[type='hidden']");
        var dropdown = container.querySelector(".search-select-dropdown");
        var filterInput = container.querySelector(".search-select-filter");
        var optionsContainer = container.querySelector(".search-select-options");

        function renderOptions(filterText) {
            optionsContainer.innerHTML = "";
            var query = (filterText || "").toLowerCase().trim();
            var matches = 0;
            var currentVal = hiddenVal.value;

            optionsList.forEach(function(opt) {
                if (!query || opt.name.toLowerCase().indexOf(query) !== -1 || opt.code.toLowerCase().indexOf(query) !== -1) {
                    matches++;
                    var item = document.createElement("div");
                    item.className = "search-select-item" + (opt.code === currentVal ? " selected" : "");
                    item.innerText = opt.name;
                    item.addEventListener("click", function(e) {
                        e.stopPropagation();
                        setValue(opt.code, opt.name);
                        closeDropdown();
                        if (onChangeCallback) onChangeCallback(opt.code);
                    });
                    optionsContainer.appendChild(item);
                }
            });

            if (matches === 0) {
                var noMatch = document.createElement("div");
                noMatch.className = "search-select-empty";
                noMatch.innerText = "No language found";
                optionsContainer.appendChild(noMatch);
            }
        }

        function setValue(code, name) {
            hiddenVal.value = code;
            if (!name) {
                var found = optionsList.find(function(o) { return o.code === code; });
                inputDisplay.value = found ? found.name : code;
            } else {
                inputDisplay.value = name;
            }
        }

        function openDropdown() {
            document.querySelectorAll(".search-select-dropdown").forEach(function(d) {
                d.style.display = "none";
            });
            dropdown.style.display = "block";
            filterInput.value = "";
            renderOptions("");
            setTimeout(function() { filterInput.focus(); }, 50);
        }

        function closeDropdown() {
            dropdown.style.display = "none";
        }

        inputDisplay.addEventListener("click", function(e) {
            e.stopPropagation();
            if (dropdown.style.display === "block") {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        filterInput.addEventListener("input", function() {
            renderOptions(filterInput.value);
        });

        filterInput.addEventListener("click", function(e) {
            e.stopPropagation();
        });

        document.addEventListener("click", function() {
            closeDropdown();
        });

        return {
            getValue: function() { return hiddenVal.value; },
            setValue: setValue
        };
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
        wordsPerLayer: "full",
        aePreset: "pop_in",
        aeTargeting: "cgp_all",
        position: "bottom",
        align: "center",
        fontSize: 24,
        textColor: "#FFFFFF",
        highlightColor: "#FFD700",
        enableStroke: true,
        strokeColor: "#000000"
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

        // AE Stylize tab options
        var sPreset = document.getElementById("selectAEPreset");
        if (sPreset) prefs.aePreset = sPreset.value;
        var sFit = document.getElementById("selectKeyframeFit");
        if (sFit) prefs.keyframeFit = sFit.value;
        var sTgt = document.getElementById("selectAETargeting");
        if (sTgt) prefs.aeTargeting = sTgt.value;
        var sPos = document.getElementById("selectPosition");
        if (sPos) prefs.position = sPos.value;
        var sAlign = document.getElementById("selectAlign");
        if (sAlign) prefs.align = sAlign.value;
        var sFSize = document.getElementById("sliderStylizeFontSize");
        if (sFSize) prefs.fontSize = parseInt(sFSize.value, 10);
        var cText = document.getElementById("colorText");
        if (cText) prefs.textColor = cText.value;
        var cHl = document.getElementById("colorHighlight");
        if (cHl) prefs.highlightColor = cHl.value;
        var chkStr = document.getElementById("chkStroke");
        if (chkStr) prefs.enableStroke = chkStr.checked;
        var cStr = document.getElementById("colorStroke");
        if (cStr) prefs.strokeColor = cStr.value;

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
        if (window.SourceLangSelect) {
            window.SourceLangSelect.setValue(prefs.sourceLang || "auto");
        } else {
            var selSrc = document.getElementById("selectSourceLang");
            if (selSrc) selSrc.value = prefs.sourceLang || "auto";
        }
        if (window.TargetLangSelect) {
            window.TargetLangSelect.setValue(prefs.targetLang || "none");
        } else {
            var selTgt = document.getElementById("selectTargetLang");
            if (selTgt) selTgt.value = prefs.targetLang || "none";
        }
        var chkVer = document.getElementById("chkVersioning");
        if (chkVer) chkVer.checked = prefs.versioning !== false;
        var selHw = document.getElementById("selectHardware");
        if (selHw) selHw.value = prefs.hardware || "cuda";

        // AE Stylize tab preferences restore
        if (window.PresetSelect) {
            window.PresetSelect.setValue(prefs.aePreset || "pop_in");
        } else {
            var sPreset = document.getElementById("selectAEPreset");
            if (sPreset) sPreset.value = prefs.aePreset || "pop_in";
        }
        var sFit = document.getElementById("selectKeyframeFit");
        if (sFit) sFit.value = prefs.keyframeFit || "fit_duration";
        var sTgt = document.getElementById("selectAETargeting");
        if (sTgt) sTgt.value = prefs.aeTargeting || "cgp_all";
        var sPos = document.getElementById("selectPosition");
        if (sPos) {
            sPos.value = prefs.position || "bottom";
            updateIconToggleActiveState("groupPosition", sPos.value);
        }
        var sAlign = document.getElementById("selectAlign");
        if (sAlign) {
            sAlign.value = prefs.align || "center";
            updateIconToggleActiveState("groupAlign", sAlign.value);
        }

        updateStylizeSummary();
    },

    autoSave: function() {
        var self = this;
        this.save(this.gather());
        updateStylizeSummary();
    }
};

function setupIconToggleGroups() {
    var groups = ["groupPosition", "groupAlign"];
    groups.forEach(function(groupId) {
        var group = document.getElementById(groupId);
        if (!group) return;
        var targetId = groupId === "groupPosition" ? "selectPosition" : "selectAlign";
        var inputEl = document.getElementById(targetId);

        var btns = group.querySelectorAll(".icon-toggle-btn");
        btns.forEach(function(btn) {
            btn.addEventListener("click", function(e) {
                e.preventDefault();
                btns.forEach(function(b) { b.classList.remove("active"); });
                btn.classList.add("active");
                var val = btn.getAttribute("data-val");
                if (inputEl) {
                    inputEl.value = val;
                    UserPreferences.autoSave();
                }
            });
        });
    });
}

function updateIconToggleActiveState(groupId, targetValue) {
    var group = document.getElementById(groupId);
    if (!group) return;
    var btns = group.querySelectorAll(".icon-toggle-btn");
    btns.forEach(function(btn) {
        if (btn.getAttribute("data-val") === targetValue) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function getNodeUserPresets() {
    var presets = [];
    if (typeof require === "undefined") return presets;
    try {
        var fs = require("fs");
        var path = require("path");
        var os = require("os");

        var userHome = os.homedir();
        var searchRoots = [
            path.join(userHome, "Documents", "Adobe"),
            path.join(userHome, "OneDrive", "Documents", "Adobe"),
            path.join(userHome, "Documents"),
            path.join(process.env.APPDATA || "", "Adobe"),
            "C:\\Program Files\\Adobe"
        ];

        function scanFfxNode(dir, depth) {
            if (!dir || depth > 6 || !fs.existsSync(dir)) return;
            try {
                var entries = fs.readdirSync(dir, { withFileTypes: true });
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        scanFfxNode(fullPath, depth + 1);
                    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".ffx")) {
                        var cleanName = entry.name.replace(/\.ffx$/i, "");
                        presets.push({
                            name: cleanName,
                            path: fullPath.replace(/\\/g, "/")
                        });
                    }
                }
            } catch(e) {}
        }

        searchRoots.forEach(function(root) {
            if (fs.existsSync(root)) {
                scanFfxNode(root, 0);
            }
        });
    } catch(eNode) {}

    return presets;
}

var BUILTIN_PRESETS = [
    { code: "pop_in", name: "Pop In (Scale Pulse)" },
    { code: "clean_fade", name: "Clean Fade (Opacity In/Out)" },
    { code: "karaoke_highlight", name: "Karaoke Highlight (Glow & Scale)" },
    { code: "lower_third_soft", name: "Lower Third Soft (Subtle Scale & Fade)" },
    { code: "word_kinetic", name: "Word by Word Kinetic (Rapid Pop)" }
];

function loadAndRenderUserPresets() {
    var allPresets = getNodeUserPresets();

    var renderPresets = function(combinedList) {
        var uniqueUserPresets = [];
        var seen = {};
        (combinedList || []).forEach(function(p) {
            if (p && p.path) {
                var key = p.path.toLowerCase();
                if (!seen[key]) {
                    seen[key] = true;
                    uniqueUserPresets.push({
                        code: "ffx:" + p.path,
                        name: "⭐ " + p.name
                    });
                }
            }
        });

        var fullOptionsList = uniqueUserPresets.concat(BUILTIN_PRESETS);

        window.PresetSelect = SearchableSelect.init("containerAEPreset", fullOptionsList, function(val) {
            UserPreferences.autoSave();
        });

        var savedPreset = UserPreferences.load().aePreset || "pop_in";
        if (window.PresetSelect) {
            window.PresetSelect.setValue(savedPreset);
        } else {
            var hiddenEl = document.getElementById("selectAEPreset");
            if (hiddenEl) hiddenEl.value = savedPreset;
        }

        updateStylizeSummary();
    };

    if (typeof ExtendScriptBridge !== "undefined" && ExtendScriptBridge.scanUserPresets) {
        ExtendScriptBridge.scanUserPresets(function(jsxPresets) {
            var merged = allPresets.concat(jsxPresets || []);
            renderPresets(merged);
        });
    } else {
        renderPresets(allPresets);
    }
}

function updateStylizeSummary() {
    var summaryEl = document.getElementById("stylizeSummary");
    if (!summaryEl) return;
    var prefs = UserPreferences.gather();
    
    var prMap = { "pop_in": "Pop In", "clean_fade": "Clean Fade", "karaoke_highlight": "Karaoke Glow", "lower_third_soft": "Lower Third", "word_kinetic": "Word Kinetic" };
    var tgtMap = { "cgp_all": "All CGP Layers", "selected": "Selected Layers", "comp_all": "All Text Layers" };
    
    var presetDisplay = prefs.aePreset || "Pop In";
    if (presetDisplay.indexOf("ffx:") === 0) {
        var parts = presetDisplay.split("/");
        presetDisplay = "⭐ " + parts[parts.length - 1].replace(/\.ffx$/i, "");
    } else {
        presetDisplay = prMap[presetDisplay] || presetDisplay;
    }

    var txt = "Preset: " + presetDisplay +
              " | Target: " + (tgtMap[prefs.aeTargeting] || "All CGP Layers") +
              " | Position: " + (prefs.position || "bottom") +
              " | Align: " + (prefs.align || "center");
    summaryEl.innerText = txt;
}

// Main Application Panel Controller
document.addEventListener("DOMContentLoaded", function() {
    // 0. Initialize Searchable Comboboxes for Languages
    window.SourceLangSelect = SearchableSelect.init("containerSourceLang", WHISPER_LANGUAGES_SOURCE, function() {
        UserPreferences.autoSave();
    });

    window.TargetLangSelect = SearchableSelect.init("containerTargetLang", WHISPER_LANGUAGES_TARGET, function() {
        UserPreferences.autoSave();
    });

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

    // Setup icon toggle button groups and scan user presets
    setupIconToggleGroups();
    loadAndRenderUserPresets();

    var btnRefresh = document.getElementById("btnRefreshPresets");
    if (btnRefresh) {
        btnRefresh.addEventListener("click", function(e) {
            e.preventDefault();
            loadAndRenderUserPresets();
        });
    }

    var selectFit = document.getElementById("selectKeyframeFit");
    if (selectFit) {
        selectFit.addEventListener("change", function() { UserPreferences.autoSave(); });
    }

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

    // Auto-save on model, radio, and checkbox changes
    var selectModel = document.getElementById("selectModel");
    if (selectModel) selectModel.addEventListener("change", function() { UserPreferences.autoSave(); });

    // Stylize controls change listeners
    var sFontSize = document.getElementById("sliderStylizeFontSize");
    var lblFontSize = document.getElementById("lblStylizeFontSizeVal");
    if (sFontSize && lblFontSize) {
        sFontSize.addEventListener("input", function() {
            lblFontSize.innerText = sFontSize.value + "px";
            UserPreferences.autoSave();
        });
    }

    var stylizeControlIds = [
        "selectWordsPerLayer", "selectAEPreset", "selectAETargeting", "selectPosition", "selectAlign",
        "colorText", "colorHighlight", "chkStroke", "colorStroke"
    ];
    stylizeControlIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", function() { UserPreferences.autoSave(); });
            if (el.tagName === "INPUT" && el.type === "color") {
                el.addEventListener("input", function() { UserPreferences.autoSave(); });
            }
        }
    });

    var radios = document.querySelectorAll('input[name="lineMode"]');
    radios.forEach(function(r) { r.addEventListener("change", function() { UserPreferences.autoSave(); }); });

    var chkIds = ["chkRemoveFillers", "chkVersioning", "chkRemoveOldSubtitles"];
    chkIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("change", function() { UserPreferences.autoSave(); });
    });

    // 4. Initialize Sub-Managers
    SubtitleEditor.init();
    SettingsManager.init();

    // 5. UI Buttons
    var btnTranscribe = document.getElementById("btnTranscribe");
    var btnCancelTranscribe = document.getElementById("btnCancelTranscribe");
    var btnApplyEdits = document.getElementById("btnApplyEdits");
    var btnApplyStylized = document.getElementById("btnApplyStylized");
    var btnGenLayers = document.getElementById("btnGenerateCaptionLayers");
    var btnPresetSel = document.getElementById("btnApplyPresetSelected");
    var btnPresetAllCGP = document.getElementById("btnApplyPresetAllCGP");
    var btnExportSRT = document.getElementById("btnExportSRT");
    var btnModalCancel = document.getElementById("btnModalCancel");
    var btnModalClose = document.getElementById("btnModalClose");

    if (btnCancelTranscribe) {
        btnCancelTranscribe.addEventListener("click", function() {
            cancelTranscribeWorkflow();
        });
    }

    if (btnApplyStylized) {
        btnApplyStylized.addEventListener("click", function() {
            applyStylizedCaptionsFromTab();
        });
    }

    if (btnGenLayers) {
        btnGenLayers.addEventListener("click", function() {
            applyStylizedCaptionsFromTab();
        });
    }

    var btnApplyAlign = document.getElementById("btnApplyAlignment");

    if (btnPresetSel) {
        btnPresetSel.addEventListener("click", function() {
            applyPresetToAELayers("selected");
        });
    }

    if (btnApplyAlign) {
        btnApplyAlign.addEventListener("click", function() {
            applyAlignmentToAELayers();
        });
    }

    if (btnTranscribe) {
        btnTranscribe.addEventListener("click", function() {
            runTranscribeWorkflow();
        });
    }

    if (btnApplyEdits) {
        btnApplyEdits.addEventListener("click", function() {
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

var activePythonProcess = null;
var isTranscriptionCancelled = false;

function cancelTranscribeWorkflow() {
    isTranscriptionCancelled = true;
    if (activePythonProcess) {
        try {
            var pid = activePythonProcess.pid;
            if (process.platform === "win32") {
                var cp = require("child_process");
                cp.exec("taskkill /F /T /PID " + pid, function () {});
            } else {
                activePythonProcess.kill("SIGKILL");
            }
        } catch (e) {
            console.warn("Error killing Python process:", e);
        }
        activePythonProcess = null;
    }

    var btn = document.getElementById("btnTranscribe");
    var btnCancel = document.getElementById("btnCancelTranscribe");
    if (btn) {
        btn.disabled = false;
        btn.innerText = "Transcribe Active Comp";
    }
    if (btnCancel) {
        btnCancel.style.display = "none";
    }
    showAlertModal("Transcription Cancelled", "Transcription cancelled by user.");
}

function runTranscribeWorkflow() {
    ensureLicensedAction("transcribe", function() {
        var btn = document.getElementById("btnTranscribe");
        var btnCancel = document.getElementById("btnCancelTranscribe");
        if (!btn || btn.disabled) return;

        isTranscriptionCancelled = false;
        var originalText = "Transcribe Active Comp";
        btn.disabled = true;
        btn.innerText = "Processing...";
        if (btnCancel) btnCancel.style.display = "inline-block";

        var proceedWithAudioPath = function(audioPath, exportStart, projectDetails) {
            if (isTranscriptionCancelled) return;
            btn.innerText = "Transcribing Speech AI...";
            runPythonBackend(audioPath, projectDetails, function(backendRes) {
                if (btnCancel) btnCancel.style.display = "none";
                if (isTranscriptionCancelled) return;

                if (!backendRes || !backendRes.success) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    var rawErr = (backendRes && backendRes.error) ? backendRes.error : "Unknown backend engine error";
                    console.error("Transcription Engine Technical Log:", rawErr);
                    if (backendRes && backendRes.stderr) console.error("Backend Stderr:", backendRes.stderr);
                    if (backendRes && backendRes.stdout) console.error("Backend Stdout:", backendRes.stdout);

                    if (rawErr.toLowerCase().indexOf("model") !== -1 && rawErr.toLowerCase().indexOf("not found") !== -1) {
                        showAlertModal("Model Required", "Whisper model is missing. Please download it from the Settings tab.\n\nTechnical log:\n" + rawErr);
                    } else {
                        showAlertModal("Transcription Error", "Transcription failed.\n\nTechnical details:\n" + rawErr);
                    }
                    return;
                }

                btn.disabled = false;
                btn.innerText = "Done!";
                setTimeout(function () {
                    btn.innerText = originalText;
                }, 1800);

                // Apply composition export start offset so timestamps match exact comp timeline time
                var offset = parseFloat(exportStart) || 0;
                var finalCaptions = backendRes.captions || [];
                var finalWords = backendRes.words || [];

                if (offset > 0) {
                    finalCaptions = finalCaptions.map(function (c) {
                        return Object.assign({}, c, {
                            start: Math.round((c.start + offset) * 1000) / 1000,
                            end: Math.round((c.end + offset) * 1000) / 1000
                        });
                    });
                    finalWords = finalWords.map(function (w) {
                        return Object.assign({}, w, {
                            start: Math.round((w.start + offset) * 1000) / 1000,
                            end: Math.round((w.end + offset) * 1000) / 1000
                        });
                    });
                }

                // Load Cues and Word Timestamps directly into Subtitle Editor for user review & editing
                SubtitleEditor.loadCaptions(finalCaptions, finalWords);

                if (backendRes.warning) {
                    showAlertModal("Translation Warning", backendRes.warning);
                }

                // Switch to Editor Tab so user can edit before pushing to sequence
                var tabEditor = document.querySelector('.tab-btn[data-tab="tab-editor"]');
                if (tabEditor) tabEditor.click();
            });
        };

        ExtendScriptBridge.getProjectDetails(function (projectDetails) {
            if (isTranscriptionCancelled) return;
            var tempAudioPath = getTempAudioPath();

            ExtendScriptBridge.exportAudio(tempAudioPath, function (exportRes) {
                if (isTranscriptionCancelled) return;

                if (!exportRes || !exportRes.success) {
                    btn.disabled = false;
                    btn.innerText = originalText;
                    if (btnCancel) btnCancel.style.display = "none";
                    var rawErr = (exportRes && exportRes.error) ? exportRes.error : "No comp media found";
                    console.warn("Active Comp Audio Export Technical Log:", rawErr);

                    if (rawErr.toLowerCase().indexOf("could not read") !== -1 || rawErr.toLowerCase().indexOf("active composition") !== -1) {
                        showAlertModal("Active Composition Required", rawErr);
                    } else {
                        showAlertModal("Composition Audio Layer Required", rawErr);
                    }
                    return;
                }

                console.log("[CGP] Manifest Path received from host:", exportRes.audioPath);
                if (typeof require !== "undefined") {
                    var fs = require("fs");
                    if (fs.existsSync(exportRes.audioPath)) {
                        var stat = fs.statSync(exportRes.audioPath);
                        console.log("[CGP] Manifest file size:", stat.size, "bytes");
                        if (stat.size > 0) {
                            try {
                                var sample = fs.readFileSync(exportRes.audioPath, "utf-8").substring(0, 100);
                                console.log("[CGP] Manifest content preview:", sample);
                            } catch(eRead) {}
                        } else {
                            console.error("[CGP] Manifest file is 0 bytes at:", exportRes.audioPath);
                        }
                    } else {
                        console.error("[CGP] Manifest file missing at:", exportRes.audioPath);
                    }
                }

                proceedWithAudioPath(exportRes.audioPath, exportRes.exportStart || 0, projectDetails);
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
                    { start: 0.5, end: 3.0, text: "Welcome to Caption Generator Pro for After Effects." },
                    { start: 3.2, end: 6.0, text: "Edit your subtitle cues here before creating layers in comp." }
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

    var proc = cp.spawn(pythonExe, args, {
        cwd: baseDir,
        env: Object.assign({}, process.env, {
            PYTHONIOENCODING: "utf-8",
            PYTHONUTF8: "1"
        })
    });
    activePythonProcess = proc;
    var stdoutData = "";
    var stderrData = "";

    proc.stdout.on("data", function (data) {
        if (isTranscriptionCancelled) return;
        stdoutData += data.toString();
    });

    proc.stderr.on("data", function (data) {
        if (isTranscriptionCancelled) return;
        var str = data.toString();
        stderrData += str;
        console.warn("Backend log:", str);
    });

    proc.on("close", function (code) {
        activePythonProcess = null;
        if (isTranscriptionCancelled) {
            console.log("[CGP] Process closed after user cancellation.");
            return;
        }

        var parsed = null;
        try {
            var jsonMatch = stdoutData.match(/---RESULT_JSON_START---\s*([\s\S]*?)\s*---RESULT_JSON_END---/);
            if (jsonMatch && jsonMatch[1]) {
                parsed = JSON.parse(jsonMatch[1]);
            }
        } catch (e) {
            console.error("JSON parse error:", e);
        }

        if (code === 0 && parsed && parsed.success) {
            callback(parsed);
            return;
        }

        var errDetails = (parsed && parsed.error) ? parsed.error : (stderrData.trim() || stdoutData.trim() || ("Engine process exited with code " + code));
        console.error("Backend Technical Error Details:", errDetails);
        callback({ success: false, error: errDetails, stdout: stdoutData, stderr: stderrData });
    });
}

function showConfirmModal(title, message, onYes, onNo) {
    var modal = document.getElementById("confirmModal");
    var lblTitle = document.getElementById("confirmModalTitle");
    var lblBody = document.getElementById("confirmModalBody");
    var btnYes = document.getElementById("btnConfirmYes");
    var btnNo = document.getElementById("btnConfirmNo");
    var btnClose = document.getElementById("btnConfirmClose");

    if (!modal) {
        if (confirm(message)) { if (onYes) onYes(); } else { if (onNo) onNo(); }
        return;
    }

    lblTitle.innerText = title || "Confirm Action";
    lblBody.innerText = message || "";
    modal.style.display = "flex";
    modal.style.zIndex = "99999";

    var cleanup = function() {
        modal.style.display = "none";
        btnYes.onclick = null;
        btnNo.onclick = null;
        btnClose.onclick = null;
    };

    btnYes.onclick = function() {
        cleanup();
        if (onYes) onYes();
    };

    btnNo.onclick = function() {
        cleanup();
        if (onNo) onNo();
    };

    btnClose.onclick = function() {
        cleanup();
        if (onNo) onNo();
    };
}

var importCounter = 1;

function importSubtitlesToSequence() {
    ensureLicensedAction("import", function() {
        var btn = document.getElementById("btnApplyEdits");
        var originalText = "Create Subtitles";

        var captions = SubtitleEditor.captions;
        var words = SubtitleEditor.words || [];
        if (!captions || captions.length === 0) {
            showAlertModal("No Subtitles", "No subtitles available to create. Please transcribe a composition first.");
            return;
        }

        if (!btn || btn.disabled) return;
        btn.disabled = true;
        btn.innerText = "Processing...";

        var methodSelect = document.getElementById("selectImportMethod");
        var importMethod = methodSelect ? methodSelect.value : "direct";

        var chkRemove = document.getElementById("chkRemoveOldSubtitles");
        var replaceExisting = chkRemove ? chkRemove.checked : true;

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

            var srtContent = "";
            captions.forEach(function(cap, i) {
                srtContent += `${i + 1}\n${fmtTime(cap.start, "srt")} --> ${fmtTime(cap.end, "srt")}\n${cap.text}\n\n`;
            });
            fs.writeFileSync(tempSrt, srtContent, "utf-8");
            fs.writeFileSync(tempJson, JSON.stringify(captions, null, 4), "utf-8");

            var handleResult = function(res) {
                btn.disabled = false;
                if (!res || !res.success) {
                    btn.innerText = originalText;
                    var rawErr = (res && res.error) ? res.error : "Unknown error";
                    console.error("Subtitle creation technical error:", rawErr);
                    showAlertModal("Import Notice", "Could not create text layers in composition: " + rawErr);
                    return;
                }

                btn.innerText = "Done!";
                setTimeout(function() {
                    btn.innerText = originalText;
                }, 1800);

                showAlertModal("Subtitles Created", "Subtitles created successfully in your composition (" + styleObj.name + ")!");
            };

            if (currentStyleId === "standard") {
                ExtendScriptBridge.importSubtitles(tempSrt, tempJson, importMethod, replaceExisting, handleResult);
            } else {
                var styledPayload = {
                    style: styleObj,
                    captions: captions,
                    words: words
                };
                fs.writeFileSync(tempStyledJson, JSON.stringify(styledPayload, null, 4), "utf-8");
                ExtendScriptBridge.importStyledSubtitles(tempStyledJson, importMethod, replaceExisting, handleResult);
            }
        } else {
            btn.disabled = false;
            btn.innerText = "Done!";
            setTimeout(function() {
                btn.innerText = originalText;
            }, 1800);
            showAlertModal("Preview Mode", "Subtitles created in active comp (Preview Mode - " + styleObj.name + ").");
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

function applyStylizedCaptionsFromTab() {
    ensureLicensedAction("import", function() {
        var captions = SubtitleEditor.captions || [];
        var words = SubtitleEditor.words || [];

        if (!captions || captions.length === 0) {
            showAlertModal("No Captions Found", "Please transcribe timeline audio first in the Transcribe tab.");
            return;
        }

        var btn = document.getElementById("btnApplyStylized");
        var originalText = "✨ Apply Stylized Captions";
        if (btn) { btn.disabled = true; btn.innerText = "Applying Styles..."; }

        var prefs = UserPreferences.gather();
        var styleConfig = {
            wordsPerLayer: prefs.wordsPerLayer || "full",
            animation: prefs.aePreset || "pop_in",
            position: prefs.position || "bottom",
            align: prefs.align || "center",
            fontSize: parseInt(prefs.fontSize, 10) || 24,
            textColor: prefs.textColor || "#FFFFFF",
            highlightColor: prefs.highlightColor || "#FFD700",
            enableStroke: prefs.enableStroke === true,
            strokeColor: prefs.strokeColor || "#000000",
            applyScope: prefs.applyScope || "all"
        };

        // Filter selected captions if applyScope is 'selected'
        var targetCaptions = captions;
        if (styleConfig.applyScope === "selected" && SubtitleEditor.selectedIndex !== undefined && SubtitleEditor.selectedIndex >= 0) {
            var selCap = captions[SubtitleEditor.selectedIndex];
            if (selCap) targetCaptions = [selCap];
        }

        // Process item chunking if words per layer is 1, 2, or 3
        var fallbackNotice = null;
        var finalItems = [];

        if (styleConfig.wordsPerLayer !== "full") {
            var chunkSize = parseInt(styleConfig.wordsPerLayer, 10) || 1;
            
            // Filter words if applyScope is 'selected'
            var targetWords = words;
            if (styleConfig.applyScope === "selected" && SubtitleEditor.selectedIndex !== undefined && SubtitleEditor.selectedIndex >= 0) {
                var selCue = captions[SubtitleEditor.selectedIndex];
                if (selCue) {
                    targetWords = words.filter(function(w) {
                        if (w.cue_index !== undefined) return w.cue_index === SubtitleEditor.selectedIndex;
                        return w.start >= (selCue.start - 0.05) && w.end <= (selCue.end + 0.05);
                    });
                }
            }

            if (targetWords && targetWords.length > 0) {
                for (var i = 0; i < targetWords.length; i += chunkSize) {
                    var chunk = targetWords.slice(i, i + chunkSize);
                    var chunkText = chunk.map(function(w) { return (w.word || "").toString().trim(); }).join(" ").trim();
                    var cStart = parseFloat(chunk[0].start) || 0;
                    var cEnd = parseFloat(chunk[chunk.length - 1].end) || (cStart + 0.3);
                    if (cEnd <= cStart) cEnd = cStart + 0.2;

                    finalItems.push({
                        text: chunkText,
                        start: Math.round(cStart * 1000) / 1000,
                        end: Math.round(cEnd * 1000) / 1000
                    });
                }
            } else {
                fallbackNotice = "Word-level timestamps missing for selected mode. Falling back to full cue layout.";
                finalItems = targetCaptions.map(function(c) {
                    return { text: c.text, start: c.start, end: c.end };
                });
            }
        } else {
            finalItems = targetCaptions.map(function(c) {
                return { text: c.text, start: c.start, end: c.end };
            });
        }

        var payload = {
            style: styleConfig,
            captions: finalItems,
            words: words
        };

        if (typeof require !== "undefined") {
            var fs = require("fs");
            var path = require("path");
            var tempFolder = getTempFolder();
            var jsonPath = path.join(tempFolder, "cgp_stylize_payload.json");
            fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 4), "utf-8");

            var importMethod = document.getElementById("selectImportMethod") ? document.getElementById("selectImportMethod").value : "individual";
            var removeOld = document.getElementById("chkRemoveOldSubtitles") ? document.getElementById("chkRemoveOldSubtitles").checked : true;

            ExtendScriptBridge.importStyledSubtitles(jsonPath, importMethod, removeOld, function(res) {
                if (btn) { btn.disabled = false; btn.innerText = originalText; }
                if (!res || !res.success) {
                    var err = (res && res.error) ? res.error : "Failed to apply stylized captions.";
                    showAlertModal("Stylize Notice", err);
                } else {
                    if (fallbackNotice) {
                        showAlertModal("Notice", fallbackNotice);
                    } else {
                        showAlertModal("Success", "Stylized captions applied successfully to active comp!");
                    }
                }
            });
        } else {
            if (btn) { btn.disabled = false; btn.innerText = originalText; }
            if (fallbackNotice) {
                showAlertModal("Notice", fallbackNotice);
            } else {
                showAlertModal("Success", "Stylized captions applied (Browser Preview Mode)!");
            }
        }
    });
}

function applyPresetToAELayers(overrideTargetingMode) {
    ensureLicensedAction("import", function() {
        var prefs = UserPreferences.gather();
        var targetingMode = overrideTargetingMode || "selected";
        var preset = prefs.aePreset || "pop_in";
        var selFit = document.getElementById("selectKeyframeFit");
        var keyframeFit = selFit ? selFit.value : (prefs.keyframeFit || "fit_duration");

        var payload = {
            preset: preset,
            keyframeFit: keyframeFit,
            targetingMode: targetingMode
        };

        if (typeof require !== "undefined") {
            var fs = require("fs");
            var path = require("path");
            var tempFolder = getTempFolder();
            var jsonPath = path.join(tempFolder, "cgp_preset_payload.json");
            fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 4), "utf-8");

            ExtendScriptBridge.applyPresetToLayers(jsonPath, function(res) {
                if (!res || !res.success) {
                    var err = (res && res.error) ? res.error : "Failed to apply preset to layers.";
                    showAlertModal("Preset Notice", err);
                } else {
                    showAlertModal("Success", res.message || "Applied preset successfully!");
                }
            });
        } else {
            showAlertModal("Success", "Applied preset '" + preset + "' to " + targetingMode + " (Browser Preview Mode)!");
        }
    });
}

function applyAlignmentToAELayers() {
    ensureLicensedAction("import", function() {
        var prefs = UserPreferences.gather();
        var styleConfig = {
            position: prefs.position || "bottom",
            align: prefs.align || "center"
        };

        var payload = {
            style: styleConfig
        };

        if (typeof require !== "undefined") {
            var fs = require("fs");
            var path = require("path");
            var tempFolder = getTempFolder();
            var jsonPath = path.join(tempFolder, "cgp_align_payload.json");
            fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 4), "utf-8");

            ExtendScriptBridge.applyAlignmentToLayers(jsonPath, function(res) {
                if (!res || !res.success) {
                    var err = (res && res.error) ? res.error : "Failed to apply alignment to layers.";
                    showAlertModal("Alignment Notice", err);
                } else {
                    showAlertModal("Success", res.message || "Applied alignment successfully!");
                }
            });
        } else {
            showAlertModal("Success", "Applied alignment (Browser Preview Mode)!");
        }
    });
}
