#!/usr/bin/env python3
"""scriptc 0.1.7 lib-runtime fix: re-include scr_async.c and scr_child.c.

scriptc's library lane (LIB_RUNTIME_SOURCES) drops scr_async.c / scr_child.c
assuming nothing references them, but scr_bytes_io.c (plus the gated
fetch / file_handle / test units) call scr_promise_settled_ref / _void and
scr_children_* / scr_now_ms defined there. The produced .lib.a then carries
unresolvable symbols and the linked .so fails at runtime with:

    dlopen failed: cannot locate symbol "scr_promise_settled_ref"

This patch keeps only scr_crypto_async.c and scr_ffi.c excluded from the
library runtime source list.

Usage: python3 ci/patch_scriptc_lib_runtime.py [path/to/native-toolchain.js]
"""
import sys

path = sys.argv[1] if len(sys.argv) > 1 else (
    "scriptc-try/node_modules/scriptc/dist/backend/native-toolchain.js"
)
src = open(path, encoding="utf-8").read()
old = ('f !== "scr_async.c" && f !== "scr_crypto_async.c" && '
       'f !== "scr_child.c" && f !== "scr_ffi.c"')
new = 'f !== "scr_crypto_async.c" && f !== "scr_ffi.c"'
assert old in src, "target pattern not found in " + path
open(path, "w", encoding="utf-8").write(src.replace(old, new, 1))
print("patched LIB_RUNTIME_SOURCES: scr_async.c + scr_child.c re-included")
