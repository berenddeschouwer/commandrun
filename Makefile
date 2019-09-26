PREFIX := /usr/local
LIBEXECDIR := $(PREFIX)/libexec
LIBDIR := $(PREFIX)/lib
MOZDIR := $(LIBDIR)/mozilla/
EXTENSION_DIR := $(MOZDIR)/extensions/
NATIVE_MANIFEST_DIR := $(MOZDIR)/mozilla/native-messaging-hosts/

ALLOWED_COMMANDS := /usr/bin/false, /usr/bin/true
PERMITTED_SITES := .localdomain, server
DEBUG_FLAG := true

EXT_SOURCE := background/background.in.js options/options.in.js \
              content/content.in.js
LIB_SOURCE := lib/shared.in.js
EXT_RUN := $(patsubst %.in.js,%.js,$(EXT_SOURCE))
LIB_RUN := $(patsubst %.in.js,%.js,$(LIB_SOURCE))
EXT_FILES := options/options.html
PY_SOURCE := commandrun.in.py
PY_RUN := $(patsubst %.in.py,%.py,$(PY_SOURCE))

DOC_FILES := LICENSE README.md
META_FILES := manifest.json native-messaging-hosts/commandrun.json
EXAMPLE_FILES := example/example.html example/example.js

all: commandrun.zip

commandrun.zip: $(DOC_FILES) $(META_FILES) $(EXAMPLE_FILES) \
	        $(EXT_RUN) $(LIB_RUN) $(PY_RUN) $(EXT_FILES)
	zip commandrun.zip $(DOC_FILES) $(EXAMPLE_FILES) $(META_FILES) \
	    $(PY_RUN) $(EXT_RUN) $(LIB_RUN) $(EXT_FILES)

%.py: %.in.py
	sed -e "s|@ALLOWED_COMMANDS@|$(ALLOWED_COMMANDS)|g" \
	    -e "s|@PERMITTED_SITES@|$(PERMITTED_SITES)|g" \
	    -e "s|@DEBUG_FLAG@|$(DEBUG_FLAG)|g" \
	    $< > $@

%.js: %.in.js
	sed -e "s|@ALLOWED_COMMANDS@|$(ALLOWED_COMMANDS)|g" \
	    -e "s|@PERMITTED_SITES@|$(PERMITTED_SITES)|g" \
	    -e "s|@DEBUG_FLAG@|$(DEBUG_FLAG)|g" \
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

check: all
	pylint $(PY_RUN)
	$(foreach var,$(EXT_RUN),\
	    closure-compiler \
	        --warning_level=VERBOSE \
	        --jscomp_warning=lintChecks \
	        --language_in ECMASCRIPT6_STRICT \
	        --externs externs/externs.js \
	        --js $(LIB_RUN) $(var) \
	    > /dev/null \
	;)

clean:
	rm -- $(LIB_RUN) $(EXT_RUN)
