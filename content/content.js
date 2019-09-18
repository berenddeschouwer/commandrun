"use strict";

var CommandRun = {
    run: function(command, output) {
        console.log("sending a message");
        var p = browser.runtime.sendMessage(command);
        console.log("sent message, received promise:", p);
        p.then(
            /**
             *  @param {{errno: number, stdout:string, stderr: string}} o
             */
        (o) => {
            if ((typeof o.errno === "undefined") ||
                (typeof o.stdout === "undefined") ||
                (typeof o.stderr === "undefined")) {
                output(-1, "", "incomplete response");
            } else {
                output(o.errno, o.stdout, o.stderr);
            }
        },
        () => {
            console.warn("response to sendMessage() failed promise");
            output(-1, "", "received bad response");
        });
        console.log("received promise:", p);
    }
}


/*
 *  Wrap commandRun into the page, for easy usage.
 */
if (!window.wrappedJSObject.CommandRun) {
    window.wrappedJSObject.CommandRun = cloneInto(CommandRun, window,
                                                  {cloneFunctions: true});
}
