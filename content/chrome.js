/*
 * Multiprocess Firefox requires splitting scripts that run in the browser
 * chrome from the document frame.
 *
 * This script is the browser chrome script.
 */

var globalMM = Cc["@mozilla.org/globalmessagemanager;1"]
  .getService(Ci.nsIMessageListenerManager);
globalMM.loadFrameScript("chrome://commandrun/content/frame.js", true);

globalMM.addMessageListener("commandrun-alert", function(msg) {
    dump("we got a message");
    dump(msg.data.alertText);
    let nb = gBrowser.getNotificationBox();
    let that = this;
    nb.appendNotification(
       msg.data.alertText, "commandrun-alert-notification",
       "",
       nb.PRIORITY_WARNING_HIGH, [ /* dismissButton */ ]);
});

var CommandRunAlert = function(text) {
    dump("we got a message");
    dump(text);
}
