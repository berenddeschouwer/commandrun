/*
 *  Multiprocess Firefox requires splitting scripts that run in the browser
 *  chrome from the document frame.
 *
 *  This script is the document frame script.
 */
var CommandRunInit = {
  onPageLoad: function(event) {
    var win = event.originalTarget.defaultView.wrappedJSObject;
    //win.CommandRun = new CommandRunHandler();
    win.CommandRun = Components.utils.cloneInto(new CommandRunHandler(),win,{cloneFunctions: true});
    win.CommandRun.page = win.document.location.href;
    Object.freeze(win.CommandRun);
  }
};
addEventListener("DOMContentLoaded", function(event) {
    CommandRunInit.onPageLoad(event);
});


var CommandRunHandler = function() { 
  
	/* see https://blog.mozilla.org/addons/2012/08/20/exposing-objects-to-content-safely/ */
	this.__exposedProps__ = { 
			"run" : "r"};


  this.page = null;

  this.run = function(command,args) {
    /* check whether command is allowed */
    if (!Components.utils.waiveXrays(this).isCommandAllowed(command,this.page)) {
      var alertText = "CommandRun: Blocked '" + this.page +
                      "' from running '" + command + "'";
      sendAsyncMessage("commandrun-alert", {alertText: alertText});
      return 1;
    }
    var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
    try {
    	file.initWithPath(command);
    } catch (e) {
        var alertText = "CommandRun: command not found: '" + command + "'";
        sendAsyncMessage("commandrun-alert", {alertText: alertText});
    	return 1;
    }
    var blocking = true;
    var process = Components.classes["@mozilla.org/process/util;1"].
                      createInstance(Components.interfaces.nsIProcess);
    try {
    	process.init(file);
    } catch (e) {
        var alertText = "CommandRun: command not found: '" + command + "'";
        sendAsyncMessage("commandrun-alert", {alertText: alertText});
        return 1;
    }

    process.run(blocking, args, args.length);
    
    result = process.exitValue;

    return result;
  };

  this.isCommandAllowed = function(command,page) {
    /* get the root preferences branch */
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
                    
    /* get the allowed commands preference */
    try {
	    var allowedCommandsPref = 
	      prefs.getComplexValue(
	        "extensions.commandrun.allowedcommands",
	        Components.interfaces.nsISupportsString).data;
	} catch (NS_ERROR_UNEXPECTED) {
		/* ignore */
	}
	    
    /* evaluate the json text */
    if (allowedCommandsPref) {
	var allowedCommands = JSON.parse(allowedCommandsPref);
	if (Components.utils.waiveXrays(this).contains(command,allowedCommands)) return true;
    }
    
    /* continue with allowed commands per host preference */
    try {
	    var allowedCommandsPerHostPref = 
	      prefs.getComplexValue(
	        "extensions.commandrun.allowedcommandsperhost",
	        Components.interfaces.nsISupportsString).data;
	} catch (NS_ERROR_UNEXPECTED) {
		/* ignore */
	}
	
	if (allowedCommandsPerHostPref) {
		var obj = JSON.parse(allowedCommandsPerHostPref);
		/* keys of the object are prefixes for pages,
		   values are lists of commands */
		try {
			for (prefix in obj) {
				if (Components.utils.waiveXrays(this).isPrefix(page,prefix)) {
					/* get allowed commands for this prefix */
					var allowedCommands = obj[prefix];
				if (Components.utils.waiveXrays(this).contains(command,allowedCommands)) {
    					return true;
    				}
				}		
			}
		} catch (e) {
                        var alertText = "CommandRun: Failed to parse extensions.commandrun.allowedcommandsperhost: " + e;
                        sendAsyncMessage("commandrun-alert", {alertText: alertText});
		}
	}
	
    return false;
  };

  this.contains = function(element,array) {
    var i;
    for (i=0; i<array.length; i++) {
      if (array[i] === element) {
        return true;
      }
    }
    return false;
  };

  /**
   * Checks whether the given prefix is a prefix of the
   * given string.
   */
  this.isPrefix = function(string,prefix) {
  	return (prefix === string.substring(0,prefix.length)); 	
  }
}
