#!/usr/bin/env python3
"""scriptc 0.1.7 lib-runtime fix: re-include scr_async.c and scr_child.c.

scriptc's library lane (LIB_RUNTIME_SOURCES, inside the @scriptc/compiler
package) drops scr_async.c / scr_child.c assuming nothing references them,
but scr_bytes_io.c (plus the gated fetch / file_handle / test units) call
scr_promise_settled_ref / _void and scr_children_* / scr_now_ms defined
there. The produced .lib.a then carries unresolvable symbols and the linked
.so fails at runtime with:

    dlopen failed: cannot locate symbol "scr_promise_settled_ref"

This patch re-includes only scr_async.c. scr_child.c stays excluded (its
POSIX arm calls posix_spawn*, absent from bionic); the eight scr_children_*
hooks scr_async.c references are supplied by ci/android_child_stubs.c at
link time. It searches for native-toolchain.js under the
given root (default: scriptc-try), so it does not depend on the exact npm
hoisting layout; it patches every copy that still contains the pattern.

Usage: python3 ci/patch_scriptc_lib_runtime.py [path-or-root]
"""
import glob
import os
import shutil
import sys

arg = sys.argv[1] if len(sys.argv) > 1 else "scriptc-try"
old = ('f !== "scr_async.c" && f !== "scr_crypto_async.c" && '
       'f !== "scr_child.c" && f !== "scr_ffi.c"')
new = 'f !== "scr_crypto_async.c" && f !== "scr_child.c" && f !== "scr_ffi.c"'

if os.path.isfile(arg):
    files = [arg]
else:
    files = sorted(set(glob.glob(os.path.join(arg, "**", "native-toolchain.js"),
                                  recursive=True)))
assert files, "native-toolchain.js not found under " + arg

patched = []
already = []
for f in files:
    src = open(f, encoding="utf-8").read()
    if old in src:
        open(f, "w", encoding="utf-8").write(src.replace(old, new, 1))
        patched.append(f)
    elif new in src:
        already.append(f)
assert patched or already, "target pattern not found in any candidate: %r" % files
for f in patched:
    print("patched:", f)
for f in already:
    print("already patched:", f)
print("done: %d patched, %d already" % (len(patched), len(already)))

# -- place the ucontext compat shim into the runtime source dir ---------
# scr_async.c does `#include <ucontext.h>`; with `-I <runtime-src>` searched
# before system paths, this shim forwards to <sys/ucontext.h> (real type
# definitions) and adds the three declarations bionic is missing. The trap
# definitions come from ci/android_ucontext_stubs.c at link time.
if os.path.isdir(arg):
    compat = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "android_ucontext_compat.h")
    placed = 0
    for d in glob.glob(os.path.join(arg, "**", "@scriptc", "runtime", "src"),
                       recursive=True):
        shutil.copyfile(compat, os.path.join(d, "ucontext.h"))
        print("placed ucontext.h compat in", d)
        placed += 1
    assert placed, "@scriptc/runtime/src not found under " + arg