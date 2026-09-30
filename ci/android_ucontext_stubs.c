/* Fail-fast traps for the three ucontext functions bionic does not
 * implement (see ci/android_ucontext_compat.h for the full rationale).
 *
 * The scriptc library lane requires an async_free module graph (SC4005:
 * no async functions, no await, no promise values, no generators), which
 * statically guarantees the fiber / stack-switch machinery inside
 * scr_async.c can never run. These definitions exist so the linked .so
 * resolves getcontext / makecontext / swapcontext; if any of them is ever
 * reached, something changed in that contract, so fail loudly — and record
 * the fact in the diagnostic log first (v5.23: the log path comes from the
 * JNI shim's global zcode_diag_dir; the fallback keeps the trap useful even
 * before setDiagDir runs).
 */
#include <sys/ucontext.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <unistd.h>

extern char zcode_diag_dir[];

static void scr_android_ucontext_trap(const char *fn) {
    const char *dir = (zcode_diag_dir[0] != 0) ? zcode_diag_dir
                                               : "/sdcard/Android/media/com.zcode.rpc";
    char p[360];
    snprintf(p, sizeof p, "%s/crash_native.log", dir);
    int fd = open(p, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (fd >= 0) {
        char b[192];
        int n = snprintf(b, sizeof b,
                         "trap: %s reached (android port, native stack switching "
                         "unsupported on bionic)\n", fn);
        if (n > 0) {
            (void)write(fd, b, (size_t)n);
        }
        close(fd);
    }
    fprintf(stderr,
            "scriptc: internal error: %s reached on aarch64-linux-android "
            "(native stack switching is not supported on bionic)\n",
            fn);
    abort();
}

int getcontext(ucontext_t *ucp) {
    (void)ucp;
    scr_android_ucontext_trap("getcontext");
    return -1;
}

int makecontext(ucontext_t *ucp, void (*func)(void), int argc, ...) {
    (void)ucp;
    (void)func;
    (void)argc;
    scr_android_ucontext_trap("makecontext");
    return -1;
}

int swapcontext(ucontext_t *oucp, const ucontext_t *ucp) {
    (void)oucp;
    (void)ucp;
    scr_android_ucontext_trap("swapcontext");
    return -1;
}