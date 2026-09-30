/* ZCode aarch64 port: JNI shim over the scriptc-built library
 * (rpc-probe.lib.a -> linked into libzcodecore.so) + on-device crash
 * diagnostics.
 *
 * Diagnostics: every marker/panic/crash lands in
 *   /sdcard/Android/media/com.zcode.rpc/crash_native.log
 * (app-specific media dir: no permission needed to write, visible to
 * other tools). A signal handler for SIGSEGV/SIGABRT/SIGBUS/SIGILL/SIGFPE
 * records signal, fault address, pc/sp/lr and dumps /proc/self/maps to
 * crash_maps.txt before re-raising with the default disposition.
 *
 * Embedder contract (scriptc library mode): one instance, one thread —
 * call init() once before other entries; every result stays valid until
 * the next entry call; results are NUL-terminated after out_len. */
#include <jni.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdio.h>
#include <fcntl.h>
#include <unistd.h>
#include <signal.h>
#include <time.h>
#include <sys/stat.h>
#include <ucontext.h>
#include <android/log.h>

extern void zr_init(void);
extern void zr_collect(void);
extern void zr_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void zr_rpc_probe_once(const uint8_t **out, size_t *out_len);

/* Shared with the linked trap stubs (ci/android_ucontext_stubs.c). */
char zcode_diag_dir[256];

static const char *kFallback1 = "/sdcard/Android/media/com.zcode.rpc";
static const char *kFallback2 = "/storage/emulated/0/Android/media/com.zcode.rpc";

/* ── low-level append helpers (usable from signal context) ───────────── */

static int diag_open(const char *name, int try_mkdir) {
    char p[400];
    int fd = -1;
    if (zcode_diag_dir[0]) {
        snprintf(p, sizeof p, "%s/%s", zcode_diag_dir, name);
        fd = open(p, O_WRONLY | O_CREAT | O_APPEND, 0644);
        if (fd >= 0) return fd;
    }
    snprintf(p, sizeof p, "%s/%s", kFallback1, name);
    fd = open(p, O_WRONLY | O_CREAT | O_APPEND, 0644);
    if (fd < 0) {
        snprintf(p, sizeof p, "%s/%s", kFallback2, name);
        fd = open(p, O_WRONLY | O_CREAT | O_APPEND, 0644);
    }
    if (fd < 0 && try_mkdir) {
        (void)mkdir(kFallback1, 0770);
        (void)mkdir(kFallback2, 0770);
        snprintf(p, sizeof p, "%s/%s", kFallback1, name);
        fd = open(p, O_WRONLY | O_CREAT | O_APPEND, 0644);
    }
    return fd;
}

static void put_str(int fd, const char *s) {
    if (s != NULL) (void)write(fd, s, strlen(s));
}

static void put_dec(int fd, long v) {
    char b[24];
    int i = 0;
    if (v < 0) { put_str(fd, "-"); v = -v; }
    do { b[i++] = (char)('0' + (v % 10)); v /= 10; } while (v > 0);
    while (i > 0) (void)write(fd, &b[--i], 1);
}

static void put_hex(int fd, uint64_t v) {
    char b[19];
    int i = 0;
    b[i++] = '0'; b[i++] = 'x';
    do { int d = (int)(v & 15); b[i++] = (char)(d < 10 ? '0' + d : 'a' + d - 10); v >>= 4; } while (v > 0);
    while (i > 0) (void)write(fd, &b[--i], 1);
}

static const char *sig_name(int sig) {
    switch (sig) {
        case SIGSEGV: return "SIGSEGV";
        case SIGABRT: return "SIGABRT";
        case SIGBUS:  return "SIGBUS";
        case SIGILL:  return "SIGILL";
        case SIGFPE:  return "SIGFPE";
        default: return "SIG?";
    }
}

/* ── crash handling ──────────────────────────────────────────────────── */

static void zcode_crash_handler(int sig, siginfo_t *info, void *uctx_raw) {
    int fd = diag_open("crash_native.log", 1);
    if (fd >= 0) {
        put_str(fd, "\n=== NATIVE CRASH t=");
        put_dec(fd, (long)time(NULL));
        put_str(fd, " signal=");
        put_dec(fd, sig);
        put_str(fd, " (");
        put_str(fd, sig_name(sig));
        put_str(fd, ")");
        if (info != NULL) {
            put_str(fd, " code=");
            put_dec(fd, info->si_code);
            put_str(fd, " addr=");
            put_hex(fd, (uint64_t)(uintptr_t)info->si_addr);
        }
        if (uctx_raw != NULL) {
            ucontext_t *uc = (ucontext_t *)uctx_raw;
            put_str(fd, " pc=");
            put_hex(fd, (uint64_t)uc->uc_mcontext.pc);
            put_str(fd, " sp=");
            put_hex(fd, (uint64_t)uc->uc_mcontext.sp);
            put_str(fd, " lr=");
            put_hex(fd, (uint64_t)uc->uc_mcontext.regs[30]);
        }
        put_str(fd, "\n");
        close(fd);
    }
    int mfd = diag_open("crash_maps.txt", 1);
    int sfd = open("/proc/self/maps", O_RDONLY);
    if (mfd >= 0 && sfd >= 0) {
        char buf[4096];
        ssize_t n;
        put_str(mfd, "\n=== MAPS ===\n");
        while ((n = read(sfd, buf, sizeof buf)) > 0) {
            ssize_t off = 0;
            while (off < n) {
                ssize_t w = write(mfd, buf + off, (size_t)(n - off));
                if (w <= 0) break;
                off += w;
            }
        }
        close(sfd);
    }
    if (mfd >= 0) close(mfd);
    signal(sig, SIG_DFL);
    raise(sig);
}

static void zcode_install_handlers(void) {
    static char altstack[64 * 1024];
    stack_t ss;
    ss.ss_sp = altstack;
    ss.ss_size = sizeof altstack;
    ss.ss_flags = 0;
    (void)sigaltstack(&ss, NULL);

    struct sigaction sa;
    memset(&sa, 0, sizeof sa);
    sa.sa_sigaction = zcode_crash_handler;
    sa.sa_flags = SA_SIGINFO | SA_ONSTACK | SA_RESETHAND;
    sigemptyset(&sa.sa_mask);
    (void)sigaction(SIGSEGV, &sa, NULL);
    (void)sigaction(SIGABRT, &sa, NULL);
    (void)sigaction(SIGBUS, &sa, NULL);
    (void)sigaction(SIGILL, &sa, NULL);
    (void)sigaction(SIGFPE, &sa, NULL);
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
    (void)vm;
    (void)reserved;
    zcode_install_handlers();
    int fd = diag_open("crash_native.log", 1);
    if (fd >= 0) {
        put_str(fd, "marker: JNI_OnLoad entered t=");
        put_dec(fd, (long)time(NULL));
        put_str(fd, "\n");
        close(fd);
    }
    return JNI_VERSION_1_6;
}

/* ── panic sink ──────────────────────────────────────────────────────── */

static void zcode_log_panic(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
    (void)ctx;
    char buf[480];
    size_t n = len < sizeof(buf) - 1 ? len : sizeof(buf) - 1;
    if (msg != NULL) {
        memcpy(buf, msg, n);
    } else {
        n = 0;
    }
    buf[n] = 0;
    __android_log_print(ANDROID_LOG_ERROR, "ZCodeRpc", "panic: %s", buf);
    int fd = diag_open("crash_native.log", 0);
    if (fd >= 0) {
        put_str(fd, "panic: ");
        put_str(fd, buf);
        put_str(fd, " addr=");
        put_hex(fd, addr);
        put_str(fd, "\n");
        close(fd);
    }
}

/* ── JNI entries ─────────────────────────────────────────────────────── */

JNIEXPORT void JNICALL
Java_com_zcode_rpc_NativeCore_setDiagDir(JNIEnv *env, jclass clazz, jstring dir) {
    (void)clazz;
    if (dir == NULL) return;
    const char *s = (*env)->GetStringUTFChars(env, dir, NULL);
    if (s != NULL) {
        strncpy(zcode_diag_dir, s, sizeof(zcode_diag_dir) - 1);
        zcode_diag_dir[sizeof(zcode_diag_dir) - 1] = 0;
        (*env)->ReleaseStringUTFChars(env, dir, s);
        int fd = diag_open("crash_native.log", 1);
        if (fd >= 0) {
            put_str(fd, "marker: diag dir set to ");
            put_str(fd, zcode_diag_dir);
            put_str(fd, "\n");
            close(fd);
        }
    }
}

JNIEXPORT void JNICALL
Java_com_zcode_rpc_NativeCore_init(JNIEnv *env, jclass clazz) {
    (void)env;
    (void)clazz;
    int fd = diag_open("crash_native.log", 1);
    if (fd >= 0) {
        put_str(fd, "marker: enter zr_init\n");
        close(fd);
    }
    zr_set_panic_sink(zcode_log_panic, NULL);
    zr_init();
    fd = diag_open("crash_native.log", 0);
    if (fd >= 0) {
        put_str(fd, "marker: zr_init returned\n");
        close(fd);
    }
}

JNIEXPORT void JNICALL
Java_com_zcode_rpc_NativeCore_collect(JNIEnv *env, jclass clazz) {
    (void)env;
    (void)clazz;
    zr_collect();
}

JNIEXPORT jstring JNICALL
Java_com_zcode_rpc_NativeCore_probeOnce(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zr_rpc_probe_once(&out, &len);
    if (out == NULL) {
        return (*env)->NewStringUTF(env, "");
    }
    return (*env)->NewStringUTF(env, (const char *)out);
}