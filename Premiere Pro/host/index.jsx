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

$._PPP_.exportAudio = function() {
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

        var mediaPath = "";

        // Scan audio tracks
        if (seq.audioTracks) {
            for (var i = 0; i < seq.audioTracks.numTracks; i++) {
                var tr = seq.audioTracks[i];
                if (tr && tr.clips) {
                    for (var c = 0; c < tr.clips.numItems; c++) {
                        var item = tr.clips[c];
                        if (item && item.projectItem) {
                            var mp = item.projectItem.getMediaPath();
                            if (mp && mp.length > 0) {
                                var testF = new File(mp);
                                if (testF.exists) {
                                    mediaPath = mp;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (mediaPath !== "") break;
            }
        }

        // Scan video tracks if needed
        if (mediaPath === "" && seq.videoTracks) {
            for (var v = 0; v < seq.videoTracks.numTracks; v++) {
                var vt = seq.videoTracks[v];
                if (vt && vt.clips) {
                    for (var vc = 0; vc < vt.clips.numItems; vc++) {
                        var vItem = vt.clips[vc];
                        if (vItem && vItem.projectItem) {
                            var vmp = vItem.projectItem.getMediaPath();
                            if (vmp && vmp.length > 0) {
                                var testVF = new File(vmp);
                                if (testVF.exists) {
                                    mediaPath = vmp;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (mediaPath !== "") break;
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
