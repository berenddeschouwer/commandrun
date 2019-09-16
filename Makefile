ALLOWED_COMMANDS := /usr/bin/false, /usr/bin/true
PERMITTED_SITES := .localdomain, server

EXT_RUN := background/background.js content/content.js \
           options/options.html options/options.js
PY_RUN := commandrun.py

DOC_FILES := LICENSE README.md
META_FILES := manifest.json native-messaging-hosts/commandrun.json
EXAMPLE_FILES := example/example.html example/example.js

all: commandrun.zip

commandrun.zip: $(DOC_FILES) $(META_FILES) $(EXAMPLE_FILES) \
	        $(EXT_RUN) $(PY_RUN)
	zip commandrun.zip $(DOC_FILES) $(EXAMPLE_FILES) $(META_FILES) \
	    $(PY_RUN) $(EXT_RUN)

%.py: %.in.py
	sed -e "s|__ALLOWED_COMMANDS__|$(ALLOWED_COMMANDS)|g" \
	    -e "s|__PERMITTED_SITES__|$(PERMITTED_SITES)|g" \
	    $< > $@

%.js: %.in.js
	sed -e "s/abracadabra//g" $< > $@
