package ir.mjbakhshi.sarvestan;

import android.content.Intent;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Bundle;

import androidx.annotation.NonNull;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static String sPendingShortcut = null;

    public static synchronized String consumePendingShortcut() {
        String target = sPendingShortcut;
        sPendingShortcut = null;
        return target;
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SsoLoginPlugin.class);
        registerPlugin(SsoWebViewPlugin.class);
        registerPlugin(SarvestanClassAlarmPlugin.class);
        registerPlugin(SarvestanWidgetPlugin.class);
        registerPlugin(SarvestanSharePlugin.class);
        registerPlugin(SarvestanIconPlugin.class);
        registerPlugin(SarvestanInstallerPlugin.class);
        super.onCreate(savedInstanceState);
        SarvestanIconPlugin.syncShortcuts(this, null);
        handleShortcutIntent(getIntent());
    }

    @Override
    public void onResume() {
        super.onResume();
        SarvestanIconPlugin.syncShortcuts(this, null);
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        SarvestanIconPlugin.syncShortcuts(this, null);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShortcutIntent(intent);
    }

    private void handleShortcutIntent(Intent intent) {
        if (intent == null) return;
        String target = "";
        if (intent.hasExtra("shortcut_target")) {
            target = intent.getStringExtra("shortcut_target");
        }
        if (target == null || target.isEmpty()) {
            Uri data = intent.getData();
            if (data != null && "sarvestan".equalsIgnoreCase(data.getScheme())) {
                String path = data.getPath();
                String host = data.getHost();
                if (path != null && !path.isEmpty() && !"/".equals(path)) {
                    target = path.replace("/", "").trim();
                } else if (host != null) {
                    target = host.trim();
                }
            }
        }
        if (target != null && !target.isEmpty()) {
            final String finalTarget = target;
            sPendingShortcut = finalTarget;
            triggerShortcutInWebView(finalTarget, 400);
            triggerShortcutInWebView(finalTarget, 1000);
            triggerShortcutInWebView(finalTarget, 2000);
        }
    }

    private void triggerShortcutInWebView(String target, int delayMs) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().postDelayed(() -> {
                getBridge().getWebView().evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('sarvShortcut', { detail: '" + target + "' }));",
                    null
                );
            }, delayMs);
        }
    }
}
