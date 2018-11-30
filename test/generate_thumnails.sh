#!/bin/bash

CHROME="chrome"
if test -e "/Applications/Google Chrome.app/"; then
	CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

# "${CHROME}" --headless --disable-gpu --hide-scrollbars --window-size=1100,750 --screenshot=test.png libprotobuf_allxrefs.json.html

find "$@" -type f -name '*\.html' | parallel cd {//} \; \"${CHROME}\" --headless --disable-gpu --hide-scrollbars --window-size=1100,750 --screenshot={/.}.png {/}

