package ir.mjbakhshi.sarvestan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

/** نمایش نوتیف یادآوری کلاس و سامانه‌ها — ۱۰ دقیقه قبل، لحظه شروع یا یادآور رزرو غذای سماد */
public class ClassReminderReceiver extends BroadcastReceiver {

    public static final String CHANNEL_ID = "sarvestan_class_reminders";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_BODY = "body";
    public static final String EXTRA_NOTIF_ID = "notifId";
    public static final String EXTRA_URL = "url";
    public static final String EXTRA_DND_MODE = "dnd_mode";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;

        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        int notifId = intent.getIntExtra(EXTRA_NOTIF_ID, 0);
        String url = intent.getStringExtra(EXTRA_URL);
        String dndMode = intent.getStringExtra(EXTRA_DND_MODE);

        NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // اعمال حالت مزاحم نشوید (سایلنت خودکار) در صورت درخواست
        if (dndMode != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                if (nm.isNotificationPolicyAccessGranted()) {
                    if ("start".equalsIgnoreCase(dndMode)) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY);
                    } else if ("end".equalsIgnoreCase(dndMode)) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
                    }
                }
            } catch (Exception ignore) {}
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "یادآوری کلاس‌ها و رزرو غذا",
                    NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("اعلان‌های هوشمند پیش از شروع کلاس‌ها و یادآوری رزرو غذای سماد");
            ch.enableVibration(true);
            ch.setVibrationPattern(new long[]{0, 250, 200, 250});
            ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }

        Intent open;
        if (url != null && !url.trim().isEmpty()) {
            open = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        } else {
            open = context.getPackageManager()
                    .getLaunchIntentForPackage(context.getPackageName());
            if (open == null) open = new Intent();
        }

        PendingIntent pi = PendingIntent.getActivity(
                context,
                notifId,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        int iconRes = context.getApplicationInfo().icon;
        if (iconRes == 0) {
            iconRes = android.R.drawable.ic_lock_idle_alarm;
        }

        NotificationCompat.Builder b = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(iconRes)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pi);

        try {
            nm.notify(notifId, b.build());
        } catch (SecurityException ignore) {
            // POST_NOTIFICATIONS داده نشده
        }
    }
}
