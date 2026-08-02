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

function hexToRgb(hex) {
    if (!hex) return [1, 1, 1];
    var c = hex.replace("#", "");
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return [1, 1, 1];
    var r = parseInt(c.substring(0, 2), 16) / 255.0;
    var g = parseInt(c.substring(2, 4), 16) / 255.0;
    var b = parseInt(c.substring(4, 6), 16) / 255.0;
    return [r, g, b];
}

function padNum(n) {
    return n < 10 ? "00" + n : (n < 100 ? "0" + n : "" + n);
}

$._PPP_.importStyledSubtitles = function(jsonPath, importMethod, replaceExisting) {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "ERR|Could not read the active composition. Make sure a composition is open in After Effects.";
        }

        var comp = app.project.activeItem;
        var jsonFile = new File(jsonPath);
        if (!jsonFile.exists) {
            return "ERR|Styled subtitle payload file missing on disk.";
        }

        jsonFile.open("r");
        var content = jsonFile.read();
        jsonFile.close();

        var payload = null;
        try {
            payload = eval("(" + content + ")");
        } catch(eJson) {
            return "ERR|Failed to parse styled subtitle JSON: " + eJson.toString();
        }

        if (!payload) return "ERR|Empty styled subtitle payload.";

        var style = payload.style || {};
        var captions = payload.captions || [];
        var words = payload.words || [];

        var isPrecomp = (importMethod === "precomp");
        app.beginUndoGroup("Create Styled Subtitles - Caption Generator Pro");

        var targetComp = comp;
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
                for (var r = targetComp.numLayers; r >= 1; r--) {
                    var rl = targetComp.layer(r);
                    if (rl && rl.name && rl.name.indexOf("CGP_Caption_") === 0) {
                        rl.remove();
                    }
                }
            }
        }

        var compWidth = targetComp.width;
        var compHeight = targetComp.height;

        // Choose items (words if kinetic/karaoke and words exist; otherwise captions)
        var items = [];
        if ((style.mode === "kinetic" || style.mode === "karaoke") && words && words.length > 0) {
            for (var w = 0; w < words.length; w++) {
                items.push({
                    text: words[w].word,
                    start: words[w].start,
                    end: words[w].end
                });
            }
        } else {
            for (var c = 0; c < captions.length; c++) {
                items.push({
                    text: captions[c].text,
                    start: captions[c].start,
                    end: captions[c].end
                });
            }
        }

        if (items.length === 0) {
            app.endUndoGroup();
            return "ERR|No caption or word items available to generate text layers.";
        }

        var primaryRgb = hexToRgb(style.primaryColor || "#FFFFFF");
        var highlightRgb = hexToRgb(style.highlightColor || "#FFD700");
        var isCenter = (style.position === "center");
        var baseFontSize = (style.fontSize ? (compHeight * (style.fontSize / 550.0)) : compHeight * 0.05);

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var txt = item.text;

            var textLayer = targetComp.layers.addText(txt);
            textLayer.comment = "CGP_SUBTITLE";
            textLayer.name = "CGP_Caption_" + padNum(i + 1);

            textLayer.inPoint = item.start;
            textLayer.outPoint = item.end;

            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;

            textDocument.fontSize = baseFontSize;
            textDocument.fillColor = (style.mode === "karaoke" ? highlightRgb : primaryRgb);
            textDocument.applyFill = true;
            textDocument.strokeColor = [0, 0, 0];
            textDocument.strokeWidth = compHeight * 0.004;
            textDocument.applyStroke = true;
            textDocument.font = "Arial-BoldMT";
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;

            textProp.setValue(textDocument);

            var bounds = textLayer.sourceRectAtTime(item.start, false);
            var anchorX = bounds.left + bounds.width / 2;
            var anchorY = bounds.top + bounds.height / 2;

            textLayer.property("Anchor Point").setValue([anchorX, anchorY]);
            var posY = isCenter ? (compHeight / 2) : (compHeight * 0.85);
            textLayer.property("Position").setValue([compWidth / 2, posY]);

            // Apply Animations
            var anim = style.animation || "none";
            if (style.id === "hormozi" || anim === "pop") {
                var scaleProp = textLayer.property("Scale");
                scaleProp.setValueAtTime(item.start, [0, 0]);
                scaleProp.setValueAtTime(item.start + 0.08, [125, 125]);
                scaleProp.setValueAtTime(item.start + 0.15, [100, 100]);
            } else if (style.id === "karaoke" || anim === "highlight") {
                var scaleK = textLayer.property("Scale");
                scaleK.setValueAtTime(item.start, [100, 100]);
                scaleK.setValueAtTime(item.start + 0.06, [118, 118]);
                scaleK.setValueAtTime(item.start + 0.14, [100, 100]);
            } else if (style.id === "clean_pro" || anim === "fade") {
                var opacClean = textLayer.property("Opacity");
                opacClean.setValueAtTime(item.start, 0);
                opacClean.setValueAtTime(item.start + 0.15, 100);
                opacClean.setValueAtTime(item.end - 0.15, 100);
                opacClean.setValueAtTime(item.end, 0);
            } else if (style.id === "podcast") {
                var opacPod = textLayer.property("Opacity");
                opacPod.setValueAtTime(item.start, 0);
                opacPod.setValueAtTime(item.start + 0.25, 100);
                opacPod.setValueAtTime(item.end - 0.25, 100);
                opacPod.setValueAtTime(item.end, 0);

                var scalePod = textLayer.property("Scale");
                scalePod.setValueAtTime(item.start, [94, 94]);
                scalePod.setValueAtTime(item.start + 0.3, [100, 100]);
            }
        }

        app.endUndoGroup();

        return "OK|Created " + items.length + " styled text layers in active comp (" + (style.name || style.id) + ")!|Count:" + items.length;

    } catch (e) {
        return "ERR|" + e.toString();
    }
};
