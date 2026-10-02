/* ZCode Android port: libc compatibility shims for the scriptc-built slice.
 *
 * The zig-compiled runtime units carry glibc-flavored references that
 * bionic (Android libc) does not export; without these definitions the
 * loaded .so fails its eager (BIND_NOW) symbol resolution on device.
 * Each shim below is a faithful thin mapping onto the bionic surface, or
 * a guarded abort for surfaces outside the ported slice. */

#include <stdarg.h>
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <errno.h>
#include <android/log.h>

/* glibc/musl-style assertion failure: log with location, then abort. */
void __assert_fail(const char *expr, const char *file, unsigned int line, const char *func) {
    __android_log_assert(expr, "ZCodePort", "%s:%u: %s", file ? file : "?", line, func ? func : "?");
    abort();
}

/* glibc errno accessor -> bionic __errno(). */
int *__errno_location(void) {
    return __errno();
}

/* C23 libc redirects (glibc >= 2.38 headers): classic semantics suffice here. */
long __isoc23_strtol(const char *nptr, char **endptr, int base) {
    return strtol(nptr, endptr, base);
}

int __isoc23_sscanf(const char *str, const char *format, ...) {
    va_list ap;
    va_start(ap, format);
    int r = vsscanf(str, format, ap);
    va_end(ap);
    return r;
}

/* glibc tolower table accessor: table indexed [-128..255] via a pointer
 * published once; values come from bionic's tolower for the byte range. */
const int **__ctype_tolower_loc(void) {
    static int table[384];
    static int ready = 0;
    static const int *published;
    if (!ready) {
        for (int i = -128; i < 256; i++) {
            int c = i;
            table[i + 128] = (c >= 0 && c <= 255) ? tolower(c) : c;
        }
        published = table + 128;
        ready = 1;
    }
    return &published;
}

/* bionic has no bcmp. */
int bcmp(const void *a, const void *b, size_t n) {
    return memcmp(a, b, n);
}

/* Promise helpers missing from the pruned async unit of this archive:
 * the ported slice (id / network-policy exports) never reaches them; guard
 * hard so any future async surface fails loudly instead of silently. */
void scr_promise_settled_ref(void) {
    __android_log_assert("scr_promise_settled_ref", "ZCodePort", "async promise surface not ported yet");
}

void scr_promise_settled_void(void) {
    __android_log_assert("scr_promise_settled_void", "ZCodePort", "async promise surface not ported yet");
}