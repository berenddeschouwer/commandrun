"use strict";


var console_debug;
if ("@DEBUG_FLAG@" == "true") {
    console_debug = console.debug;
} else {
    /**
     *  Do nothing on debug.
     */
    console_debug = function() { }
}
