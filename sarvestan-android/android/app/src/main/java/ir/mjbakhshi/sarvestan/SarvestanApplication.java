package ir.mjbakhshi.sarvestan;

import android.app.Application;

public class SarvestanApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        SsoLoginPlugin.installGlobalTrustAllSsl();
    }
}
