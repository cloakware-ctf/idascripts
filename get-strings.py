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
import sys
import idautils
import idascript
import logging

logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler(stream=sys.stdout)
    logger.addHandler(handler)

try:
    # argument processing, file open
    output_file = None
    if len(sys.argv) >= 2:
        output_file = sys.argv[1]

    # get strings from ida
    s = idautils.Strings()
    s.setup(only_7bit=True) #I think this still pulls-in unicode strings
    s.refresh()

    # print them out
    if output_file is None:
        for one_ida_string in s:
            sys.stdout.write("%s\n" % str(one_ida_string).encode('string_escape', 'backslashreplace'))
    else:
        with open(output_file, 'w') as f:
            for one_ida_string in s:
                f.write("%s\n" % str(one_ida_string).encode('string_escape', 'backslashreplace'))

except:
    exc_type, exc_value, exc_traceback = sys.exc_info()
    logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

idascript.exit()

