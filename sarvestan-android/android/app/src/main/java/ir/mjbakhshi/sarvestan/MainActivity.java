package ir.mjbakhshi.sarvestan;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SsoWebViewPlugin.class);
        registerPlugin(SarvestanWidgetPlugin.class);
        registerPlugin(SarvestanSharePlugin.class);
        registerPlugin(SarvestanIconPlugin.class);
        registerPlugin(SarvestanInstallerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
