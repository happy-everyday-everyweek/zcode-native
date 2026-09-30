package com.zcode.rpc;

import android.app.Activity;
import android.os.Bundle;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.File;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;

/* v5.23 diagnostics build.
 *
 * All run/CRASH logs go to the app-specific media dir
 * (getExternalMediaDirs()[0] = /storage/emulated/0/Android/media/com.zcode.rpc),
 * which needs no permission to write and is visible to other tools:
 *   run.log          — step-by-step markers + probe results (flushed per line)
 *   crash_java.log   — uncaught Java exceptions
 *   crash_native.log — native markers / panic / signal crashes (native side)
 *   crash_maps.txt   — /proc/self/maps dump taken inside the signal handler
 */
public class MainActivity extends Activity {

    private static File diagDir = null;

    private static synchronized void log(String line) {
        try {
            if (diagDir != null) {
                FileOutputStream fos = new FileOutputStream(new File(diagDir, "run.log"), true);
                fos.write((line + "\n").getBytes(StandardCharsets.UTF_8));
                fos.flush();
                fos.close();
            }
        } catch (Throwable ignored) {
        }
    }

    private void installUncaughtHandler() {
        final Thread.UncaughtExceptionHandler prev = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler((t, e) -> {
            try {
                if (diagDir != null) {
                    StringWriter sw = new StringWriter();
                    e.printStackTrace(new PrintWriter(sw));
                    FileOutputStream fos = new FileOutputStream(new File(diagDir, "crash_java.log"), true);
                    fos.write(("=== JAVA CRASH thread=" + t.getName() + " ===\n" + sw.toString() + "\n")
                            .getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                    fos.close();
                    log("java crash logged: " + e);
                }
            } catch (Throwable ignored) {
            }
            if (prev != null) {
                prev.uncaughtException(t, e);
            }
        });
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            File[] media = getExternalMediaDirs();
            if (media != null && media.length > 0 && media[0] != null) {
                diagDir = media[0];
            }
            if (diagDir == null) {
                diagDir = getExternalFilesDir(null);
            }
            if (diagDir != null) {
                diagDir.mkdirs();
            }
        } catch (Throwable ignored) {
        }

        installUncaughtHandler();
        log("=== onCreate entered (v5.23 diag) ===");
        log("diagDir=" + diagDir);

        TextView tv = new TextView(this);
        tv.setTextSize(12f);
        tv.setPadding(24, 24, 24, 24);

        StringBuilder sb = new StringBuilder();
        try {
            log("loading native lib (setDiagDir)...");
            NativeCore.setDiagDir(diagDir == null ? "" : diagDir.getAbsolutePath());
            log("native lib loaded; calling init...");
            NativeCore.init();
            sb.append("init: OK\n");
            log("init: OK");
            for (int i = 0; i < 3; i++) {
                String r = NativeCore.probeOnce();
                sb.append("probe#").append(i + 1).append(": ").append(r).append("\n");
                log("probe#" + (i + 1) + ": " + r);
            }
            NativeCore.collect();
            sb.append("collect: OK\n");
            log("collect: OK");
        } catch (Throwable t) {
            sb.append("ERROR: ").append(t).append("\n");
            log("ERROR: " + t);
            StringWriter sw = new StringWriter();
            t.printStackTrace(new PrintWriter(sw));
            log(sw.toString());
        }
        log("=== done ===");

        tv.setText(sb.toString());
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        setContentView(sv);
    }
}