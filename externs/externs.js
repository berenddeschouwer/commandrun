/*
 * Closure Compiler doesn't know about cloneInto
 */
function cloneInto(ino, outo, flags) {};

/*
 * Or wrappedJSObject
 */
window.wrappedJSObject = {
    CommandRun: {}
}

/*
 * Closure Compiler doesn't know browser
 */
var browser = {
    runtime: {
        connectNative: function(namespace) {},
        onInstalled: {
            addListener: function() {}
        }
    },
    storage: {
        sync: {
            get: function(o) {}
        }
    }
}
