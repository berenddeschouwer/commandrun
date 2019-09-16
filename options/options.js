function stringToArray(s) {
    var regex = /, /gi;
    s = s.replace(regex, ' ');
    return s.split(' ');
} 

function saveOptions(e) {
    e.preventDefault();
    var allowed_commands = stringToArray(document.querySelector("#allowed_commands").value);
    var permitted_sites = stringToArray(document.querySelector("#permitted_sites").value);
    browser.storage.sync.set({
        allowed_commands: allowed_commands,
        permitted_sites: permitted_sites 
    });
}

function restoreOptions() {

    function setCurrentCommands(result) {
        var allowed_commands;
        if (result.allowed_commands) {
            console.log("saved commands:", result.allowed_commands);
            allowed_commands = result.allowed_commands.join(", ");
        } else {
            allowed_commands = "/usr/bin/false, /usr/bin/true";
        }
        document.querySelector("#allowed_commands").value = allowed_commands;
    }

    function setCurrentSites(result) {
        var permitted_sites;
        if (result.permitted_sites) {
            console.log("permitted sites:", result.permitted_sites);
            permitted_sites = result.permitted_sites.join(", ");
        } else {
            permitted_sites = "localhost, server";
        }
        document.querySelector("#permitted_sites").value = permitted_sites;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.sync.get("allowed_commands");
    getting.then(setCurrentCommands, onError);

    var getting = browser.storage.sync.get("permitted_sites");
    getting.then(setCurrentSites, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
