#!/usr/bin/env node
/*
   Copyright 2016-2018 Irdeto BV

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const argv = yargs
    .usage('render_hive.js input_allxrefs.json [template.html]')
    .demand(1)
    .help(false)
    .argv;

template_html = path.join(__dirname, 'webstub.html')
outputHtmlFilename = 'webstub' + '.html';

if(argv._.length > 1) {
  template_html = argv._[1];
  outputHtmlFilename = argv._[0] + '.html';
}

const input = fs.readFileSync(argv._[0], 'utf8');
inputHtmlFiledata = fs.readFileSync(template_html);
inputd3script = fs.readFileSync(path.join(__dirname, 'deps.js/d3.v4.min.js'));
inputd3keybindingscript = fs.readFileSync(path.join(__dirname, 'deps.js/keybinding.js'));
inputd3hivescript = fs.readFileSync(path.join(__dirname, 'deps.js/hive.js'));
inputd3chromatic = fs.readFileSync(path.join(__dirname, 'deps.js/d3-scale-chromatic.v1.min.js'));
inputhivescript = fs.readFileSync(path.join(__dirname, 'hivecommon.js'));
inputhivestyle = fs.readFileSync(path.join(__dirname, 'hivestyle.css'));

// create output files
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%jsondata%%",input.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%d3script%%",inputd3script.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%hivecommon%%",inputhivescript.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%hivestyle%%",inputhivestyle.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%keybinding%%",inputd3keybindingscript.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%hive%%",inputd3hivescript.toString());
inputHtmlFiledata = inputHtmlFiledata.toString().replace("%%chromatic%%",inputd3chromatic.toString());
fs.writeFile(outputHtmlFilename, inputHtmlFiledata, function () {
  console.log('>> Done. Open '+outputHtmlFilename+'" in a web browser');
});


