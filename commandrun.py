#!/usr/bin/python3

# Note that running python with the `-u` flag is required on Windows,
# in order to ensure that stdin and stdout are opened in binary, rather
# than text, mode.

import json
import sys
import struct
import syslog
import os
import time
import subprocess
import base64

# Read a message from stdin and decode it.
def get_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        sys.exit(0)
    message_length = struct.unpack('=I', raw_length)[0]
    sys.stderr.write("message length: %d\n" % message_length)
    message = sys.stdin.buffer.read(message_length)
    message = message.decode("utf-8")
    return json.loads(message)


# Encode a message for transmission, given its content.
def encode_message(message_content):
    sys.stderr.write("message=%s\n" % str(message_content))
    sys.stderr.flush()
    encoded_content = json.dumps(message_content).encode("utf-8")
    encoded_length = struct.pack('=I', len(encoded_content))
    return {'length': encoded_length, 'content': encoded_content}


# Send an encoded message to stdout.
def send_message(encoded_message):
    sys.stdout.buffer.write(encoded_message['length'])
    sys.stdout.buffer.write(encoded_message['content'])
    sys.stdout.flush()

def send_response(handle, errno, out, err=""):
    sys.stderr.write("Handle: %d\n" % handle)
    sys.stderr.write("Errno: %d\n" % errno)
    sys.stderr.write("Out: %s\n" % out)
    sys.stderr.flush()
    response = {}
    response["handle"] = handle
    response["errno"] = errno
    response["stdout"] = base64.b64encode(out).decode("ascii")
    response["stderr"] = err
    msg = encode_message(response)
    send_message(msg)


sys.stderr.write("help\n")
sys.stderr.write("me\n")
#sys.stderr.flush()
syslog.syslog("starting")
sys.stderr.write("logged\n")
while True:
    sys.stderr.write("loop\n")
    message = get_message()
    sys.stderr.write("got message\n")
    sys.stderr.write("message: %s\n" % message)
    sys.stderr.flush()
    if message["action"] == "run":
        sys.stderr.write("creating instance\n")
        sys.stderr.flush()
        handle = message["handle"]
        sys.stderr.write("handle of type %s\n" % type(handle))
        sys.stderr.flush()
        sys.stderr.write("forking\n")
        sys.stderr.flush()
        pid = os.fork()
        sys.stderr.write("forked\n")
        sys.stderr.flush()
        if pid < 0:
            sys.stderr.write("fork crashed\n")
            sys.stderr.flush()
        elif pid > 0: # parent
            sys.stderr.write("parent\n")
            sys.stderr.flush()
            pass
        else:
            sys.stderr.write("child\n")
            sys.stderr.flush()
            myhandle = handle
            #time.sleep(1)
            stufftorun = message["what"]
            sys.stderr.write("stufftorun: %s\n" % str(stufftorun))
            sys.stderr.flush()
            running = subprocess.Popen(stufftorun,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            running.wait()
            sys.stderr.write("sending done\n")
            sys.stderr.flush()
            #send_message(encode_message("done"))
            send_response(myhandle, running.returncode, running.stdout.read())
            os._exit(0) # quit forked process
    else:
        sys.stderr.write("bad action\n")
        sys.stderr.flush()