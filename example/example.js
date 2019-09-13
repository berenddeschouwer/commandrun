"use strict";

var printOutput = function(errno, stdout, stderr) {
    var elem = document.getElementById("output");
    if (errno == 0) {
        elem.textContent = stdout;
    } else {
        elem.textContent = stderr;
    }
};

var getListing = function() {
    var handler = CommandRun.run(["/usr/bin/ls", "/"], printOutput);
};
