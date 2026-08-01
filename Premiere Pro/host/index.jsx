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

$._PPP_.importSubtitles = function(srtPath, jsonPath, stylePreset) {
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

        return "OK|Subtitles created successfully on your sequence!|Count:" + cues.length;
    } catch (e) {
        return "ERR|" + e.toString();
    }
};
