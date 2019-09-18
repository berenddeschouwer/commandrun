"use strict";

/*
 * Content (per-tab) script for CommandRun
 *
 * The main extension runs as a background script and as a native app.
 * This just runs a pass-through sendMessage() from the page to the background
 * script and back.
 */

var CommandRun = {
    run:
        /**
         *  Runs a command
         *
         *  Takes a given command, and hands it over to the background process
         *  for running.  Options to the command can be provided.
         *
         *  @param {Array} command -   The command to run.  Array[0] is the
         *                             command, and Array[1..] are parameters
         *  @param {function(number, string, string)} output -
         *                             Function to run when the command
         *                             finishes.
         */
        function(command, output) {
            console.debug("sending a message");
            var p = browser.runtime.sendMessage(command);
            console.debug("sent message, received promise:", p);
            p.then(
                /**
                 *  @function
                 *  @param {{errno: number, stdout:string, stderr: string}} o
                 *
                 *  This is the function that gets run when the extension
                 *  responds with the results of the command.
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
            console.debug("received promise:", p);
        }
}


/*
 *  Wrap commandRun into the page, for easy usage.
 */
if (!window.wrappedJSObject.CommandRun) {
    window.wrappedJSObject.CommandRun = cloneInto(CommandRun, window,
                                                  {cloneFunctions: true});
}
