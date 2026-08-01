// Caption Generator Pro - After Effects Host Script
if (typeof $._PPP_ === "undefined") {
    $._PPP_ = {};
}
if (typeof $._AE_ === "undefined") {
    $._AE_ = $._PPP_;
}

$._PPP_.testConnection = function() {
    return "OK|After Effects Host ready";
};

$._PPP_.getProjectDetails = function() {
    try {
        var name = "UntitledAEProject";
        var path = "";
        if (app && app.project) {
            if (app.project.file) {
                path = app.project.file.parent.fsName.replace(/\\/g, "/");
                name = app.project.file.name.replace(/\.[^\.]+$/, "");
            }
        }
        var compName = "NoActiveComp";
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            compName = app.project.activeItem.name;
        }
        return "OK|" + name + "|" + path + "|" + compName;
    } catch (e) {
        return "OK|UntitledAEProject||";
    }
};

$._PPP_.exportAudio = function() {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "ERR|No active composition found. Please select an active composition in After Effects.";
        }

        var comp = app.project.activeItem;
        var mediaPath = "";

        // Scan composition layers for audio
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer && layer.hasAudio && layer.audioEnabled && layer.enabled) {
                if (layer.source && layer.source.file) {
                    var f = layer.source.file;
                    if (f && f.exists) {
                        mediaPath = f.fsName;
                        break;
                    }
                }
            }
        }

        // Secondary scan: check any video layer with source file if no audio-only track was enabled
        if (mediaPath === "") {
            for (var j = 1; j <= comp.numLayers; j++) {
                var vLayer = comp.layer(j);
                if (vLayer && vLayer.enabled && vLayer.source && vLayer.source.file) {
                    var vf = vLayer.source.file;
                    if (vf && vf.exists) {
                        mediaPath = vf.fsName;
                        break;
                    }
                }
            }
        }

        if (mediaPath !== "") {
            return "OK|" + mediaPath.replace(/\\/g, "/");
        }

        return "ERR|No active footage with audio found in comp '" + comp.name + "'.";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};

function parseSRTText(srtStr) {
    var cues = [];
    if (!srtStr) return cues;
    var cleanStr = srtStr.replace(/\r\n/g, "\n");
    var blocks = cleanStr.split("\n\n");
    for (var b = 0; b < blocks.length; b++) {
        var block = blocks[b];
        var lines = block.split("\n");
        if (lines.length >= 3) {
            var timeLine = lines[1];
            var parts = timeLine.split("-->");
            if (parts.length === 2) {
                var sSec = parseSrtTime(parts[0]);
                var eSec = parseSrtTime(parts[1]);
                var txt = lines.slice(2).join("\n").replace(/^\s+|\s+$/g, "");
                cues.push({ start: sSec, end: eSec, text: txt });
            }
        }
    }
    return cues;
}

function parseSrtTime(tStr) {
    if (!tStr) return 0;
    var trimmed = tStr.replace(/^\s+|\s+$/g, "").replace(",", ".");
    var parts = trimmed.split(":");
    if (parts.length === 3) {
        var h = parseFloat(parts[0]) || 0;
        var m = parseFloat(parts[1]) || 0;
        var s = parseFloat(parts[2]) || 0;
        return (h * 3600) + (m * 60) + s;
    }
    return 0;
}

$._PPP_.hasExistingSubtitles = function() {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "NO";
        }
        var comp = app.project.activeItem;
        for (var i = 1; i <= comp.numLayers; i++) {
            var ly = comp.layer(i);
            if (ly && (ly.comment === "CGP_SUBTITLE" || ly.name === "Captions_PreComp" || ly.name.indexOf("Sub_") === 0)) {
                return "YES";
            }
        }
        return "NO";
    } catch (e) {
        return "NO";
    }
};

$._PPP_.importSubtitles = function(srtPath, jsonPath, importMethod, replaceExisting) {
    try {
        if (!app.project) {
            return "ERR|No project open in After Effects.";
        }

        var mainComp = app.project.activeItem;
        if (!mainComp || !(mainComp instanceof CompItem)) {
            return "ERR|Please select an active Composition in After Effects timeline panel before creating subtitles.";
        }

        var cues = [];

        // Try reading JSON file first
        var targetFile = new File(jsonPath);
        if (!targetFile.exists) {
            targetFile = new File(srtPath);
        }

        if (!targetFile.exists) {
            return "ERR|Subtitle file not found at: " + srtPath;
        }

        targetFile.open("r");
        var rawText = targetFile.read();
        targetFile.close();

        if (!rawText || rawText.length === 0) {
            return "ERR|Subtitle file is empty.";
        }

        if (rawText.indexOf("[") !== -1 && rawText.indexOf("{") !== -1) {
            try {
                cues = eval("(" + rawText + ")");
            } catch (e) {}
        }

        if (!cues || cues.length === 0) {
            cues = parseSRTText(rawText);
        }

        if (!cues || cues.length === 0) {
            return "ERR|No subtitle cues could be parsed from file.";
        }

        app.beginUndoGroup("Import Subtitles to AE");

        var targetComp = mainComp;
        var isPreComp = (importMethod === "precomp");

        // Remove existing subtitle layers if replaceExisting is requested
        var doReplace = (replaceExisting === true || replaceExisting === "true" || replaceExisting === 1 || replaceExisting === "1");
        if (doReplace) {
            for (var l = mainComp.numLayers; l >= 1; l--) {
                var oldLy = mainComp.layer(l);
                if (oldLy && (oldLy.comment === "CGP_SUBTITLE" || oldLy.name === "Captions_PreComp" || oldLy.name.indexOf("Sub_") === 0)) {
                    try { oldLy.remove(); } catch(remErr) {}
                }
            }
        }

        if (isPreComp) {
            var preName = "Captions_PreComp";
            targetComp = app.project.items.addComp(
                preName,
                mainComp.width,
                mainComp.height,
                mainComp.pixelAspect,
                mainComp.duration,
                mainComp.frameRate
            );
        }

        var compWidth = targetComp.width;
        var compHeight = targetComp.height;
        var createdCount = 0;

        for (var i = 0; i < cues.length; i++) {
            var cue = cues[i];
            var txt = cue.text;
            if (!txt || txt.length === 0) continue;

            var startSec = parseFloat(cue.start) || 0;
            var endSec = parseFloat(cue.end) || (startSec + 2.0);

            // Create Native Vector Text Layer (Double-clickable & fully editable)
            var textLayer = targetComp.layers.addText(txt);
            textLayer.name = txt; // Name set exactly to text content
            textLayer.comment = "CGP_SUBTITLE"; // Tag for future replacement check

            textLayer.inPoint = startSec;
            textLayer.outPoint = endSec;

            // Apply Text Formatting via Source Text FIRST
            try {
                var sourceTextProp = textLayer.property("Source Text");
                if (sourceTextProp) {
                    var textDoc = sourceTextProp.value;
                    textDoc.text = txt;
                    textDoc.fontSize = Math.round(compHeight * 0.045); // Scale font size relative to comp height
                    textDoc.fillColor = [1, 1, 1]; // White text
                    textDoc.applyFill = true;
                    textDoc.strokeColor = [0, 0, 0]; // Black outline
                    textDoc.applyStroke = true;
                    textDoc.strokeWidth = Math.max(2, Math.round(textDoc.fontSize * 0.06));
                    textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
                    sourceTextProp.setValue(textDoc);
                }
            } catch (styleErr) {}

            // Perfect Center Bounding Box & Anchor Point Alignment
            try {
                var rect = textLayer.sourceRectAtTime(startSec, false);
                if (rect && rect.width > 0) {
                    var anchorX = rect.left + (rect.width / 2);
                    var anchorY = rect.top + (rect.height / 2);
                    var anchorProp = textLayer.property("ADBE Transform Group").property("ADBE Anchor Point");
                    if (anchorProp) {
                        anchorProp.setValue([anchorX, anchorY]);
                    }
                }
            } catch (rectErr) {}

            // Position at horizontal center (50% compWidth), 85% compHeight
            var posProp = textLayer.property("ADBE Transform Group").property("ADBE Position");
            if (posProp) {
                posProp.setValue([compWidth / 2, compHeight * 0.85]);
            }

            createdCount++;
        }

        if (isPreComp) {
            // Add preComp into mainComp timeline
            var preLayer = mainComp.layers.add(targetComp);
            preLayer.name = "Captions_PreComp";
            preLayer.comment = "CGP_SUBTITLE";
        }

        app.endUndoGroup();

        var locationStr = isPreComp ? "in pre-comp 'Captions_PreComp'" : "directly in active comp '" + mainComp.name + "'";
        return "OK|Successfully created " + createdCount + " perfectly centered text layers " + locationStr + "!";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};

$._PPP_.setPlayhead = function(seconds) {
    try {
        var secNum = parseFloat(seconds) || 0;
        if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
            app.project.activeItem.time = secNum;
            return "OK|Playhead moved to " + secNum + "s";
        }
        return "ERR|No active composition";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};
