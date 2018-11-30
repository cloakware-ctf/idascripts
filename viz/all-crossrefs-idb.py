#   Copyright 2016-2018 Irdeto BV
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
import idascript

import sys
import os
import traceback

import idaapi

import logging

import sark
import json

# [ { label: 'label1', edges: { ea: { name: 'name', xrefs_from : { ... } } } },
#   ...
# ]

logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler(stream=sys.stdout)
    logger.addHandler(handler)

try:
    Wait()

    all_functions = dict()

    # all functions
    for seg_ea in Segments():
        for function_ea in Functions(seg_ea, SegEnd(seg_ea)):
            all_functions.update({ str(function_ea):  { 'name': GetFunctionName(function_ea) }})

    # add cross-refs
    unknown_functions = {};
    for ea in all_functions.keys():
        this_function = sark.Function(int(ea))
        xrefs_from = dict()
        for xref in this_function.xrefs_from:
            if not xref.iscode:
                continue
            try:
                xrefs_from.update({ str(xref.to) : sark.Function(xref.to).ea})
            except sark.exceptions.SarkNoFunction:
                print "unknown xref target function at 0x%x" % xref.to
                # add unknown functions
                unknown_functions.update({ str(xref.to): { 'name': 'unknown' , 'xrefs_from': {} }})
                xrefs_from.update({ str(xref.to) : xref.to})

        all_functions.get(ea).update({ 'xrefs_from': xrefs_from })

    all_functions.update(unknown_functions);

    # collect all exports in a dict by 'ea' , remove them from above all-functions dict
    all_exports = dict()
    for index, ordinal, ea, name in idautils.Entries():
        if all_functions.get(str(ea)) is not None:
            all_exports.update({ str(ea): all_functions.pop(str(ea)) })

    # collect all imports in a dict by 'ea' , remove them from above all-functions dict
    all_imports = dict()
    for ea in all_functions.keys():
        seg_name = idc.SegName(int(ea))
        if seg_name in ['extern']:
            all_imports.update({ea: all_functions.pop(ea)})

    groups_of_functions = []
    groups_of_functions.append({
        'label': 'exports',
        'edges': all_exports
    })

    groups_of_functions.append({
        'label': 'others',
        'edges': all_functions
    })

    groups_of_functions.append({
        'label': 'imports',
        'edges': all_imports
    })

    name, extension = os.path.splitext(idaapi.get_input_file_path())
    fd_out = open(name+'_allxrefs.json', 'w')
    fd_out.write(json.dumps(groups_of_functions, indent=2, sort_keys=False))

except:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

idascript.exit()
