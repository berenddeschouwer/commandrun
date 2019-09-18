"use strict";

/*
On startup, connect to the "ping_pong" app.
*/
var runner;
var control;

console.debug("background.js/top");

function startRunner() {
    console.log("starting native app");
    runner = browser.runtime.connectNative("commandrun");
    console.debug("opened commandrun runner");

    runner.onDisconnect.addListener((p) => {
        console.warn("disconnected");
        setTimeout(startRunner, 60 * 1000);
    });

    /*
    Listen for messages from the app.
    */
    runner.onMessage.addListener((response) => {
        console.debug("Received: " + response);
        control.sendResponse(response);
        console.debug("processed: " + response);
    });
}

startRunner();

/*
On a click on the browser action, send the app a message.
*/
browser.runtime.onInstalled.addListener(function(stuff){
    console.debug("installed me");
});

var Controller = function() {
    this.pids = {};
    this.commands = {};
    this.urls = {};
    return this;
}

Controller.prototype.newPid = function() {
    console.debug("Controller.newPid()");
    console.warn("we should not always return 0");
    return 0;
}

Controller.prototype.setResponder = function(pid, responder) {
    console.debug("Controller.setResponder()");
    this.pids[pid] = responder;
    console.debug("Controller.setResponder(): done");
}

Controller.prototype.setCommand = function(pid, command) {
    console.debug("Controller.setCommand()");
    this.commands[pid] = command;
    console.debug("Controller.setCommand(): done");
}

Controller.prototype.setURL = function(pid, url) {
    console.debug("Controller.setURL()");
    this.urls[pid] = url;
    console.debug("Controller.setURL(): done");
}

Controller.prototype.sendResponse = function(response) {
    var pid = response.handle;
    var responder = this.pids[pid];
    console.debug("going to respond on ", responder);
    console.debug("responding with ", response);
    response.stdout = atob(response.stdout);
    response.stderr = atob(response.stderr);
    response.handle = undefined;
    console.debug("responding with ", response);
    responder(response);
    console.debug("responded");
}

Controller.prototype.prepare = function(pid) {
    //var msg = {action:"run", what:message, handle:pid};
    //runner.postMessage(msg);
    console.debug("Controller.prepare():", pid);
    function onError(error) {
        console.warn(`Error: ${error}`);
    }
    function permitted(url, list) {
        console.debug("permitted(): start");
        var u = new URL(url);
        var found = false;
        console.debug("permitted(): hostname=", u.hostname);
        list.forEach(function(element) {
            console.debug("permitted(): matching=", element);
            if (element[0] == "*") {
                element = element.substring(element.length - 1);
                console.debug("permitted(): matching chopped=", element);
            }
            if (u.hostname.length < element.length) {
                console.debug("permitted(): too short");
                return; 
            }
            if (u.hostname == element) {
                console.debug("permitted(): exact match");
                found = true;
                return;
            }
            if (element[0] == ".") {
                var end = u.hostname.substring(u.hostname.length - element.length);
                console.debug("permitted(): considering=", end);
                if (element == end) {
                    console.debug("permitted(): domain match");
                    found = true;
                    return;
                }
            }
        });
        return found;
    }
    function checkAndRun(that, pid) {
        console.debug("checkAndRun(): starting with pid=", pid);
        console.debug("checkAndRun(): this=", that);
        var message = that.commands[pid];
        console.debug("checkAndRun(): message=", message);
        var cmd = message[0];
        var responder = that.pids[pid];
        var url = that.urls[pid];
        console.debug("checkAndRun(): stopping");
        return function(result) {
            var allowed_commands;
            var permitted_sites;
            var command = cmd;
            if (result.allowed_commands) {
                console.debug("background/saved commands:", result.allowed_commands);
                allowed_commands = result.allowed_commands;
            } else {
                console.debug("background/no allowed commands set");
                allowed_commands = ["@ALLOWED_COMMANDS@"];
            }
            if (result.permitted_sites) {
                console.debug("background/permitted sites:", result.permitted_sites);
                permitted_sites = result.permitted_sites;
            } else {
                console.debug("background/no permitted set");
                permitted_sites = ["@PERMITTED_SITES@"];
            }
            if (allowed_commands.includes(cmd) &&
                permitted(url, permitted_sites)) {
                 console.debug("allowed command, forwarding");
                 var msg = {action:"run", what:message, handle:pid};
                 runner.postMessage(msg);
            } else {
                 console.debug("forbidden command");
                 var response = {handle: pid, errno: -1, stdout: "", stderr: "forbidden command"};
                 responder(response);
            }
        }
    }
    console.debug("Controller.prepare(): syncing storage");
    var processor = checkAndRun(this,pid);
    console.debug("Controller.prepare():", processor);
    var getting = browser.storage.sync.get(["allowed_commands", "permitted_sites"]);
    console.debug("Controller.prepare(): chainging promise");
    getting.then(processor, onError); 
}

control = new Controller();

function allowedCommand(cmd) {
    var allowed_commands;

    function getCommands(result) {
        if (result.allowed_commands) {
            console.debug("background/saved commands:", result.allowed_commands);
            allowed_commands = result.allowed_commands.join(" ");
        } else {
            console.debug("background/no allowed commands set");
            allowed_commands = "/usr/bin/ls";
        }
    }

    function onError(result) {
        console.warn("do nothing");
    }

    var getting = browser.storage.sync.get("allowed_commands");
    getting.then(getCommands, onError); 
    console.debug("allowed_commands:", allowed_commands);
    return allowed_commands.includes(cmd);
}

function handleMessage(message, sender, sendResponse) {
    console.debug("received message");
    console.debug("received: ", message);
    var command = message[0];
    console.debug("command:", command);
    console.debug("from: ", sender);
    console.debug("respond on: ", sendResponse);
    //response = {errno: 0, stdout: "pong", stderr: ""};
    //sendResponse(response);
    var pid = control.newPid();
    console.debug("got pid:", pid);
    console.debug("control:", control);
    console.debug("control.setResponder:", control.setResponder);
    var responder=function(message) {
        console.debug("responder wrapper", message);
        sendResponse(message);
        console.debug("responder wrapper done");
    }
    control.setResponder(pid, sendResponse);
    control.setCommand(pid, message);
    control.setURL(pid, sender.url);
    console.debug("set responder");
    console.debug("sending message");
    control.prepare(pid);
    console.debug("sent message");
    return true;
};

console.debug("background/running");
browser.runtime.onMessage.addListener(handleMessage);
