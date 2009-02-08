var CommandRun = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("commandrun-strings");
    var appcontent = document.getElementById("appcontent");
    if (appcontent) {
      appcontent.addEventListener("DOMContentLoaded", CommandRun.onPageLoad, true);
    }
  },
  onPageLoad: function(event) {
    var win = event.originalTarget.defaultView.wrappedJSObject;
    win.CommandRun = new CommandRunHandler();

  }
};
window.addEventListener("load", function(e) { CommandRun.onLoad(e); }, false);

function CommandRunHandler() {
  this.run = function(command,args) {
    /* check whether command is allowed */
    if (!this.isCommandAllowed(command)) {
      // TODO give a better alert with an explanation how to solve
      alert("command is not allowed: "+command);
      return 1;
    }
    var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(command);
    var blocking = false;
    var process = Components.classes["@mozilla.org/process/util;1"].
                      createInstance(Components.interfaces.nsIProcess);
    process.init(file);

    var ec = process.run(blocking, args, args.length);
    return ec;
  },
  this.isCommandAllowed = function(command) {
    /* get the root preferences branch */
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
    /* get the allowed commands preference */
    var allowedCommandsPref = 
      prefs.getComplexValue(
        "extensions.commandrun.allowedcommands",
        Components.interfaces.nsISupportsString).data;
    /* evaluate the json text */
    // TODO replace with more secure JSON parsing 
    // TODO handle errors
    var allowedCommands = eval(allowedCommandsPref);
    
    return (this.contains(command,allowedCommands));
  },
  this.contains = function(element,array) {
    var i;
    for (i=0; i<array.length; i++) {
      if (array[i] === element) {
        return true;
      }
    }
    return false;
  }
}
