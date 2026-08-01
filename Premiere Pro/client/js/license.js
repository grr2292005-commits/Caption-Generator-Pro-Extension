// Supabase License Manager for Caption Generator Pro
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pb2R1c3lsbmFlYWF2Z3J0Z3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NzgzOTYsImV4cCI6MjEwMTE1NDM5Nn0.Rs7Kf4ffx1AISLbMYnkz54aMSnxMlwpr_0sfBSjfbAM";

function generateMachineId() {
    if (typeof require !== "undefined") {
        try {
            var os = require("os");
            var crypto = require("crypto");
            var cpus = os.cpus();
            var cpuModel = (cpus && cpus.length > 0) ? cpus[0].model : "unknown-cpu";
            var raw = [
                os.hostname(),
                os.platform(),
                os.arch(),
                cpuModel,
                os.totalmem()
            ].join("|");
            return crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
        } catch (e) {
            console.error("Machine ID generation error:", e);
        }
    }
    return "browser-client-id-32chars-fallback";
}

var LicenseManager = {
    STORAGE_KEY: "cgp_license_key",

    getStoredLicense: function() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) || "";
        } catch (e) {
            return "";
        }
    },

    saveLicense: function(key) {
        try {
            localStorage.setItem(this.STORAGE_KEY, (key || "").trim());
        } catch (e) {}
    },

    clearLicense: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {}
    },

    getMachineId: function() {
        return generateMachineId();
    },

    activate: function(licenseKey, callback) {
        var key = (licenseKey || "").trim();
        if (!key) {
            if (callback) callback(false, "License key cannot be empty.");
            return;
        }

        var machineId = this.getMachineId();
        var self = this;
        var url = "https://oiodusylnaeaavgrtgpv.supabase.co/functions/v1/activate-license";

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                "apikey": SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                license_key: key,
                machine_id: machineId
            })
        })
        .then(function(res) {
            return res.json().then(function(data) {
                return { status: res.status, ok: res.ok, data: data };
            });
        })
        .then(function(resObj) {
            if (resObj.ok && resObj.data && resObj.data.valid) {
                self.saveLicense(key);
                if (callback) callback(true, resObj.data.message || "License activated successfully!", resObj.data);
            } else {
                var errMessage = (resObj.data && resObj.data.error) ? resObj.data.error : (resObj.data && resObj.data.message ? resObj.data.message : "License activation failed.");
                if (callback) callback(false, errMessage, resObj.data);
            }
        })
        .catch(function(err) {
            console.error("License activation network error:", err);
            if (callback) callback(false, "Network error during license activation. Please check internet connection.");
        });
    },

    validate: function(callback) {
        var key = this.getStoredLicense();
        if (!key) {
            if (callback) callback(false, "No stored license key.");
            return;
        }

        var machineId = this.getMachineId();
        var url = "https://oiodusylnaeaavgrtgpv.supabase.co/functions/v1/validate-license";

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + SUPABASE_ANON_KEY,
                "apikey": SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                license_key: key,
                machine_id: machineId
            })
        })
        .then(function(res) {
            return res.json().then(function(data) {
                return { status: res.status, ok: res.ok, data: data };
            });
        })
        .then(function(resObj) {
            if (resObj.ok && resObj.data && resObj.data.valid) {
                if (callback) callback(true, resObj.data.message || "License is valid.", resObj.data);
            } else {
                var errMessage = (resObj.data && resObj.data.error) ? resObj.data.error : (resObj.data && resObj.data.message ? resObj.data.message : "License validation failed.");
                if (callback) callback(false, errMessage, resObj.data);
            }
        })
        .catch(function(err) {
            console.error("License validation network error:", err);
            if (callback) callback(false, "Network error during validation check.");
        });
    },

    isActivated: function(callback) {
        this.validate(function(valid, message, data) {
            if (callback) callback(valid);
        });
    }
};
