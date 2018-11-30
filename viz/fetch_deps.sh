#!/bin/bash
mkdir -p deps.js
curl https://unpkg.com/d3@4.13.0/build/d3.min.js -o deps.js/d3.v4.min.js
curl https://unpkg.com/d3-scale-chromatic@1.1.1/build/d3-scale-chromatic.js -o deps.js/d3-scale-chromatic.v1.min.js
curl https://raw.githubusercontent.com/d3/d3-plugins/master/hive/hive.js -o deps.js/hive.js
curl https://raw.githubusercontent.com/d3/d3-plugins/master/keybinding/keybinding.js -o deps.js/keybinding.js

