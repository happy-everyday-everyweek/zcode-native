package com.zcode.rpc;

public final class NativeCore {
    static {
        System.loadLibrary("zcodecore");
    }

    private NativeCore() {}

    public static native void init();

    public static native void collect();

    public static native String probeOnce();
}