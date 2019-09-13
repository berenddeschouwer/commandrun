"use strict";

/*
 * We need to wrap the output
 */
function prepOut(o) {
    var a = function(something) {
        console.log("content/a(): forwarding");
        console.log("content/a():", something);
        o(something.errno, atob(something.stdout), something.stderr);
        console.log("content/a(): forwarded");
    };
    return(a);
}

function stuffit(a, b, c) {
    console.log("success");
    console.log(a);
    console.log(b);
    console.log(c);
}

function error(o) {
    console.log("error");
}

var CommandRun = {
    run: function(command, output) {
        console.log("sending a message");
        var p = browser.runtime.sendMessage(command);
        console.log("sent message, received promise:", p);
        var zme = prepOut(output);
        p.then(zme, error);
        console.log("received promise:", p);
    }
}

window.wrappedJSObject.CommandRun = cloneInto(CommandRun, window,
                                              {cloneFunctions: true});

