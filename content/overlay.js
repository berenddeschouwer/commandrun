var CommandRunInit = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    var appcontent = document.getElementById("appcontent");
    if (appcontent) {
      appcontent.addEventListener("DOMContentLoaded", CommandRunInit.onPageLoad, true);
    }
  },
  onPageLoad: function(event) {
    var win = event.originalTarget.defaultView.wrappedJSObject;
    win.CommandRun = new CommandRunHandler();
    win.CommandRun.page = win.document.location.href;
    Object.freeze(win.CommandRun);
  }
};
window.addEventListener("load", function(e) { CommandRunInit.onLoad(e); }, false);

var CommandRunHandler = function() { 
  
	/* see https://blog.mozilla.org/addons/2012/08/20/exposing-objects-to-content-safely/ */
	this.__exposedProps__ = { 
			"run" : "r"};
};

CommandRunHandler.prototype = {

  page : null,

  run : function(command,args) {
    /* check whether command is allowed */
    if (!this.isCommandAllowed(command,this.page)) {
      var alertText = "Command '"+command+"'\n"
      	+"is not allowed for page "+this.page+".";
      alert(alertText);
      return 1;
    }
    var file = Components.classes["@mozilla.org/file/local;1"].
                     createInstance(Components.interfaces.nsILocalFile);
    try {
    	file.initWithPath(command);
    } catch (e) {
    	alert("command not found: "+command);
    	return 1;
    }
    var blocking = true;
    var process = Components.classes["@mozilla.org/process/util;1"].
                      createInstance(Components.interfaces.nsIProcess);
    try {
    	process.init(file);
    } catch (e) {
    	alert("command not found: "+command);
    	return 1;
    }

    process.run(blocking, args, args.length);
    
    result = process.exitValue;

    return result;
  },

  isCommandAllowed : function(command,page) {
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
    	if (this.contains(command,allowedCommands)) return true;
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
				if (this.isPrefix(page,prefix)) {
					/* get allowed commands for this prefix */
					var allowedCommands = obj[prefix];
    				if (this.contains(command,allowedCommands)) {
    					return true;
    				}
				}		
			}
		} catch (e) {
			alert(
				"failed to parse extensions.commandrun.allowedcommandsperhost: "
				+e);
		}
	}
	
    return false;
  },

  contains : function(element,array) {
    var i;
    for (i=0; i<array.length; i++) {
      if (array[i] === element) {
        return true;
      }
    }
    return false;
  },

  /**
   * Checks whether the given prefix is a prefix of the
   * given string.
   */
  isPrefix : function(string,prefix) {
  	return (prefix === string.substring(0,prefix.length)); 	
  }
}
