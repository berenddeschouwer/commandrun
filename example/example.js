"use strict";

/*
 *  Simple Example
 *
 *  This example will run '/usr/bin/ls /', and print the output.
 *  The API for CommandRun is deliberately simple:
 *  CommandRun.run( command, run-when-done )
 */


/*
 *  printOutput
 *  @function
 *
 *  @param {integer} errno - an error number.
 *                           0  means success.
 *                           <0 means API error (eg. forbidden command)
 *                           >0 is the error of the command.
 *  @param {string} stdout - the output of the command.
 *  @param {string} stderr - the error output of the command.
 *
 *  stdout and stderr are strings that contain the output.  Newlines
 *  are not preserved in Javascript.
 *
 *  output >4GB isn't supported.  Large-ish output is supported by
 *  browsers but impractical.
 */
var printOutput = function(errno, stdout, stderr) {
    var elem = document.getElementById("output");
    if (errno == 0 /* no error */) {
        elem.textContent = stdout;
    } else /* error */ {
        elem.textContent = stderr;
    }
};


/*
 *  getListing (run on button press event)
 *  @function
 *
 *  Runs a command, runs 'printOutput' when the results are known.
 *
 *  The command is an [], with [0] being the command and subsequent
 *  entries as parameters, conforming with execvp()
 */
var getListing = function() {
    CommandRun.run(["/usr/bin/ls", "/"], printOutput);
};
