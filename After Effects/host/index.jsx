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

$._PPP_.exportAudio = function(targetWavPath) {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "ERR|Could not read the active composition. Make sure a composition is open in After Effects.";
        }

        var comp = app.project.activeItem;

        // Determine export range: Work Area if set, else full comp duration
        var exportStart = 0;
        var exportEnd = comp.duration;

        if (comp.workAreaDuration && comp.workAreaDuration > 0 && comp.workAreaDuration < comp.duration) {
            exportStart = parseFloat(comp.workAreaStart) || 0;
            exportEnd = exportStart + parseFloat(comp.workAreaDuration);
        }

        var clipsToProcess = [];
        var minLayerIn = 999999;
        var maxLayerOut = 0;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!layer || !layer.enabled) continue;
            
            // Prioritize layers with source files (audio or video footage)
            if (layer.source && layer.source.file) {
                var f = layer.source.file;
                if (!f || !f.exists) continue;

                var lIn = parseFloat(layer.inPoint) || 0;
                var lOut = parseFloat(layer.outPoint) || 0;
                var lStart = parseFloat(layer.startTime) || 0;

                if (lOut > lIn) {
                    if (lIn < minLayerIn) minLayerIn = lIn;
                    if (lOut > maxLayerOut) maxLayerOut = lOut;

                    clipsToProcess.push({
                        mediaPath: f.fsName.replace(/\\/g, "/"),
                        clipStart: lIn,
                        clipEnd: lOut,
                        startTime: lStart,
                        hasAudio: layer.hasAudio && layer.audioEnabled,
                        clipName: layer.name || ("Layer_" + i),
                        trackIndex: i
                    });
                }
            }
        }

        if (clipsToProcess.length === 0) {
            return "ERR|No valid footage or audio layers found in active composition.";
        }

        // Filter audio layers if audio-enabled layers exist
        var audioClips = [];
        for (var a = 0; a < clipsToProcess.length; a++) {
            if (clipsToProcess[a].hasAudio) audioClips.push(clipsToProcess[a]);
        }
        if (audioClips.length > 0) {
            clipsToProcess = audioClips;
        }

        if (exportEnd <= exportStart) {
            exportStart = minLayerIn < 999999 ? minLayerIn : 0;
            exportEnd = maxLayerOut > 0 ? maxLayerOut : comp.duration;
        }

        var activeManifestClips = [];
        for (var k = 0; k < clipsToProcess.length; k++) {
            var item = clipsToProcess[k];
            if (item.clipEnd > exportStart && item.clipStart < exportEnd) {
                var effStart = Math.max(item.clipStart, exportStart);
                var effEnd = Math.min(item.clipEnd, exportEnd);
                var dur = effEnd - effStart;
                var trimHead = effStart - item.clipStart;

                // Source cut-in formula: (inPoint - startTime) + trimHead
                var mediaCutIn = (item.clipStart - item.startTime) + trimHead;
                var relSeqStart = effStart - exportStart;

                activeManifestClips.push({
                    clipName: item.clipName,
                    trackIndex: item.trackIndex,
                    mediaPath: item.mediaPath,
                    mediaCutIn: Math.max(0, Math.round(mediaCutIn * 1000) / 1000),
                    cutDuration: Math.round(dur * 1000) / 1000,
                    relSeqStart: Math.round(relSeqStart * 1000) / 1000
                });
            }
        }

        if (activeManifestClips.length === 0) {
            return "ERR|No audio layers found within active comp work area.";
        }

        var tempDir = Folder.temp.fsName.replace(/\\/g, "/");
        var manifestPath = tempDir + "/cgp_ae_comp_manifest.json";
        var manifestFile = new File(manifestPath);

        var manifestData = {
            sequenceName: comp.name || "Active Comp",
            exportStart: Math.round(exportStart * 1000) / 1000,
            exportEnd: Math.round(exportEnd * 1000) / 1000,
            duration: Math.round((exportEnd - exportStart) * 1000) / 1000,
            clips: activeManifestClips
        };

        function stringifyJson(obj) {
            if (typeof obj === "string") return '"' + obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r") + '"';
            if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
            if (obj instanceof Array) {
                var arrStr = [];
                for (var a = 0; a < obj.length; a++) arrStr.push(stringifyJson(obj[a]));
                return "[" + arrStr.join(",") + "]";
            }
            if (typeof obj === "object" && obj !== null) {
                var objStr = [];
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        objStr.push('"' + key + '":' + stringifyJson(obj[key]));
                    }
                }
                return "{" + objStr.join(",") + "}";
            }
            return "null";
        }

        manifestFile.encoding = "UTF-8";
        manifestFile.open("w");
        var jsonText = stringifyJson(manifestData);
        manifestFile.write(jsonText);
        manifestFile.close();

        // Verify write on disk
        manifestFile = new File(manifestFile.fsName);
        if (!manifestFile.exists || manifestFile.length === 0) {
            return "ERR|Failed to write comp manifest JSON to disk. File size is 0 bytes.";
        }

        var finalPath = manifestFile.fsName.replace(/\\/g, "/");
        return "OK|" + finalPath + "|" + Math.round(exportStart * 1000) / 1000;
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

        // Prefer payload.captions (which contains pre-chunked items from Stylize tab)
        var items = [];
        if (captions && captions.length > 0) {
            for (var c = 0; c < captions.length; c++) {
                items.push({
                    text: captions[c].text,
                    start: captions[c].start,
                    end: captions[c].end
                });
            }
        } else if (words && words.length > 0) {
            for (var w = 0; w < words.length; w++) {
                items.push({
                    text: words[w].word,
                    start: words[w].start,
                    end: words[w].end
                });
            }
        }

        if (items.length === 0) {
            app.endUndoGroup();
            return "ERR|No caption or word items available to generate text layers.";
        }

        var primaryRgb = hexToRgb(style.textColor || style.primaryColor || "#FFFFFF");
        var highlightRgb = hexToRgb(style.highlightColor || "#FFD700");
        var strokeRgb = hexToRgb(style.strokeColor || "#000000");

        var posVert = style.position || "bottom";
        var alignHoriz = style.align || "center";

        var posY = (posVert === "top") ? (compHeight * 0.15) : ((posVert === "center") ? (compHeight * 0.5) : (compHeight * 0.85));
        var posX = (alignHoriz === "left") ? (compWidth * 0.2) : ((alignHoriz === "right") ? (compWidth * 0.8) : (compWidth * 0.5));

        var baseFontSize = style.fontSize ? (compHeight * (style.fontSize / 550.0)) : (compHeight * 0.05);

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
            textDocument.fillColor = (style.animation === "karaoke" ? highlightRgb : primaryRgb);
            textDocument.applyFill = true;

            if (style.enableStroke !== false) {
                textDocument.strokeColor = strokeRgb;
                textDocument.strokeWidth = compHeight * 0.004;
                textDocument.applyStroke = true;
            } else {
                textDocument.applyStroke = false;
            }

            textDocument.font = "Arial-BoldMT";

            if (alignHoriz === "left") {
                textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
            } else if (alignHoriz === "right") {
                textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
            } else {
                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
            }

            textProp.setValue(textDocument);

            var bounds = textLayer.sourceRectAtTime(item.start, false);
            var anchorX = bounds.left + bounds.width / 2;
            var anchorY = bounds.top + bounds.height / 2;

            textLayer.property("Anchor Point").setValue([anchorX, anchorY]);
            textLayer.property("Position").setValue([posX, posY]);

            // Apply Animations
            var anim = style.animation || "pop_in";
            if (anim === "pop_in" || anim === "pop" || anim === "word_kinetic") {
                var scaleProp = textLayer.property("Scale");
                scaleProp.setValueAtTime(item.start, [0, 0]);
                scaleProp.setValueAtTime(item.start + 0.08, [125, 125]);
                scaleProp.setValueAtTime(item.start + 0.15, [100, 100]);
            } else if (anim === "karaoke_highlight" || anim === "karaoke" || anim === "highlight") {
                var scaleK = textLayer.property("Scale");
                scaleK.setValueAtTime(item.start, [100, 100]);
                scaleK.setValueAtTime(item.start + 0.06, [118, 118]);
                scaleK.setValueAtTime(item.start + 0.14, [100, 100]);
            } else if (anim === "clean_fade" || anim === "fade") {
                var opacClean = textLayer.property("Opacity");
                opacClean.setValueAtTime(item.start, 0);
                opacClean.setValueAtTime(item.start + 0.15, 100);
                opacClean.setValueAtTime(item.end - 0.15, 100);
                opacClean.setValueAtTime(item.end, 0);
            } else if (anim === "lower_third_soft" || anim === "podcast") {
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

        var styleInfo = "Preset: " + (style.animation || "pop_in") + ", Words: " + (style.wordsPerLayer || "full");
        return "OK|Created " + items.length + " styled text layers in active comp (" + styleInfo + ")!|Count:" + items.length;

    } catch (e) {
        return "ERR|" + e.toString();
    }
};

function resetPropKeyframes(prop) {
    if (prop && prop.numKeys > 0) {
        for (var k = prop.numKeys; k >= 1; k--) {
            try { prop.removeKey(k); } catch(eK) {}
        }
    }
}

$._AE_CGP_.applyPresetToLayers = function(jsonPath) {
    try {
        var targetComp = app.project.activeComp;
        if (!targetComp) {
            return "ERR|No active composition found. Please select or open a composition in After Effects.";
        }

        var jsonFile = new File(jsonPath);
        if (!jsonFile.exists) {
            return "ERR|Preset config file missing: " + jsonPath;
        }

        jsonFile.open("r");
        var jsonText = jsonFile.read();
        jsonFile.close();

        var payload = null;
        try {
            payload = eval("(" + jsonText + ")");
        } catch(eJson) {
            return "ERR|Failed to parse preset JSON payload: " + eJson.toString();
        }

        if (!payload) return "ERR|Empty preset payload.";

        var preset = payload.preset || "pop_in";
        var targetingMode = payload.targetingMode || "selected"; // 'selected', 'cgp_all', 'comp_all'
        var style = payload.style || {};

        var targetLayers = [];
        if (targetingMode === "selected") {
            if (targetComp.selectedLayers && targetComp.selectedLayers.length > 0) {
                for (var s = 0; s < targetComp.selectedLayers.length; s++) {
                    if (targetComp.selectedLayers[s] instanceof TextLayer) {
                        targetLayers.push(targetComp.selectedLayers[s]);
                    }
                }
            }
        } else if (targetingMode === "cgp_all") {
            for (var l = 1; l <= targetComp.numLayers; l++) {
                var lyr = targetComp.layer(l);
                if (lyr instanceof TextLayer && (lyr.name.indexOf("CGP_Caption_") === 0 || lyr.comment === "CGP_SUBTITLE")) {
                    targetLayers.push(lyr);
                }
            }
        } else if (targetingMode === "comp_all") {
            for (var l2 = 1; l2 <= targetComp.numLayers; l2++) {
                var lyr2 = targetComp.layer(l2);
                if (lyr2 instanceof TextLayer) {
                    targetLayers.push(lyr2);
                }
            }
        }

        if (targetLayers.length === 0) {
            var targetDesc = targetingMode === "selected" ? "selected layers" : (targetingMode === "cgp_all" ? "CGP caption layers" : "all text layers");
            return "ERR|No text layers found for: " + targetDesc + ". Please select a text layer first.";
        }

        app.beginUndoGroup("CGP Apply Preset To Layers");

        var compWidth = targetComp.width;
        var compHeight = targetComp.height;

        var primaryRgb = hexToRgb(style.textColor || "#FFFFFF");
        var highlightRgb = hexToRgb(style.highlightColor || "#FFD700");
        var strokeRgb = hexToRgb(style.strokeColor || "#000000");

        var posVert = style.position || "bottom";
        var alignHoriz = style.align || "center";

        var posY = (posVert === "top") ? (compHeight * 0.15) : ((posVert === "center") ? (compHeight * 0.5) : (compHeight * 0.85));
        var posX = (alignHoriz === "left") ? (compWidth * 0.2) : ((alignHoriz === "right") ? (compWidth * 0.8) : (compWidth * 0.5));

        var baseFontSize = style.fontSize ? (compHeight * (style.fontSize / 550.0)) : (compHeight * 0.05);

        for (var i = 0; i < targetLayers.length; i++) {
            var textLayer = targetLayers[i];
            var start = textLayer.inPoint;
            var end = textLayer.outPoint;

            var textProp = textLayer.property("Source Text");
            var textDocument = textProp.value;

            textDocument.fontSize = baseFontSize;
            textDocument.fillColor = (preset === "karaoke_highlight" ? highlightRgb : primaryRgb);
            textDocument.applyFill = true;

            if (style.enableStroke !== false) {
                textDocument.strokeColor = strokeRgb;
                textDocument.strokeWidth = compHeight * 0.004;
                textDocument.applyStroke = true;
            } else {
                textDocument.applyStroke = false;
            }

            if (alignHoriz === "left") {
                textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
            } else if (alignHoriz === "right") {
                textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
            } else {
                textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
            }

            textProp.setValue(textDocument);

            var bounds = textLayer.sourceRectAtTime(start, false);
            var anchorX = bounds.left + bounds.width / 2;
            var anchorY = bounds.top + bounds.height / 2;

            textLayer.property("Anchor Point").setValue([anchorX, anchorY]);
            textLayer.property("Position").setValue([posX, posY]);

            // Clear old keyframes on modified properties
            var scaleProp = textLayer.property("Scale");
            var opacProp = textLayer.property("Opacity");
            resetPropKeyframes(scaleProp);
            resetPropKeyframes(opacProp);

            // Apply keyframe animation preset
            if (preset === "pop_in" || preset === "word_kinetic") {
                scaleProp.setValueAtTime(start, [0, 0]);
                scaleProp.setValueAtTime(start + 0.08, [125, 125]);
                scaleProp.setValueAtTime(start + 0.15, [100, 100]);
            } else if (preset === "karaoke_highlight") {
                scaleProp.setValueAtTime(start, [100, 100]);
                scaleProp.setValueAtTime(start + 0.06, [118, 118]);
                scaleProp.setValueAtTime(start + 0.14, [100, 100]);
            } else if (preset === "clean_fade") {
                opacProp.setValueAtTime(start, 0);
                opacProp.setValueAtTime(start + 0.15, 100);
                opacProp.setValueAtTime(end - 0.15, 100);
                opacProp.setValueAtTime(end, 0);
            } else if (preset === "lower_third_soft") {
                opacProp.setValueAtTime(start, 0);
                opacProp.setValueAtTime(start + 0.25, 100);
                opacProp.setValueAtTime(end - 0.25, 100);
                opacProp.setValueAtTime(end, 0);

                scaleProp.setValueAtTime(start, [94, 94]);
                scaleProp.setValueAtTime(start + 0.3, [100, 100]);
            }
        }

        app.endUndoGroup();
        return "OK|Successfully applied preset '" + preset + "' to " + targetLayers.length + " text layers!";
    } catch(e) {
        return "ERR|" + e.toString();
    }
};
