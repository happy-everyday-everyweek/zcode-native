package com.zcode.rpc;

import android.app.Activity;
import android.os.Bundle;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView tv = new TextView(this);
        tv.setTextSize(12f);
        tv.setPadding(24, 24, 24, 24);

        StringBuilder sb = new StringBuilder();
        try {
            NativeCore.init();
            sb.append("init: OK\n");
            for (int i = 0; i < 3; i++) {
                String r = NativeCore.probeOnce();
                sb.append("probe#").append(i + 1).append(": ").append(r).append("\n");
            }
            NativeCore.collect();
            sb.append("collect: OK\n");
        } catch (Throwable t) {
            sb.append("ERROR: ").append(t).append("\n");
        }

        tv.setText(sb.toString());
        ScrollView sv = new ScrollView(this);
        sv.addView(tv);
        setContentView(sv);
    }
}