package com.zcode.port;

import android.app.Activity;
import android.os.Bundle;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private final StringBuilder sb = new StringBuilder();
    private TextView tv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        tv = new TextView(this);
        tv.setTextSize(13f);
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        tv.setPadding(pad, pad, pad, pad);
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        setContentView(sv);

        // 原生入口约定：单实例、单线程；先 init，再调用其它入口。
        Executors.newSingleThreadExecutor().execute(() -> {
            section1StaticSlice();
            section2DynamicCore();
            runOnUiThread(() -> tv.setText(sb.toString()));
        });
    }

    /** 静态层：libzcodecore.so（scriptc library 模式 + JNI，zc_* 导出）。 */
    private void section1StaticSlice() {
        sb.append("== 1. 静态层切片 libzcodecore.so (JNI) ==\n");
        try {
            NativeCore.init();
            sb.append("init: ok\n");
            sb.append("sessionId: ").append(NativeCore.sessionId()).append('\n');
            sb.append("turnId:    ").append(NativeCore.turnId()).append('\n');
            sb.append("eventId:   ").append(NativeCore.eventId()).append('\n');
            sb.append("traceId:   ").append(NativeCore.traceId()).append('\n');
            sb.append("uuid7:     ").append(NativeCore.uuid7()).append('\n');
            sb.append("uuid:      ").append(NativeCore.uuid()).append('\n');
            sb.append("egress(10.0.0.5): ").append(NativeCore.egressCheck("10.0.0.5")).append('\n');
            sb.append("egress(8.8.8.8):  ").append(NativeCore.egressCheck("8.8.8.8")).append('\n');
            sb.append("egress(::1):      ").append(NativeCore.egressCheck("::1")).append('\n');
            NativeCore.collect();
            sb.append("collect: ok\n");
        } catch (Throwable t) {
            sb.append("FAIL: ").append(t).append('\n');
        }
        sb.append('\n');
    }

    /** 动态层：library 模式无法嵌入动态岛引擎，真实 zod 校验走原生可执行车道。 */
    private void section2DynamicCore() {
        sb.append("== 2. 动态层核心 libzcodecore_cli.so (原生可执行) ==\n");
        File bin = new File(getApplicationInfo().nativeLibraryDir, "libzcodecore_cli.so");
        if (!bin.exists()) {
            sb.append("missing: ").append(bin.getAbsolutePath()).append('\n');
            return;
        }
        try {
            Process p = new ProcessBuilder(bin.getAbsolutePath())
                    .redirectErrorStream(true)
                    .start();
            BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = r.readLine()) != null) {
                sb.append(line).append('\n');
            }
            sb.append("exit=").append(p.waitFor()).append('\n');
        } catch (Throwable t) {
            sb.append("FAIL: ").append(t).append('\n');
        }
    }
}