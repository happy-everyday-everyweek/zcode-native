/* Fail-fast traps for the three ucontext functions bionic does not
 * implement (see ci/android_ucontext_compat.h for the full rationale).
 *
 * The scriptc library lane requires an async_free module graph (SC4005:
 * no async functions, no await, no promise values, no generators), which
 * statically guarantees the fiber / stack-switch machinery inside
 * scr_async.c can never run. These definitions exist so the linked .so
 * resolves getcontext / makecontext / swapcontext; if any of them is ever
 * reached, something changed in that contract, so fail loudly instead of
 * corrupting control flow.
 */
#include <sys/ucontext.h>
#include <stdio.h>
#include <stdlib.h>

static void scr_android_ucontext_trap(const char *fn) {
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