// Settings & Model Manager
var SettingsManager = {
    settings: {
        hardware: "auto"
    },

    init: function() {
        var self = this;
        var selHw = document.getElementById("selectHardware");

        if (selHw) {
            selHw.value = this.settings.hardware;
            selHw.addEventListener("change", function() {
                self.settings.hardware = selHw.value;
                self.save();
                if (typeof UserPreferences !== "undefined") UserPreferences.autoSave();
            });
        }

        this.load();
        this.initLicenseSection();
        this.renderModelManager();

        // Update model storage path display
        var lblPath = document.getElementById("lblModelPath");
        if (lblPath && typeof require !== "undefined") {
            try {
                var os = require("os");
                var path = require("path");
                var cacheDir = path.join(os.homedir(), ".cache", "whisper").replace(/\\/g, "/");
                lblPath.innerText = cacheDir;
            } catch(e) {}
        }
    },

    load: function() {
        try {
            var stored = localStorage.getItem("cgp_settings");
            if (stored) {
                this.settings = Object.assign(this.settings, JSON.parse(stored));
                var selHw = document.getElementById("selectHardware");
                if (selHw) selHw.value = this.settings.hardware;
            }
        } catch(e) {}
    },

    save: function() {
        try {
            localStorage.setItem("cgp_settings", JSON.stringify(this.settings));
        } catch(e) {}
    },

    renderRequirementsList: function(status) {
        var container = document.getElementById("requirementsListContainer");
        if (!container) return;

        container.innerHTML = "";

        var items = [
            {
                name: "Python 3.x Engine",
                ok: status.python === true,
                info: status.python ? "v" + status.python_version : "Python Not Found"
            },
            {
                name: "PyTorch AI Engine",
                ok: status.pytorch === true,
                info: status.pytorch ? "v" + status.pytorch_version + (status.cuda_available ? " (CUDA GPU)" : " (CPU Mode)") : "PyTorch Not Found"
            },
            {
                name: "OpenAI Whisper Engine",
                ok: status.whisper_pkg === true,
                info: status.whisper_pkg ? "Installed & Operational" : "Package Missing"
            },
            {
                name: "FFmpeg Audio Extractor",
                ok: status.ffmpeg === true,
                info: status.ffmpeg ? "Binary Ready" : "Binary Missing"
            },
            {
                name: "Model Storage Cache",
                ok: status.cache_ready === true,
                info: status.cache_ready ? (status.cache_dir || "~/.cache/whisper") : "Directory Error"
            }
        ];

        items.forEach(function(item) {
            var row = document.createElement("div");
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: var(--bg-dark); border: 1px solid var(--border-color); padding: 5px 8px; border-radius: 4px;";

            var left = document.createElement("div");
            left.style.cssText = "display: flex; align-items: center; gap: 6px;";

            var icon = document.createElement("span");
            icon.style.cssText = `font-weight: 700; font-size: 12px; color: ${item.ok ? 'var(--accent-blue)' : '#ff4d4d'};`;
            icon.innerText = item.ok ? "✔" : "✖";

            var name = document.createElement("span");
            name.style.cssText = "font-weight: 600; color: var(--text-primary); font-size: 11px;";
            name.innerText = item.name;

            left.appendChild(icon);
            left.appendChild(name);

            var right = document.createElement("span");
            right.style.cssText = `font-size: 10px; color: ${item.ok ? 'var(--text-secondary)' : '#ff4d4d'}; font-family: monospace;`;
            right.innerText = item.info;

            row.appendChild(left);
            row.appendChild(right);
            container.appendChild(row);
        });
    },

    renderModelManager: function() {
        var container = document.getElementById("modelListContainer");
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 10px;">Checking dependencies and models...</div>';

        var self = this;
        DependencyInstaller.checkStatus(function(status) {
            self.renderRequirementsList(status);

            container.innerHTML = "";
            var models = status.models_detailed || [];

            if (models.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 10px;">No models detected.</div>';
                return;
            }

            models.forEach(function(model) {
                var item = document.createElement("div");
                item.className = "model-item";

                var header = document.createElement("div");
                header.className = "model-item-header";

                var nameLbl = document.createElement("span");
                nameLbl.className = "model-name";
                nameLbl.innerText = `${model.name} (${model.size})`;

                var statusTag = document.createElement("span");
                statusTag.className = `status-tag ${model.installed ? 'installed' : 'not-installed'}`;
                statusTag.innerText = model.installed ? "Installed" : "Not Installed";

                header.appendChild(nameLbl);
                header.appendChild(statusTag);

                var descLbl = document.createElement("div");
                descLbl.className = "model-desc";
                descLbl.innerText = model.desc;

                var actionsRow = document.createElement("div");
                actionsRow.className = "model-actions";

                if (model.installed) {
                    var btnDelete = document.createElement("button");
                    btnDelete.className = "btn-danger";
                    btnDelete.innerText = "Delete Model";
                    btnDelete.addEventListener("click", function() {
                        if (confirm(`Are you sure you want to delete the ${model.name} model?`)) {
                            DependencyInstaller.deleteModel(model.key, function(success) {
                                self.renderModelManager();
                                if (typeof updateModelDropdown === "function") {
                                    DependencyInstaller.checkStatus(function(st) {
                                        updateModelDropdown(st.installed_models);
                                    });
                                }
                            });
                        }
                    });
                    actionsRow.appendChild(btnDelete);
                } else {
                    var btnDownload = document.createElement("button");
                    btnDownload.className = "btn-secondary";
                    btnDownload.innerText = "Download Model";
                    btnDownload.addEventListener("click", function() {
                        showInstallerModalForModel(model.key);
                    });
                    actionsRow.appendChild(btnDownload);
                }

                item.appendChild(header);
                item.appendChild(descLbl);
                item.appendChild(actionsRow);
                container.appendChild(item);
            });
        });
    },

    initLicenseSection: function() {
        var inputKey = document.getElementById("licenseKeyInput");
        var btnActivate = document.getElementById("btnActivateLicense");
        var btnDeactivate = document.getElementById("btnDeactivateLicense");
        var lblStatus = document.getElementById("licenseStatus");

        if (!lblStatus) return;

        // Pre-fill input if key is stored
        if (inputKey && typeof LicenseManager !== "undefined") {
            var storedKey = LicenseManager.getStoredLicense();
            if (storedKey) inputKey.value = storedKey;
        }

        // 1. Initial Validation Check on Panel Load
        this.checkLicenseStatus();

        // 2. Activate Button Click
        if (btnActivate) {
            btnActivate.addEventListener("click", function() {
                var key = inputKey ? inputKey.value.trim() : "";
                if (!key) {
                    lblStatus.innerText = "Please enter a license key.";
                    lblStatus.style.color = "#ff4d4d";
                    return;
                }

                btnActivate.disabled = true;
                lblStatus.innerText = "Checking...";
                lblStatus.style.color = "var(--text-secondary)";

                LicenseManager.activate(key, function(valid, message) {
                    btnActivate.disabled = false;
                    if (valid) {
                        lblStatus.innerText = "Activated";
                        lblStatus.style.color = "var(--accent-blue)";
                        if (typeof showAlertModal === "function") {
                            showAlertModal("License Activated", "Your license key has been successfully activated on this computer!");
                        }
                    } else {
                        lblStatus.innerText = message || "Invalid / already used on another computer";
                        lblStatus.style.color = "#ff4d4d";
                        if (typeof showAlertModal === "function") {
                            showAlertModal("License Notice", message || "License activation failed.");
                        }
                    }
                });
            });
        }

        // 3. Deactivate Button Click
        if (btnDeactivate) {
            btnDeactivate.addEventListener("click", function() {
                if (typeof LicenseManager !== "undefined") {
                    LicenseManager.clearLicense();
                }
                if (inputKey) inputKey.value = "";
                lblStatus.innerText = "Not activated";
                lblStatus.style.color = "var(--text-secondary)";
                if (typeof showAlertModal === "function") {
                    showAlertModal("License Deactivated", "License key removed from this computer.");
                }
            });
        }
    },

    checkLicenseStatus: function() {
        var lblStatus = document.getElementById("licenseStatus");
        if (!lblStatus) return;

        if (typeof LicenseManager === "undefined") {
            lblStatus.innerText = "Not activated";
            lblStatus.style.color = "var(--text-secondary)";
            return;
        }

        var storedKey = LicenseManager.getStoredLicense();
        if (!storedKey) {
            lblStatus.innerText = "Not activated";
            lblStatus.style.color = "var(--text-secondary)";
            return;
        }

        lblStatus.innerText = "Checking...";
        lblStatus.style.color = "var(--text-secondary)";

        LicenseManager.validate(function(valid, message) {
            if (valid) {
                lblStatus.innerText = "Activated";
                lblStatus.style.color = "var(--accent-blue)";
            } else {
                lblStatus.innerText = "Invalid / already used on another computer";
                lblStatus.style.color = "#ff4d4d";
            }
        });
    }
};
