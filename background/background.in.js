"use strict";

/*
On startup, connect to the "ping_pong" app.
*/
var runner;
var control;

console.log("background.js/top");

function startRunner() {
    runner = browser.runtime.connectNative("commandrun");
    console.log("opened commandrun runner");

    runner.onDisconnect.addListener((p) => {
        console.log("disconnected");
        setTimeout(startRunner, 60 * 1000);
    });

    /*
    Listen for messages from the app.
    */
    runner.onMessage.addListener((response) => {
        console.log("Received: " + response);
        control.sendResponse(response);
        console.log("processed: " + response);
    });
}

startRunner();

/*
On a click on the browser action, send the app a message.
*/
browser.runtime.onInstalled.addListener(function(stuff){
    console.log("installed me");
});

var Controller = function() {
    this.pids = {};
    this.commands = {};
    this.urls = {};
    return this;
}

Controller.prototype.newPid = function() {
    console.log("Controller.newPid()");
    return 0;
}

Controller.prototype.setResponder = function(pid, responder) {
    console.log("Controller.setResponder()");
    this.pids[pid] = responder;
    console.log("Controller.setResponder(): done");
}

Controller.prototype.setCommand = function(pid, command) {
    console.log("Controller.setCommand()");
    this.commands[pid] = command;
    console.log("Controller.setCommand(): done");
}

Controller.prototype.setURL = function(pid, url) {
    console.log("Controller.setURL()");
    this.urls[pid] = url;
    console.log("Controller.setURL(): done");
}

Controller.prototype.sendResponse = function(response) {
    var pid = response.handle;
    var responder = this.pids[pid];
    console.log("going to respond on ", responder);
    console.log("responding with ", response);
    responder(response);
    console.log("responded");
}

Controller.prototype.prepare = function(pid) {
    //var msg = {action:"run", what:message, handle:pid};
    //runner.postMessage(msg);
    console.log("Controller.prepare():", pid);
    function onError(error) {
        console.log(`Error: ${error}`);
    }
    function permitted(url, list) {
        console.log("permitted(): start");
        var u = new URL(url);
        var found = false;
        console.log("permitted(): hostname=", u.hostname);
        list.forEach(function(element) {
            console.log("permitted(): matching=", element);
            if (element[0] == "*") {
                element = element.substring(element.length - 1);
                console.log("permitted(): matching chopped=", element);
            }
            if (u.hostname.length < element.length) {
                console.log("permitted(): too short");
                return; 
            }
            if (u.hostname == element) {
                console.log("permitted(): exact match");
                found = true;
                return;
            }
            if (element[0] == ".") {
                var end = u.hostname.substring(u.hostname.length - element.length);
                console.log("permitted(): considering=", end);
                if (element == end) {
                    console.log("permitted(): domain match");
                    found = true;
                    return;
                }
            }
        });
        return found;
    }
    function checkAndRun(that, pid) {
        console.log("checkAndRun(): starting with pid=", pid);
        console.log("checkAndRun(): this=", that);
        var message = that.commands[pid];
        console.log("checkAndRun(): message=", message);
        var cmd = message[0];
        var responder = that.pids[pid];
        var url = that.urls[pid];
        console.log("checkAndRun(): stopping");
        return function(result) {
            var allowed_commands;
            var permitted_sites;
            var command = cmd;
            if (result.allowed_commands) {
                console.log("background/saved commands:", result.allowed_commands);
                allowed_commands = result.allowed_commands;
            } else {
                console.log("background/no allowed commands set");
                allowed_commands = ["@ALLOWED_COMMANDS@"];
            }
            if (result.permitted_sites) {
                console.log("background/permitted sites:", result.permitted_sites);
                permitted_sites = result.permitted_sites;
            } else {
                console.log("background/no permitted set");
                permitted_sites = ["@PERMITTED_SITES@"];
            }
            if (allowed_commands.includes(cmd) &&
                permitted(url, permitted_sites)) {
                 console.log("allowed command, forwarding");
                 var msg = {action:"run", what:message, handle:pid};
                 runner.postMessage(msg);
            } else {
                 console.log("forbidden command");
                 var response = {handle: pid, errno: -1, stdout: "", stderr: "forbidden command"};
                 responder(response);
            }
        }
    }
    console.log("Controller.prepare(): syncing storage");
    var processor = checkAndRun(this,pid);
    console.log("Controller.prepare():", processor);
    var getting = browser.storage.sync.get(["allowed_commands", "permitted_sites"]);
    console.log("Controller.prepare(): chainging promise");
    getting.then(processor, onError); 
}

control = new Controller();

function allowedCommand(cmd) {
    var allowed_commands;

    function getCommands(result) {
        if (result.allowed_commands) {
            console.log("background/saved commands:", result.allowed_commands);
            allowed_commands = result.allowed_commands.join(" ");
        } else {
            console.log("background/no allowed commands set");
            allowed_commands = "/usr/bin/ls";
        }
    }

    var getting = browser.storage.sync.get("allowed_commands");
    getting.then(getCommands, onError); 
    console.log("allowed_commands:", allowed_commands);
    return allowed_commands.includes(cmd);
}

function handleMessage(message, sender, sendResponse) {
    console.log("received message");
    console.log("received: ", message);
    var command = message[0];
    console.log("command:", command);
    console.log("from: ", sender);
    console.log("respond on: ", sendResponse);
    //response = {errno: 0, stdout: "pong", stderr: ""};
    //sendResponse(response);
    var pid = control.newPid();
    console.log("got pid:", pid);
    console.log("control:", control);
    console.log("control.setResponder:", control.setResponder);
    var responder=function(message) {
        console.log("responder wrapper", message);
        sendResponse(message);
        console.log("responder wrapper done");
    }
    control.setResponder(pid, sendResponse);
    control.setCommand(pid, message);
    control.setURL(pid, sender.url);
    console.log("set responder");
    console.log("sending message");
    control.prepare(pid);
    console.log("sent message");
    return true;
};

console.log("background/running");
browser.runtime.onMessage.addListener(handleMessage);
