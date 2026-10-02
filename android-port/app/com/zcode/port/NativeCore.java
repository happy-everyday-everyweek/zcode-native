package com.zcode.port;

/** JNI 桥：静态层切片 libzcodecore.so（scriptc library 模式产出，zc_* 导出）。 */
public final class NativeCore {
    static {
        System.loadLibrary("zcodecore");
    }

    public static native void init();

    public static native void collect();

    public static native String sessionId();

    public static native String turnId();

    public static native String eventId();

    public static native String traceId();

    public static native String uuid7();

    public static native String uuid();

    public static native String egressCheck(String ip);
}
