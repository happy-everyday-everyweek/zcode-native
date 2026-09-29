/* Android (bionic) child-unit stubs for the scriptc library archive.
 *
 * scriptc's library lane (LIB_RUNTIME_SOURCES, patched by
 * ci/patch_scriptc_lib_runtime.py) re-includes scr_async.c so the archive
 * defines scr_promise_settled_* (required by scr_bytes_io.c). scr_async.c
 * references the eight scr_children_* loop quiescence hooks whose real
 * implementation lives in scr_child.c — but that unit's POSIX arm calls
 * posix_spawn*(), which bionic does not provide, so it cannot be compiled
 * for the aarch64-linux-android target.
 *
 * The library build requires an async_free module graph (SC4005): no
 * library entry can reach the event loop or create a child process, so the
 * child registry is permanently empty and these hooks are unobservable.
 * The stubs mirror the empty-state behavior of the real unit and match the
 * official __wasi__ stubs inside scr_async.c, which exist for the same
 * reason: a target without process-spawn capability.
 */
#include <stdbool.h>

bool scr_children_pending(void) { return false; }
bool scr_children_ready(void) { return false; }
bool scr_children_reffed_pending(void) { return false; }
bool scr_children_failed_pending(void) { return false; }
void scr_children_poll(void) {}
int scr_children_wake_fd(void) { return -1; }
bool scr_children_wait(double max_wait_ms) { (void)max_wait_ms; return false; }
void scr_children_teardown(void) {}