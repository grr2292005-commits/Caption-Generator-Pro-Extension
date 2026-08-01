// In-Panel Subtitle Cue Editor with Editable Timestamps
var SubtitleEditor = {
    captions: [],
    
    init: function() {
        var self = this;
        var btn = document.getElementById("btnAddCue");
        if (btn) {
            btn.addEventListener("click", function() {
                self.addCue();
            });
        }
    },

    loadCaptions: function(captionsList) {
        this.captions = captionsList || [];
        this.render();
    },

    render: function() {
        var container = document.getElementById("cueList");
        var counter = document.getElementById("cueCounter");
        if (!container || !counter) return;

        container.innerHTML = "";
        var total = this.captions.length;
        counter.innerText = total + (total === 1 ? " Subtitle" : " Subtitles");

        if (total === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); margin-top: 30px; padding: 20px 15px; background: var(--bg-dark); border: 1px dashed var(--border-color); border-radius: 6px; font-size: 11px; line-height: 1.6;">' +
                '<div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px; font-size: 12px;">No captions yet.</div>' +
                '<div>Go to the Transcribe tab and click \'Transcribe Timeline\' to generate subtitles.</div>' +
                '</div>';
            return;
        }

        var self = this;
        this.captions.forEach(function(cue, index) {
            var row = document.createElement("div");
            row.className = "cue-row";

            var header = document.createElement("div");
            header.className = "cue-header";
            header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;";

            var timeGroup = document.createElement("div");
            timeGroup.style.cssText = "display: flex; align-items: center; gap: 4px;";

            // Playhead Jump
            var btnPlay = document.createElement("button");
            btnPlay.className = "btn-secondary";
            btnPlay.style.cssText = "padding: 2px 6px; font-size: 9px; line-height: 1.2;";
            btnPlay.innerText = "▶ Jump";
            btnPlay.title = "Jump playhead to start timecode";
            btnPlay.addEventListener("click", function() {
                if (typeof ExtendScriptBridge !== "undefined" && ExtendScriptBridge.setPlayhead) {
                    ExtendScriptBridge.setPlayhead(cue.start);
                }
            });

            // Start Time Editable Input
            var lblStart = document.createElement("span");
            lblStart.innerText = "In:";
            lblStart.style.cssText = "font-size: 10px; color: var(--text-secondary);";

            var inputStart = document.createElement("input");
            inputStart.type = "number";
            inputStart.step = "0.1";
            inputStart.min = "0";
            inputStart.title = "Start time (seconds)";
            inputStart.value = (parseFloat(cue.start) || 0).toFixed(1);
            inputStart.style.cssText = "width: 55px; background-color: var(--bg-dark); border: 1px solid var(--border-color); color: var(--accent-blue); padding: 2px 4px; font-size: 10px; font-family: monospace; border-radius: 3px; outline: none;";
            inputStart.addEventListener("input", function(e) {
                var val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    self.captions[index].start = val;
                }
            });

            var lblEnd = document.createElement("span");
            lblEnd.innerText = "Out:";
            lblEnd.style.cssText = "font-size: 10px; color: var(--text-secondary); margin-left: 4px;";

            // End Time Editable Input
            var inputEnd = document.createElement("input");
            inputEnd.type = "number";
            inputEnd.step = "0.1";
            inputEnd.min = "0";
            inputEnd.title = "End time (seconds)";
            inputEnd.value = (parseFloat(cue.end) || 0).toFixed(1);
            inputEnd.style.cssText = "width: 55px; background-color: var(--bg-dark); border: 1px solid var(--border-color); color: var(--accent-blue); padding: 2px 4px; font-size: 10px; font-family: monospace; border-radius: 3px; outline: none;";
            inputEnd.addEventListener("input", function(e) {
                var val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    self.captions[index].end = val;
                }
            });

            timeGroup.appendChild(btnPlay);
            timeGroup.appendChild(lblStart);
            timeGroup.appendChild(inputStart);
            timeGroup.appendChild(lblEnd);
            timeGroup.appendChild(inputEnd);

            var btnDel = document.createElement("button");
            btnDel.className = "btn-danger";
            btnDel.innerText = "Delete";
            btnDel.style.cssText = "padding: 2px 8px; font-size: 10px;";
            btnDel.addEventListener("click", function() {
                self.deleteCue(index);
            });

            header.appendChild(timeGroup);
            header.appendChild(btnDel);

            var input = document.createElement("input");
            input.type = "text";
            input.className = "cue-text-input";
            input.value = cue.text;
            input.addEventListener("input", function(e) {
                self.captions[index].text = e.target.value;
            });

            row.appendChild(header);
            row.appendChild(input);
            container.appendChild(row);
        });
    },

    addCue: function() {
        var lastEnd = this.captions.length > 0 ? parseFloat(this.captions[this.captions.length - 1].end) || 0 : 0;
        this.captions.push({
            start: parseFloat((lastEnd + 0.1).toFixed(1)),
            end: parseFloat((lastEnd + 2.5).toFixed(1)),
            text: "New Subtitle Cue"
        });
        this.render();
    },

    deleteCue: function(index) {
        this.captions.splice(index, 1);
        this.render();
    }
};
