= Introduction =

CommandRun is a browser extension to allow executing native commands.

CommandRun is typically used in Kiosk environments where it's desired
to run a restricted set of commands from a locked-down browser.  These
commands may include reboot, or start a flash drive.

The list of websites and commands are configurable.

= Build =

You can build CommandRun from this source by running 'make all'.  To build
CommandRun with different defaults, try:
```ALLOWED_COMMANDS=/usr/bin/reboot make -e all
```

For more information, go to https://github.com/berenddeschouwer/commandrun
