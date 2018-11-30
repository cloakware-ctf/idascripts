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
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler(stream=sys.stdout)
    logger.addHandler(handler)

try:
    Wait()
    name = os.path.basename(idaapi.get_input_file_path())

    for seg_ea in Segments():
    # For each of the functions
        for ea in Functions(seg_ea, SegEnd(seg_ea)):
            old_name=GetFunctionName(ea)
            if not old_name.startswith("sub"):
                continue
            new_name="%s_%s" % (name, old_name)
            idc.MakeNameEx(ea, new_name, idc.SN_NOWARN)

except:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

idascript.exit()
