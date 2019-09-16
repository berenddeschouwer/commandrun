PREFIX := /usr/local
LIBEXECDIR := $(PREFIX)/libexec
LIBDIR := $(PREFIX)/lib
MOZDIR := $(LIBDIR)/mozilla/
EXTENSION_DIR := $(MOZDIR)/extensions/
NATIVE_MANIFEST_DIR := $(MOZDIR)/mozilla/native-messaging-hosts/

ALLOWED_COMMANDS := /usr/bin/false, /usr/bin/true
PERMITTED_SITES := .localdomain, server

EXT_SOURCE := background/background.in.js options/options.in.js
EXT_RUN := $(patsubst %.in.js,%.js,$(EXT_SOURCE)) \
           options/options.html content/content.js
PY_SOURCE := commandrun.in.py
PY_RUN := $(patsubst %.in.py,%.py,$(PY_SOURCE))

DOC_FILES := LICENSE README.md
META_FILES := manifest.json native-messaging-hosts/commandrun.json
EXAMPLE_FILES := example/example.html example/example.js

all: commandrun.zip

commandrun.zip: $(DOC_FILES) $(META_FILES) $(EXAMPLE_FILES) \
	        $(EXT_RUN) $(PY_RUN)
	zip commandrun.zip $(DOC_FILES) $(EXAMPLE_FILES) $(META_FILES) \
	    $(PY_RUN) $(EXT_RUN)

%.py: %.in.py
	sed -e "s|@ALLOWED_COMMANDS@|$(ALLOWED_COMMANDS)|g" \
	    -e "s|@PERMITTED_SITES@|$(PERMITTED_SITES)|g" \
	    $< > $@

%.js: %.in.js
	sed -e "s|@ALLOWED_COMMANDS@|$(ALLOWED_COMMANDS)|g" \
	    -e "s|@PERMITTED_SITES@|$(PERMITTED_SITES)|g" \
	    $< > $@

%.json: %.in.json
	sed -e "s|@LIBEXECDIR@|$(LIBEXECDIR)|g" \
	    $< > $@

install: all
	install -d $(DESTDIR)$(LIBEXECDIR)/
	install -m 755 commandrun.py $(DESTDIR)$(LIBEXECDIR)/
	install -d $(DESTDIR)$(NATIVE_MANIFEST_DIR)/
	install -m 644 native-messaging-hosts/commandrun.json \
	        $(DESTDIR)$(NATIVE_MANIFEST_DIR)/commandrun.json
	install -d $(DESTDIR)$(EXTENSION_DIR)/
	install -m 644 commandrun.zip $(DESTDIR)$(EXTENSION_DIR)/
