"use strict";

/*
On startup, connect to the "ping_pong" app.
*/
var runner = browser.runtime.connectNative("commandrun");
console.log("opened commandrun runner");

/*
Listen for messages from the app.
*/
runner.onMessage.addListener((response) => {
    console.log("Received: " + response);
    control.sendResponse(response);
    console.log("processed: " + response);
});

/*
On a click on the browser action, send the app a message.
*/
browser.runtime.onInstalled.addListener(function(stuff){
    console.log("installed me");
});

var Controller = function() {
    this.pids = {};
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

Controller.prototype.sendResponse = function(response) {
    var pid = response.handle;
    var responder = this.pids[pid];
    console.log("going to respond on ", responder);
    console.log("responding with ", response);
    responder(response);
    console.log("responded");
}

var control = new Controller();

function handleMessage(message, sender, sendResponse) {
    console.log("received message");
    console.log("received: ", message);
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
    console.log("set responder");
    var msg = {action:"run", what:message, handle:pid};
    console.log("sending message");
    runner.postMessage(msg);
    console.log("sent message");
    return true;
};

browser.runtime.onMessage.addListener(handleMessage);
