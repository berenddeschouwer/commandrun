document.body.style.border = "5px solid red";

console.log("connecting to python script");
var port = window.runtime.connectNative("commandrun");
console.log("connected to python script");
console.log(port);
//console.log(port.error());

var p = document.createElement("p");
p.textContent = "This paragraph was added by a page script.";
p.setAttribute("id", "page-script-para");
document.body.appendChild(p);

/*
Listen for messages from the app.
*/
port.onMessage.addListener((response) => {
  console.log("Received: " + response);
});

/*
On a click on the browser action, send the app a message.
*/
p.addEventListener("click", () => {
  console.log("Sending:  ping");
  port.postMessage("ping");
});
