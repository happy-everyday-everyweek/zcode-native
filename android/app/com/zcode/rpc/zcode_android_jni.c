/* ZCode aarch64 port: JNI shim over the scriptc-built library
 * (rpc-probe.lib.a -> linked into libzcodecore.so).
 * Exposes zr_* entries to com.zcode.rpc.NativeCore.
 *
 * Embedder contract (scriptc library mode): one instance, one thread —
 * call init() once before other entries; every result stays valid until
 * the next entry call; results are NUL-terminated after out_len. */
#include <jni.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <android/log.h>

extern void zr_init(void);
extern void zr_collect(void);
extern void zr_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void zr_rpc_probe_once(const uint8_t **out, size_t *out_len);

static void zr_port_sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
    (void)ctx;
    (void)addr;
    char buf[480];
    size_t n = len < sizeof(buf) - 1 ? len : sizeof(buf) - 1;
    if (msg != NULL) {
        memcpy(buf, msg, n);
    } else {
        n = 0;
    }
    buf[n] = 0;
    __android_log_print(ANDROID_LOG_ERROR, "ZCodeRpc", "panic: %s", buf);
}

JNIEXPORT void JNICALL
Java_com_zcode_rpc_NativeCore_init(JNIEnv *env, jclass clazz) {
    (void)env;
    (void)clazz;
    zr_set_panic_sink(zr_port_sink, NULL);
    zr_init();
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