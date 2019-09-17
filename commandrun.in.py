#!/usr/bin/python3

import json
import sys
import struct
import os
import subprocess
import base64
import signal
import logging

# pylint: disable=invalid-name
logger = None

def startLogging():
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
    # pylint: disable=unused-argument
    os.wait()

# Read a message from stdin and decode it.
def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('=I', raw_length)[0]
    logger.debug("message length: %d", message_length)
    msg = sys.stdin.buffer.read(message_length)
    msg = msg.decode("utf-8")
    return json.loads(msg)


# Encode a message for transmission, given its content.
def encode_message(message_content):
    logger.debug("message=%s\n", str(message_content))
    encoded_content = json.dumps(message_content).encode("utf-8")
    encoded_length = struct.pack('=I', len(encoded_content))
    return {'length': encoded_length, 'content': encoded_content}


# Send an encoded message to stdout.
def send_message(encoded_message):
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.flush()

def send_response(hndl, errno, out, err=""):
    logger.debug("Handle=%d", hndl)
    logger.debug("Errno=%d", errno)
    logger.debug("Out=%s", out)
    response = {}
    response["handle"] = hndl
    response["errno"] = errno
    response["stdout"] = base64.b64encode(out).decode("ascii")
    response["stderr"] = err
    msg = encode_message(response)
    send_message(msg)


def main():
    # pylint: disable=global-statement
    global logger
    logger = startLogging()
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
                #send_message(encode_message("done"))
                send_response(myhandle, running.returncode, running.stdout.read())
                #  Close this process, but don't quit the main program.
                os._exit(0) # pylint: disable=protected-access
        else:
            logger.debug("bad action: %s", message["action"])

if __name__ == "__main__":
    main()
