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
            return "ERR|Could not read the active composition. Make sure a composition is open.";
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

        return "ERR|No audio or video clip found on the timeline. Please add a clip first.";
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
    var clean = tStr.replace(/^\s+|\s+$/g, "").replace(",", ".");
    var parts = clean.split(":");
    if (parts.length === 3) {
        var h = parseFloat(parts[0]);
        var m = parseFloat(parts[1]);
        var s = parseFloat(parts[2]);
        return (h * 3600) + (m * 60) + s;
    }
    return 0;
}

function removeExistingSubtitleLayers(targetComp) {
    if (!targetComp) return;
    for (var i = targetComp.numLayers; i >= 1; i--) {
        var l = targetComp.layer(i);
        if (l && l.comment === "CGP_SUBTITLE") {
            l.remove();
        }
    }
}

$._PPP_.importSubtitles = function(srtPath, jsonPath, importMethod, replaceExisting) {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "ERR|Could not read the active composition. Make sure a composition is open.";
        }

        var comp = app.project.activeItem;
        var srtFile = new File(srtPath);
        if (!srtFile.exists) {
            return "ERR|Subtitle file missing. Please try transcribing again.";
        }

        srtFile.open("r");
        var content = srtFile.read();
        srtFile.close();

        var cues = parseSRTText(content);
        if (cues.length === 0) {
            return "ERR|No subtitles found in file.";
        }

        app.beginUndoGroup("Create Subtitles - Caption Generator Pro");

        var targetComp = comp;
        var isPrecomp = (importMethod === "precomp");

        if (isPrecomp) {
            if (replaceExisting) {
                for (var p = comp.numLayers; p >= 1; p--) {
                    var pl = comp.layer(p);
                    if (pl && pl.name === "Subtitles Precomp") {
                        pl.remove();
                    }
                }
            }

            var precompItem = app.project.items.addComp("Subtitles Precomp", comp.width, comp.height, comp.pixelAspect, comp.duration, comp.frameRate);
            comp.layers.add(precompItem);
            targetComp = precompItem;
        } else {
            if (replaceExisting) {
                removeExistingSubtitleLayers(targetComp);
            }
        }

        var compWidth = targetComp.width;
        var compHeight = targetComp.height;

        for (var i = 0; i < cues.length; i++) {
            var cue = cues[i];
            var txt = cue.text;

            var textLayer = targetComp.layers.addText(txt);
            textLayer.comment = "CGP_SUBTITLE";
            textLayer.name = txt;

            textLayer.inPoint = cue.start;
            textLayer.outPoint = cue.end;

            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;

            textDocument.fontSize = compHeight * 0.045;
            textDocument.fillColor = [1, 1, 1];
            textDocument.applyFill = true;
            textDocument.strokeColor = [0, 0, 0];
            textDocument.strokeWidth = compHeight * 0.004;
            textDocument.applyStroke = true;
            textDocument.font = "Arial-BoldMT";
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;

            textProp.setValue(textDocument);

            var bounds = textLayer.sourceRectAtTime(cue.start, false);
            var anchorX = bounds.left + bounds.width / 2;
            var anchorY = bounds.top + bounds.height / 2;

            textLayer.property("Anchor Point").setValue([anchorX, anchorY]);
            textLayer.property("Position").setValue([compWidth / 2, compHeight * 0.85]);
        }

        app.endUndoGroup();

        return "OK|Subtitles created successfully in active comp!|Count:" + cues.length;
    } catch (e) {
        return "ERR|" + e.toString();
    }
};
