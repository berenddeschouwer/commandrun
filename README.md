= Introduction =

CommandRun is a browser extension to allow executing native commands.

CommandRun is typically used in Kiosk environments where it's desired
to run a restricted set of commands from a locked-down browser.  These
commands may include reboot, or start a flash drive.

The list of websites and commands are configurable.

= Build =

You can build CommandRun from this source by running 'make all'.  To build
CommandRun with different defaults, try:
```make PREFIX=/usr ALLOWED_COMMANDS=/usr/bin/reboot
```

= Requirements for Compilation =

sed.  Basically sed is used as a precompiler for macro expansion.

= Suggested (but not required) for Compilation =

* pylint
* closure-compiler

These tools are used to do python and javascript checking, so they are
suggested when modifying the source.  They are not required to build.

= Install =

== User ==

The extension can be installed per user using the browser add-on preferences.

If you choose to do this, you'll have to install the App manifest in
~/.mozilla/native-messaging-hosts/ and edit commandrun.json to point to
the path for the binary yourself.

== System ==

You can install the extension system-wide.  This will also install
the native app.

```make install
```

= History =

The XUL add-on was written by Achim Abeling <achimabeling@web.de>

For more information, go to https://github.com/berenddeschouwer/commandrun
