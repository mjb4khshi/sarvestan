package ir.mjbakhshi.sarvestan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** ریبوت و آپدیت اپ، آلارم‌های ذخیره‌شده را دوباره ثبت می‌کند */
public class SarvestanBootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || "android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            SarvestanClassAlarmPlugin.restoreScheduled(context);
        }
    }
}
