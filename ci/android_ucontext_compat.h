/* Android (bionic) ucontext compat shim for the scriptc library lane.
 *
 * bionic ships the ucontext_t TYPE (via <sys/ucontext.h>, including the
 * uc_link / uc_stack fields scr_async.c touches) but declares no
 * getcontext / makecontext / swapcontext functions. The library lane
 * compiles scr_async.c for the promise machinery; its fiber / stack-switch
 * paths are statically unreachable under the required async_free module
 * graph (SC4005 refuses async functions, await, promise values and
 * generators), so the three functions are provided by
 * ci/android_ucontext_stubs.c as fail-fast traps that are never expected
 * to run.
 *
 * Placed by ci/patch_scriptc_lib_runtime.py as <runtime-src>/ucontext.h so
 * that `#include <ucontext.h>` (with -I <runtime-src> searched first)
 * resolves here and then forwards to the real type definitions.
 */
#include <sys/ucontext.h>

int getcontext(ucontext_t *ucp);
int makecontext(ucontext_t *ucp, void (*func)(void), int argc, ...);
int swapcontext(ucontext_t *oucp, const ucontext_t *ucp);