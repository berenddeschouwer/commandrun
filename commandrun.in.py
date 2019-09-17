#!/usr/bin/python3

"""
commandrun.py native messaging app

commandrun.py will run commands received from the CommandRun webextension,
and returns output from those commands back to the browser.

Accepts WebExtension (json) strings on stdin and returns messages
to the browser on stdout.  WebExtension messages are pre-pended with
a 4-byte length, native byte order.

Accepted JSON:

    {
        "action": "run" (string) /* currently only 'run' */
        "handle": (integer)      /* Messages will be passed back with this
                                  * handle.  Intended to keep multiple
                                  * commands separate.
                                  * >0 - handle
                                  */
        "what": (array)          /* which command to run, as passed to execv():
                                  * [0]   - command name
                                  * [1]   - first argument
                                  * [...]
                                  */
    }

Returned JSON:

    {
        "handle": (integer)      /* Matching handle to input
                                  * <0 - error
                                  */
        "errno":  (integer)      /* Errno of command
                                  * 0  - success
                                  * >0 - error from command
                                  * <0 - API error
                                  *    - -1 forbidden command
                                  *    - -2 invalid input to native app
                                  */
        "stdout": (string)       /* stdout from command */
        "stderr": (string)       /* stderr from command, or
                                  * strerror(errno) on error
                                  */
    }
"""

import json
import sys
import struct
import os
import subprocess
import base64
import signal
import logging


#
#  We set the logger as a global, so that every function uses the
#  same one.
#
# pylint: disable=invalid-name
logger = None


def start_logging():
    """
    function

    @returns logging object

    Sets some default logging options.  Some of those options are set
    according to Makefile variables.
    """
    this = logging.getLogger('commandrun.py')
    #
    # Set debug according to a Makefile flag.  This is a string and not
    # a boolean.  In Javascript they are all lowercase.
    #
    if "@DEBUG_FLAG@" == "true":
        this.setLevel(logging.DEBUG)
    else:
        this.setLevel(logging.INFO)
    channel = logging.StreamHandler()
    channel.setLevel(logging.DEBUG)
    formatter = logging.Formatter("[%(process)d]%(levelname)s:%(funcName)s:%(lineno)s: %(message)s")
    channel.setFormatter(formatter)
    this.addHandler(channel)
    return this


def wait_for_children(sig, frame):
    """signal handler

    Simple signal handler to clean up zombie children
    """
    # pylint: disable=unused-argument
    os.wait()


def send_message(message):
    """function

    @param {json} message

    Send the message in WebExtension Native Messaging format on stdout.
    This means pre-pend native byte order length.
    """
    logger.debug("message=%s", str(message))
    encoded_content = json.dumps(message).encode("utf-8")
    sys.stdout.buffer.write(struct.pack('=I', len(encoded_content)))
    sys.stdout.buffer.write(encoded_content)
    sys.stdout.flush()


def send_response(hndl, errno, out, err=""):
    """function

    @param {int}        hndl  - A matching handle
    @param {int}        errno - error number
    @param {byte array} out   - stdout
    @param {byte array} err   - stderr

    stdout and stderr are base64 encoded to fit into JSON
    """
    logger.debug("Handle=%d", hndl)
    logger.debug("Errno=%d", errno)
    logger.debug("Out=%s", out)
    response = {}
    response["handle"] = hndl
    response["errno"] = errno
    response["stdout"] = base64.b64encode(out).decode("ascii")
    response["stderr"] = base64.b64encode(err).decode("ascii")
    send_message(response)


def get_message():
    """function

    @returns json

    Read a Native Message WebExtension message from the browser, and
    return the JSON object.
    """
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(1)
    message_length = struct.unpack('=I', raw_length)[0]
    logger.debug("message length: %d", message_length)
    if message_length > 1000000:
        send_response(-1, -1, "", "message too long")
        sys.exit(1)
    msg = sys.stdin.buffer.read(message_length)
    msg = msg.decode("utf-8")
    return json.loads(msg)


def main():
    """main
    """
    # pylint: disable=global-statement
    global logger
    logger = start_logging()
    logger.debug("changing directory")
    os.chdir("/")
    logger.debug("waiting for signals")
    signal.signal(signal.SIGCHLD, wait_for_children)
    while True:
        logger.debug("loop started")
        message = get_message()
        logger.debug("message=%s", message)
        if message["action"] == "run":
            logger.debug("creating instance")
            handle = message["handle"]
            logger.debug("handle of type %s", type(handle))
            logger.debug("forking")
            pid = os.fork()
            logger.debug("forked")
            if pid < 0:
                logger.debug("fork crashed")
            elif pid > 0: # parent
                logger.debug("parent")
            else:
                logger.debug("child")
                myhandle = handle
                stufftorun = message["what"]
                logger.debug("stufftorun: %s", str(stufftorun))
                running = subprocess.Popen(stufftorun,
                                           stdout=subprocess.PIPE,
                                           stderr=subprocess.PIPE)
                running.wait()
                logger.debug("sending done\n")
                send_response(myhandle, running.returncode, running.stdout.read())
                #  Close this process, but don't quit the main program.
                os._exit(0) # pylint: disable=protected-access
        else:
            logger.debug("bad action: %s", message["action"])
            handle = message["handle"]
            send_response(handle, -1, "", "unknown action")


if __name__ == "__main__":
    main()
