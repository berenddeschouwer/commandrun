"use strict";


/**
 * @function
 * @param {string} s - string to turn to an array
 * @returns {Array<string>}
 *
 * A string separated with ' ' or ', ' is turned into an array of strings.
 */
function stringToArray(s) {
    var regex = /, /gi;
    s = s.replace(regex, ' ');
    return s.split(' ');
} 


/**
 * @function
 * @param {Event} e
 *
 * Save the user's choice to browser storage.
 */
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
            console.debug("saved commands:", result.allowed_commands);
            allowed_commands = result.allowed_commands.join(", ");
        } else {
            allowed_commands = "@ALLOWED_COMMANDS@";
        }
        document.querySelector("#allowed_commands").value = allowed_commands;
    }

    function setCurrentSites(result) {
        var permitted_sites;
        if (result.permitted_sites) {
            console.debug("permitted sites:", result.permitted_sites);
            permitted_sites = result.permitted_sites.join(", ");
        } else {
            permitted_sites = "@PERMITTED_SITES@";
        }
        document.querySelector("#permitted_sites").value = permitted_sites;
    }

    function onError(error) {
        console.warn(`Error: ${error}`);
    }

    var commands = browser.storage.sync.get("allowed_commands");
    commands.then(setCurrentCommands, onError);

    var sites = browser.storage.sync.get("permitted_sites");
    sites.then(setCurrentSites, onError);
}


/*
 * Add triggers on the document to get/set options.
 */
document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
