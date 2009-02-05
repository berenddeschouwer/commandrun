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
    var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(command);
    var blocking = false;
    var process = Components.classes["@mozilla.org/process/util;1"].
                      createInstance(Components.interfaces.nsIProcess);
    process.init(file);

    var ec = process.run(blocking, args, args.length);
    return ec;
  }
}
