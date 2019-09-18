"use strict";


/**
 * A string separated with ' ' or ', ' is turned into an array of strings.
 *
 * @param {string} s - string to turn to an array
 * @returns {Array<string>}
 */
function stringToArray(s) {
    var regex = /, /gi;
    s = s.replace(regex, ' ');
    return s.split(' ');
} 


/**
 * Save the user's choice to browser storage.
 *
 * @param {Event} e
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


/**
 * Load options from browser storage, and set defaults if none found.
 */
function restoreOptions() {

    /**
     * Set the current allowed commands.
     *
     * @param {Object} result - A data structure with parameters loaded
     *                          from browser storage
     */
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

    /**
     * Set the list of currently permitted sites
     *
     * @param {Object} result - A data structure with parameters loaded
     *                          from browser storage
     */
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

    /**
     * Act on Errors to the browser storage.  Does nothing.
     */
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
