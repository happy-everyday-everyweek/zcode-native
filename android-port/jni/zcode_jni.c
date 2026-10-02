/* ZCode Android port: JNI shim over the scriptc-built static archive
 * (.scriptc/port-entry.lib.a). Exposes the zc_* entry family to
 * com.zcode.port.NativeCore.
 *
 * Embedder contract (scriptc library mode): one instance, one thread —
 * call init() once before other entries; every result stays valid until
 * the next entry call; results are NUL-terminated after out_len. */
#include <jni.h>
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <android/log.h>

extern void zc_init(void);
extern void zc_collect(void);
extern void zc_set_panic_sink(void (*fn)(void *, const uint8_t *, size_t, uint64_t), void *ctx);
extern void zc_session_id(const uint8_t **out, size_t *out_len);
extern void zc_turn_id(const uint8_t **out, size_t *out_len);
extern void zc_event_id(const uint8_t **out, size_t *out_len);
extern void zc_trace_id(const uint8_t **out, size_t *out_len);
extern void zc_uuid7(const uint8_t **out, size_t *out_len);
extern void zc_uuid(const uint8_t **out, size_t *out_len);
extern void zc_egress_check(const uint8_t *p, size_t len, const uint8_t **out, size_t *out_len);

static void zc_port_sink(void *ctx, const uint8_t *msg, size_t len, uint64_t addr) {
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
    __android_log_print(ANDROID_LOG_ERROR, "ZCodePort", "panic: %s", buf);
}

JNIEXPORT void JNICALL
Java_com_zcode_port_NativeCore_init(JNIEnv *env, jclass clazz) {
    (void)env;
    (void)clazz;
    zc_set_panic_sink(zc_port_sink, NULL);
    zc_init();
}

JNIEXPORT void JNICALL
Java_com_zcode_port_NativeCore_collect(JNIEnv *env, jclass clazz) {
    (void)env;
    (void)clazz;
    zc_collect();
}

static jstring zc_port_to_jstring(JNIEnv *env, const uint8_t *p, size_t len) {
    (void)len; /* results are NUL-terminated after out_len by contract */
    if (p == NULL) {
        return (*env)->NewStringUTF(env, "");
    }
    return (*env)->NewStringUTF(env, (const char *)p);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_sessionId(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_session_id(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_turnId(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_turn_id(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_eventId(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_event_id(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_traceId(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_trace_id(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_uuid7(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_uuid7(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_uuid(JNIEnv *env, jclass clazz) {
    const uint8_t *out = NULL;
    size_t len = 0;
    (void)clazz;
    zc_uuid(&out, &len);
    return zc_port_to_jstring(env, out, len);
}

JNIEXPORT jstring JNICALL
Java_com_zcode_port_NativeCore_egressCheck(JNIEnv *env, jclass clazz, jstring ip) {
    (void)clazz;
    const char *p = (*env)->GetStringUTFChars(env, ip, NULL);
    if (p == NULL) {
        return (*env)->NewStringUTF(env, "oom");
    }
    jsize n = (*env)->GetStringUTFLength(env, ip);
    const uint8_t *out = NULL;
    size_t len = 0;
    zc_egress_check((const uint8_t *)p, (size_t)n, &out, &len);
    (*env)->ReleaseStringUTFChars(env, ip, p);
    return zc_port_to_jstring(env, out, len);
}