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
            return "ERR|No active sequence found.";
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

        return "ERR|No online media clips found on the sequence.";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};

$._PPP_.importSubtitles = function(srtPath) {
    try {
        var seq = null;
        if (app && app.project) {
            if (app.project.activeSequence) {
                seq = app.project.activeSequence;
            } else if (app.project.sequences && app.project.sequences.numSequences > 0) {
                seq = app.project.sequences[0];
            }
        }

        var f = new File(srtPath);
        if (!f.exists) {
            return "ERR|SRT file not found: " + srtPath;
        }

        var targetBin = app.project.rootItem;
        if (app.project.getInsertionBin) {
            targetBin = app.project.getInsertionBin();
        }

        var importSuccess = app.project.importFiles([f.fsName], 1, targetBin, 0);

        if (importSuccess) {
            return "OK|Subtitles imported successfully!";
        }

        return "ERR|Failed to import SRT file.";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};

$._PPP_.setPlayhead = function(seconds) {
    try {
        var secNum = parseFloat(seconds) || 0;
        var seq = null;
        if (app && app.project) {
            seq = app.project.activeSequence;
        }
        if (seq) {
            var ticks = Math.round(secNum * 254016000000);
            seq.setPlayerPosition(String(ticks));
            return "OK|Playhead moved";
        }
        return "ERR|No active sequence";
    } catch (e) {
        return "ERR|" + e.toString();
    }
};
