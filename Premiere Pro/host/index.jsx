// Caption Generator Pro - Host Script
if (typeof $._PPP_ === "undefined") {
    $._PPP_ = {};
}

$._PPP_.testConnection = function() {
    return "OK|Host ready";
};

$._PPP_.getProjectDetails = function() {
    try {
        var name = "UntitledProject";
        var path = "";
        if (app && app.project) {
            if (app.project.path && app.project.path.length > 0) {
                var f = new File(app.project.path);
                path = f.parent.fsName.replace(/\\/g, "/");
                name = f.name.replace(/\.[^\.]+$/, "");
            } else if (app.project.file) {
                path = app.project.file.parent.fsName.replace(/\\/g, "/");
                name = app.project.file.name.replace(/\.[^\.]+$/, "");
            }
        }
        return "OK|" + name + "|" + path;
    } catch (e) {
        return "OK|UntitledProject|";
    }
};

$._PPP_.exportAudio = function(targetWavPath) {
    try {
        var seq = null;
        if (app && app.project) {
            if (app.project.activeSequence) {
                seq = app.project.activeSequence;
            } else if (app.project.sequences && app.project.sequences.numSequences > 0) {
                seq = app.project.sequences[0];
            }
        }

        if (!seq) {
            return "ERR|Could not read the active sequence. Make sure a sequence is open.";
        }

        // Determine export range
        var inPoint = 0;
        var outPoint = 0;
        var hasWorkArea = false;

        try {
            var seqIn = seq.getInPoint();
            var seqOut = seq.getOutPoint();
            if (seqIn !== undefined && seqOut !== undefined && parseFloat(seqOut) > parseFloat(seqIn)) {
                inPoint = parseFloat(seqIn);
                outPoint = parseFloat(seqOut);
                hasWorkArea = true;
            }
        } catch(eWork) {}

        // Collect audio and video clips
        var clipsToProcess = [];
        var minClipStart = 999999;
        var maxClipEnd = 0;

        function scanTrackClips(tracks) {
            if (!tracks) return;
            for (var t = 0; t < tracks.numTracks; t++) {
                var track = tracks[t];
                if (!track || !track.clips) continue;
                for (var c = 0; c < track.clips.numItems; c++) {
                    var item = track.clips[c];
                    if (!item || !item.projectItem) continue;
                    var mp = item.projectItem.getMediaPath ? item.projectItem.getMediaPath() : "";
                    if (!mp || mp.length === 0) continue;

                    var f = new File(mp);
                    if (!f.exists) continue;

                    var cStart = item.start ? parseFloat(item.start.seconds) : 0;
                    var cEnd = item.end ? parseFloat(item.end.seconds) : 0;
                    var cIn = item.inPoint ? parseFloat(item.inPoint.seconds) : 0;

                    if (cEnd > cStart) {
                        if (cStart < minClipStart) minClipStart = cStart;
                        if (cEnd > maxClipEnd) maxClipEnd = cEnd;

                        clipsToProcess.push({
                            mediaPath: mp.replace(/\\/g, "/"),
                            clipStart: cStart,
                            clipEnd: cEnd,
                            clipIn: cIn
                        });
                    }
                }
            }
        }

        // Scan audio tracks first, fallback to video tracks if no audio clips found
        scanTrackClips(seq.audioTracks);
        if (clipsToProcess.length === 0) {
            scanTrackClips(seq.videoTracks);
        }

        if (clipsToProcess.length === 0) {
            return "ERR|No valid audio or video clips found in active sequence.";
        }

        var exportStart = hasWorkArea ? inPoint : minClipStart;
        var exportEnd = hasWorkArea ? outPoint : maxClipEnd;
        if (exportEnd <= exportStart) {
            exportStart = minClipStart;
            exportEnd = maxClipEnd;
        }

        // Filter and calculate relative timing for each clip segment in range
        var activeManifestClips = [];
        for (var i = 0; i < clipsToProcess.length; i++) {
            var item = clipsToProcess[i];
            if (item.clipEnd > exportStart && item.clipStart < exportEnd) {
                var effStart = Math.max(item.clipStart, exportStart);
                var effEnd = Math.min(item.clipEnd, exportEnd);
                var dur = effEnd - effStart;
                var trimHead = effStart - item.clipStart;

                var mediaCutIn = item.clipIn + trimHead;
                var relSeqStart = effStart - exportStart;

                activeManifestClips.push({
                    mediaPath: item.mediaPath,
                    mediaCutIn: Math.round(mediaCutIn * 1000) / 1000,
                    cutDuration: Math.round(dur * 1000) / 1000,
                    relSeqStart: Math.round(relSeqStart * 1000) / 1000
                });
            }
        }

        if (activeManifestClips.length === 0) {
            return "ERR|No audio clips found within the sequence in/out range.";
        }

        var tempDir = Folder.temp.fsName.replace(/\\/g, "/");
        var manifestPath = tempDir + "/cgp_sequence_manifest.json";
        var manifestFile = new File(manifestPath);

        var manifestData = {
            sequenceName: seq.name || "Active Sequence",
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
            return "ERR|Failed to write sequence manifest JSON to disk. File size is 0 bytes.";
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

function findProjectItem(bin, searchName, searchPath) {
    if (!bin || !bin.children) return null;
    var cleanPath = searchPath ? searchPath.replace(/\\/g, "/").toLowerCase() : "";
    var cleanName = searchName ? searchName.toLowerCase() : "";

    for (var i = 0; i < bin.children.numItems; i++) {
        var item = bin.children[i];
        if (!item) continue;

        if (item.getMediaPath) {
            var mp = item.getMediaPath();
            if (mp && mp.replace(/\\/g, "/").toLowerCase() === cleanPath) {
                return item;
            }
        }
        if (item.name && item.name.toLowerCase() === cleanName) {
            return item;
        }

        if (item.type === 2 || (item.children && item.children.numItems > 0)) { // 2 = BIN
            var subFound = findProjectItem(item, searchName, searchPath);
            if (subFound) return subFound;
        }
    }
    return null;
}

$._PPP_.importSubtitles = function(srtPath, jsonPath, stylePreset) {
    try {
        // 1. Validate Active Sequence
        var seq = null;
        if (app && app.project) {
            if (app.project.activeSequence) {
                seq = app.project.activeSequence;
            } else if (app.project.sequences && app.project.sequences.numSequences > 0) {
                seq = app.project.sequences[0];
            }
        }

        if (!seq) {
            return "ERR|Could not read the active sequence. Make sure a sequence is open in Premiere Pro.";
        }

        // 2. Validate SRT File Exists
        var srtFile = new File(srtPath);
        if (!srtFile.exists) {
            return "ERR|Subtitle SRT file missing on disk: " + srtPath;
        }

        // 3. Import SRT File into Premiere Pro Project Bin
        var filePaths = [srtFile.fsName];
        var importSuccess = false;
        
        try {
            var targetBin = app.project.getInsertionBin();
            importSuccess = app.project.importFiles(filePaths, true, targetBin, false);
        } catch(e1) {
            try {
                importSuccess = app.project.importFiles(filePaths);
            } catch(e2) {
                importSuccess = false;
            }
        }

        if (!importSuccess) {
            return "ERR|Premiere Pro failed to import the SRT file into Project Panel.";
        }

        // 4. Locate the Imported ProjectItem in Project Panel
        var importedItem = findProjectItem(app.project.rootItem, srtFile.name, srtFile.fsName);
        if (!importedItem) {
            return "ERR|Imported SRT file could not be located in Project Panel.";
        }

        // 5. Add / Insert Subtitle Clip onto Active Sequence Timeline
        var addedToTimeline = false;

        // Try 5A: Premiere Pro Caption Track API (if supported)
        if (typeof seq.createCaptionTrack !== "undefined") {
            try {
                var capTrack = seq.createCaptionTrack(importedItem, 0, 0);
                if (capTrack) addedToTimeline = true;
            } catch(errCap) {}
        }

        // Try 5B: Insert onto top video track
        if (!addedToTimeline && seq.videoTracks && seq.videoTracks.numTracks > 0) {
            try {
                var targetTrack = seq.videoTracks[seq.videoTracks.numTracks - 1];
                if (!targetTrack) targetTrack = seq.videoTracks[0];

                if (targetTrack) {
                    var timePosition = 0;
                    if (typeof seq.getInPoint === "function") {
                        timePosition = seq.getInPoint();
                    }

                    if (typeof targetTrack.insertClip === "function") {
                        targetTrack.insertClip(importedItem, timePosition);
                        addedToTimeline = true;
                    } else if (typeof targetTrack.overwriteClip === "function") {
                        targetTrack.overwriteClip(importedItem, timePosition);
                        addedToTimeline = true;
                    }
                }
            } catch(errVideo) {}
        }

        // Try 5C: Fallback insert onto first video track
        if (!addedToTimeline && seq.videoTracks && seq.videoTracks.numTracks > 0) {
            try {
                var v1 = seq.videoTracks[0];
                if (v1 && typeof v1.insertClip === "function") {
                    v1.insertClip(importedItem, 0);
                    addedToTimeline = true;
                }
            } catch(errV1) {}
        }

        if (!addedToTimeline) {
            return "ERR|SRT file imported into Project Panel, but failed to insert clip onto sequence timeline.";
        }

        return "OK|Subtitles imported into Project Panel and added to active sequence timeline!";

    } catch (e) {
        return "ERR|" + e.toString();
    }
};

$._PPP_.importStyledSubtitles = function(jsonPath) {
    try {
        var seq = null;
        if (app && app.project) {
            if (app.project.activeSequence) {
                seq = app.project.activeSequence;
            } else if (app.project.sequences && app.project.sequences.numSequences > 0) {
                seq = app.project.sequences[0];
            }
        }

        if (!seq) {
            return "ERR|Could not read active sequence. Make sure a sequence is open in Premiere Pro.";
        }

        var jsonFile = new File(jsonPath);
        if (!jsonFile.exists) {
            return "ERR|Styled subtitle payload missing on disk: " + jsonPath;
        }

        jsonFile.open("r");
        var jsonText = jsonFile.read();
        jsonFile.close();

        var payload = null;
        try {
            payload = eval("(" + jsonText + ")");
        } catch(eJson) {
            return "ERR|Failed to parse styled subtitle JSON payload: " + eJson.toString();
        }

        if (!payload) return "ERR|Empty styled subtitle payload.";

        var style = payload.style || {};
        var captions = payload.captions || [];
        var words = payload.words || [];

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
            return "ERR|No caption or word items available to create styled subtitles.";
        }

        var targetTrack = null;
        if (seq.videoTracks && seq.videoTracks.numTracks > 0) {
            targetTrack = seq.videoTracks[seq.videoTracks.numTracks - 1];
            if (!targetTrack) targetTrack = seq.videoTracks[0];
        }

        if (!targetTrack) {
            return "ERR|No video tracks available in active sequence.";
        }

        var createdCount = 0;
        var fontFamily = style.fontFamily || "Arial";
        var fontSize = style.fontSize || 24;
        var fontColor = style.textColor || "#FFFFFF";
        var styleName = "Font: " + fontFamily + " (" + (style.fontWeight === "bold" ? "Bold" : "Regular") + "), Size: " + fontSize + "px";

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var titleName = "CGP_Cap_" + (i + 1);
            var titleItem = null;

            if (typeof app.project.createNewTitle === "function") {
                try {
                    titleItem = app.project.createNewTitle(titleName, item.text, fontFamily, fontSize, fontColor);
                } catch(eTitle) {}
            }

            if (titleItem && typeof targetTrack.insertClip === "function") {
                try {
                    targetTrack.insertClip(titleItem, item.start);
                    createdCount++;
                } catch(eIns) {}
            }
        }

        if (createdCount > 0) {
            return "OK|Created " + createdCount + " stylized subtitle elements on active sequence (" + styleName + ")!";
        }

        // Fallback: If title creation API is restricted in current Premiere version, fallback to SRT import
        var srtPath = jsonPath.replace("_styled.json", ".srt").replace("cgp_stylize_payload.json", "cgp_stylize_payload.srt");
        var srtFile = new File(srtPath);
        if (srtFile.exists) {
            var srtRes = $._PPP_.importSubtitles(srtFile.fsName);
            if (srtRes && srtRes.indexOf("OK|") === 0) {
                return "OK|Applied subtitles to active sequence timeline (" + styleName + ")!";
            }
            return srtRes;
        }

        return "ERR|Could not create graphic title clips on sequence video track. Make sure a sequence is active.";

    } catch (e) {
        return "ERR|" + e.toString();
    }
};
