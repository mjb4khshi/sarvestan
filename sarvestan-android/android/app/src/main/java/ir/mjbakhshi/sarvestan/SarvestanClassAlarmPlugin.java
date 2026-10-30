package ir.mjbakhshi.sarvestan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.AlarmClock;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.SharedPreferences;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import android.content.ComponentName;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.app.Activity;
import android.util.Log;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Iterator;
import java.util.List;

/**
 * نوتیف یادآوری کلاس + ایمپورت آلارم در ساعت سیستم
 *
 * scheduleReminders: AlarmManager → ClassReminderReceiver (۱۰ دقیقه قبل + شروع)
 * importAlarms:     Intent AlarmClock.ACTION_SET_ALARM (تکرار هفتگی با EXTRA_DAYS)
 */
@CapacitorPlugin(
        name = "ClassAlarms",
        permissions = {
            @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS }),
        }
)
public class SarvestanClassAlarmPlugin extends Plugin {

    private static final int REQ_BASE = 17000;
    // زمان‌بندی‌ها روی دیسک می‌مانند تا بعد از ریبوت یا آپدیت APK دوباره ثبت شوند
    private static final String ALARM_PREFS = "sarvestan_alarms";
    private static final String ALARM_ITEMS_KEY = "items";
    private PluginCall pendingPermissionCall;

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        Context ctx = getContext();
        boolean systemEnabled = NotificationManagerCompat.from(ctx).areNotificationsEnabled();
        boolean runtimeGranted = true;
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            runtimeGranted = getPermissionState("notifications") == PermissionState.GRANTED;
        }
        boolean ok = systemEnabled && runtimeGranted;
        JSObject ret = new JSObject();
        ret.put("granted", ok);
        ret.put("systemEnabled", systemEnabled);
        ret.put("runtimeGranted", runtimeGranted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        // در اندروید ۱۳+ تا وقتی POST_NOTIFICATIONS داده نشده، areNotificationsEnabled() هم false است؛
        // اگر اول آن را چک کنیم دیالوگ مجوز سیستم هرگز نمایش داده نمی‌شود.
        if (Build.VERSION.SDK_INT >= 33
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            pendingPermissionCall = call;
            requestPermissionForAlias("notifications", call, "notificationPermissionCallback");
            return;
        }
        resolveNotificationPermission(call);
    }

    @PermissionCallback
    private void notificationPermissionCallback(PluginCall call) {
        pendingPermissionCall = null;
        resolveNotificationPermission(call);
    }

    private void resolveNotificationPermission(PluginCall call) {
        Context ctx = getContext();
        boolean systemEnabled = NotificationManagerCompat.from(ctx).areNotificationsEnabled();
        boolean runtimeGranted = Build.VERSION.SDK_INT < 33
                || getPermissionState("notifications") == PermissionState.GRANTED;
        JSObject ret = new JSObject();
        ret.put("granted", systemEnabled && runtimeGranted);
        ret.put("systemEnabled", systemEnabled);
        ret.put("runtimeGranted", runtimeGranted);
        if (!systemEnabled) ret.put("blockedInSettings", true);
        call.resolve(ret);
    }

    /** نگاشت روز فارسی → Calendar.* (شنبه=7 ... پنجشنبه=5) */
    private static Integer calendarDay(String faDay) {
        if (faDay == null) return null;
        String clean = faDay.replaceAll("[\\s\\u200c]", "").trim();
        if (clean.contains("چهارشنبه")) return Calendar.WEDNESDAY;
        if (clean.contains("سهشنبه")) return Calendar.TUESDAY;
        if (clean.contains("دوشنبه")) return Calendar.MONDAY;
        if (clean.contains("یکشنبه")) return Calendar.SUNDAY;
        if (clean.contains("پنجشنبه")) return Calendar.THURSDAY;
        if (clean.contains("جمعه")) return Calendar.FRIDAY;
        if (clean.contains("شنبه")) return Calendar.SATURDAY;
        return null;
    }

    private static PendingIntent reminderPi(Context ctx, int id, String title, String body, String url, String dndMode) {
        Intent i = new Intent(ctx, ClassReminderReceiver.class);
        i.addFlags(Intent.FLAG_RECEIVER_FOREGROUND);
        i.putExtra(ClassReminderReceiver.EXTRA_TITLE, title);
        i.putExtra(ClassReminderReceiver.EXTRA_BODY, body);
        i.putExtra(ClassReminderReceiver.EXTRA_NOTIF_ID, id);
        if (url != null && !url.trim().isEmpty()) {
            i.putExtra(ClassReminderReceiver.EXTRA_URL, url);
        }
        if (dndMode != null && !dndMode.trim().isEmpty()) {
            i.putExtra(ClassReminderReceiver.EXTRA_DND_MODE, dndMode);
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, id, i, flags);
    }

    private static final String[] KNOWN_CLOCK_PACKAGES = {
        "com.miui.deskclock",             // Xiaomi / Redmi / POCO
        "com.google.android.deskclock",    // Google Pixel / Motorola / Pure Android
        "com.sec.android.app.clockpackage",// Samsung
        "com.android.deskclock",           // AOSP / Generic
        "com.huawei.deskclock",            // Huawei
        "com.honor.deskclock",             // Honor
        "com.coloros.alarm",               // Oppo / Realme
        "com.oppo.alarm",                  // Oppo
        "com.heytap.clock",                // Oppo / OnePlus / Realme
        "com.oneplus.deskclock",           // OnePlus
        "com.vivo.alarmclock",             // Vivo
        "com.android.bbkclock"             // Vivo / iQOO
    };

    /**
     * پیدا کردن و هدایت دقیق به اپلیکیشن رسمی ساعت گوشی
     * و جلوگیری از باز شدن برنامه‌های تودولیست مانند TickTick
     */
    private Intent findClockIntent(Context ctx, Intent intent) {
        PackageManager pm = ctx.getPackageManager();
        List<ResolveInfo> list = pm.queryIntentActivities(intent, 0);
        if (list != null && !list.isEmpty()) {
            // ۱. اولویت با برنامه‌های ساعت رسمی سازندگان (شیائومی، سامسونگ، گوگل، هواوی و...)
            for (ResolveInfo ri : list) {
                if (ri.activityInfo != null && ri.activityInfo.packageName != null) {
                    String pkg = ri.activityInfo.packageName.toLowerCase();
                    for (String known : KNOWN_CLOCK_PACKAGES) {
                        if (pkg.contains(known) || known.contains(pkg)) {
                            intent.setComponent(new ComponentName(ri.activityInfo.packageName, ri.activityInfo.name));
                            return intent;
                        }
                    }
                    if (pkg.contains("deskclock") || pkg.contains("clockpackage") || pkg.endsWith(".clock")) {
                        intent.setComponent(new ComponentName(ri.activityInfo.packageName, ri.activityInfo.name));
                        return intent;
                    }
                }
            }
            // ۲. برنامه‌های سیستمی دستگاه غیر از تودولیست
            for (ResolveInfo ri : list) {
                if (ri.activityInfo != null && ri.activityInfo.applicationInfo != null) {
                    String pkg = ri.activityInfo.packageName.toLowerCase();
                    if ((ri.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0) {
                        if (!pkg.contains("ticktick") && !pkg.contains("todo") && !pkg.contains("task")) {
                            intent.setComponent(new ComponentName(ri.activityInfo.packageName, ri.activityInfo.name));
                            return intent;
                        }
                    }
                }
            }
            // ۳. هر برنامه‌ای غیر از TickTick / تودولیست
            for (ResolveInfo ri : list) {
                if (ri.activityInfo != null && ri.activityInfo.packageName != null) {
                    String pkg = ri.activityInfo.packageName.toLowerCase();
                    if (!pkg.contains("ticktick") && !pkg.contains("todo") && !pkg.contains("task")) {
                        intent.setComponent(new ComponentName(ri.activityInfo.packageName, ri.activityInfo.name));
                        return intent;
                    }
                }
            }
        }

        // اگر کوئری اینتنت مستقیماً برنامه‌ای نیاورد، پکیج‌های نصب شده را بررسی می‌کنیم
        for (String known : KNOWN_CLOCK_PACKAGES) {
            try {
                pm.getPackageInfo(known, 0);
                intent.setPackage(known);
                return intent;
            } catch (Exception ignore) {}
        }

        return intent;
    }

    private static boolean canExact(AlarmManager am) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        return am.canScheduleExactAlarms();
    }

    /** ثبت آیتم‌های آینده روی دیسک تا بعد از ریبوت/آپدیت قابل بازیابی باشند */
    private static synchronized void persistScheduled(Context ctx, JSArray items) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(ALARM_PREFS, Context.MODE_PRIVATE);
            JSONObject map = new JSONObject(sp.getString(ALARM_ITEMS_KEY, "{}"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.getJSONObject(i);
                if (o.optLong("triggerAtMs", 0) <= now) continue;
                map.put(String.valueOf(o.optInt("id", 0)), o);
            }
            sp.edit().putString(ALARM_ITEMS_KEY, map.toString()).apply();
        } catch (Exception e) {
            Log.e("SarvestanClassAlarms", "persistScheduled failed", e);
        }
    }

    private static synchronized void forgetScheduled(Context ctx, JSArray ids) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(ALARM_PREFS, Context.MODE_PRIVATE);
            JSONObject map = new JSONObject(sp.getString(ALARM_ITEMS_KEY, "{}"));
            for (int i = 0; i < ids.length(); i++) {
                map.remove(String.valueOf(ids.getInt(i)));
            }
            sp.edit().putString(ALARM_ITEMS_KEY, map.toString()).apply();
        } catch (Exception ignore) {}
    }

    /** بعد از BOOT_COMPLETED یا MY_PACKAGE_REPLACED همهٔ یادآورهای آینده را دوباره ثبت می‌کند */
    static void restoreScheduled(Context ctx) {
        try {
            SharedPreferences sp = ctx.getSharedPreferences(ALARM_PREFS, Context.MODE_PRIVATE);
            JSONObject map = new JSONObject(sp.getString(ALARM_ITEMS_KEY, "{}"));
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            boolean exact = canExact(am);
            long now = System.currentTimeMillis();
            JSONObject keep = new JSONObject();
            Iterator<String> keys = map.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                JSONObject o = map.optJSONObject(key);
                if (o == null) continue;
                long at = o.optLong("triggerAtMs", 0);
                if (at <= now) continue;
                int id = o.optInt("id", 0);
                String url = o.isNull("url") ? null : o.optString("url", null);
                String dndMode = o.isNull("dndMode") ? null : o.optString("dndMode", null);
                PendingIntent pi = reminderPi(ctx, id, o.optString("title", "یادآوری کلاس"),
                        o.optString("body", ""), url, dndMode);
                if (exact) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                }
                keep.put(key, o);
            }
            sp.edit().putString(ALARM_ITEMS_KEY, keep.toString()).apply();
            Log.i("SarvestanClassAlarms", "restored " + keep.length() + " alarms");
        } catch (Exception e) {
            Log.e("SarvestanClassAlarms", "restoreScheduled failed", e);
        }
    }

    @PluginMethod
    public void scheduleReminders(PluginCall call) {
        Context ctx = getContext();
        JSArray items = call.getArray("items");
        if (items == null || items.length() == 0) {
            call.reject("آیتمی برای یادآوری نیست");
            return;
        }

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) {
            call.reject("AlarmManager در دسترس نیست");
            return;
        }

        int scheduled = 0;
        int skipped = 0;
        long now = System.currentTimeMillis();

        try {
            for (int i = 0; i < items.length(); i++) {
                JSONObject o = items.getJSONObject(i);
                int id = o.optInt("id", REQ_BASE + i);
                String title = o.optString("title", "یادآوری کلاس");
                String body = o.optString("body", "");
                // optString روی مقدار JSON null رشتهٔ "null" برمی‌گرداند، نه null
                String url = o.isNull("url") ? null : o.optString("url", null);
                String dndMode = o.isNull("dndMode") ? null : o.optString("dndMode", null);
                long at = o.optLong("triggerAtMs", 0);
                if (at <= now) {
                    skipped++;
                    continue;
                }
                PendingIntent pi = reminderPi(ctx, id, title, body, url, dndMode);
                if (canExact(am)) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                } else {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                }
                scheduled++;
            }
            persistScheduled(ctx, items);
        } catch (Exception e) {
            call.reject("خطای زمان‌بندی یادآوری: " + e.getMessage());
            return;
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("scheduled", scheduled);
        ret.put("skipped", skipped);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelReminders(PluginCall call) {
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        JSArray ids = call.getArray("ids");
        int cancelled = 0;
        if (am != null && ids != null) {
            try {
                for (int i = 0; i < ids.length(); i++) {
                    int id = ids.getInt(i);
                    am.cancel(reminderPi(ctx, id, "", "", null, null));
                    cancelled++;
                }
            } catch (Exception ignore) {}
        }
        if (ids != null) forgetScheduled(ctx, ids);
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("cancelled", cancelled);
        call.resolve(ret);
    }

    /**
     * ساخت آلارم در اپ ساعت گوشی — هر جلسه یک آلارم هفتگی تکرارشونده
     * items: [{ hour, minute, days: ["شنبه",...], label }]
     * skipUi=true نیاز به SET_ALARM دارد و فرم را باز نمی‌کند
     */
    @PluginMethod
    public void importAlarms(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        JSArray items = call.getArray("items");
        boolean skipUi = Boolean.TRUE.equals(call.getBoolean("skipUi", false));
        if (items == null || items.length() == 0) {
            call.reject("جلسه‌ای برای ساخت آلارم نیست");
            return;
        }

        int opened = 0;
        int failed = 0;
        String lastErrorMsg = null;

        for (int i = 0; i < items.length(); i++) {
            try {
                JSONObject o = items.getJSONObject(i);
                int hour = o.optInt("hour", -1);
                int minute = o.optInt("minute", -1);
                if (hour < 0 || minute < 0) {
                    failed++;
                    continue;
                }
                String label = o.optString("label", "کلاس سروستان");

                Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM)
                        .putExtra(AlarmClock.EXTRA_HOUR, hour)
                        .putExtra(AlarmClock.EXTRA_MINUTES, minute)
                        .putExtra(AlarmClock.EXTRA_MESSAGE, label)
                        .putExtra(AlarmClock.EXTRA_VIBRATE, true)
                        .putExtra(AlarmClock.EXTRA_SKIP_UI, skipUi);

                org.json.JSONArray days = o.optJSONArray("days");
                if (days != null && days.length() > 0) {
                    ArrayList<Integer> calDays = new ArrayList<>();
                    for (int d = 0; d < days.length(); d++) {
                        Integer cd = calendarDay(days.optString(d, null));
                        if (cd != null) calDays.add(cd);
                    }
                    if (!calDays.isEmpty()) {
                        intent.putExtra(AlarmClock.EXTRA_DAYS, calDays);
                    }
                }

                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent = findClockIntent(ctx, intent);

                Activity act = getActivity();
                if (act != null && !act.isFinishing()) {
                    act.startActivity(intent);
                } else {
                    ctx.startActivity(intent);
                }
                opened++;

                // بین باز شدن فرم‌ها مکث کوتاه
                if (!skipUi && i < items.length() - 1) {
                    try {
                        Thread.sleep(300);
                    } catch (InterruptedException ignore) {}
                }
            } catch (Exception e) {
                lastErrorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                Log.e("SarvestanClassAlarms", "Error launching clock intent: " + lastErrorMsg, e);
                failed++;
            }
        }

        if (opened == 0) {
            // حالت جایگزین در صورت مسدود بودن اینتنت ست آلارم: باز کردن صفحه ساعت گوشی
            boolean fallbackSuccess = false;
            try {
                Intent show = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
                show.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                show = findClockIntent(ctx, show);
                Activity act = getActivity();
                if (act != null && !act.isFinishing()) {
                    act.startActivity(show);
                } else {
                    ctx.startActivity(show);
                }
                fallbackSuccess = true;
            } catch (Exception ex) {
                for (String known : KNOWN_CLOCK_PACKAGES) {
                    try {
                        Intent launch = pm.getLaunchIntentForPackage(known);
                        if (launch != null) {
                            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            Activity act = getActivity();
                            if (act != null && !act.isFinishing()) {
                                act.startActivity(launch);
                            } else {
                                ctx.startActivity(launch);
                            }
                            fallbackSuccess = true;
                            break;
                        }
                    } catch (Exception ignore) {}
                }
            }

            if (fallbackSuccess) {
                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("opened", 1);
                ret.put("fallback", true);
                ret.put("usedUi", true);
                call.resolve(ret);
                return;
            }

            call.reject("برنامه ساعت زنگ‌دار برای ثبت خودکار آلارم در این دستگاه پاسخ نداد (" + (lastErrorMsg != null ? lastErrorMsg : "یافت نشد") + ")");
            return;
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("opened", opened);
        ret.put("failed", failed);
        ret.put("usedUi", !skipUi);
        call.resolve(ret);
    }

    /** آیا امکان زمان‌بندی دقیق هست؟ (اندروید ۱۲+) */
    @PluginMethod
    public void canScheduleExact(PluginCall call) {
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        boolean ok = am == null || canExact(am);
        JSObject ret = new JSObject();
        ret.put("ok", ok);
        call.resolve(ret);
    }

    /** هدایت کاربر به تنظیمات دسترسی زمان‌بندی دقیق */
    @PluginMethod
    public void requestExactPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent i = new Intent(
                        android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + getContext().getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
            } catch (Exception ignore) {}
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    /** هدایت کاربر به تنظیمات دسترسی نوتیفیکیشن اپ */
    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent = new Intent();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent.setAction(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
            } else {
                intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در باز کردن تنظیمات: " + e.getMessage());
        }
    }

    /** بررسی معافیت از بهینه‌سازی باتری برای دریافت بلادرنگ اعلان‌ها */
    @PluginMethod
    public void checkBatteryOptimization(PluginCall call) {
        Context ctx = getContext();
        boolean ignoring = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            ignoring = pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        }
        JSObject ret = new JSObject();
        ret.put("ignoring", ignoring);
        call.resolve(ret);
    }

    /** هدایت یا نمایش دیالوگ سیستمی لغو بهینه‌سازی باتری (Unrestricted) */
    @PluginMethod
    public void requestIgnoreBatteryOptimization(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent();
                intent.setAction(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(intent);
                } catch (Exception ignored) {}
            }
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    /** بررسی مجوز حالت مزاحم نشوید (Do Not Disturb / Zen Mode) */
    @PluginMethod
    public void checkDndPermission(PluginCall call) {
        Context ctx = getContext();
        boolean granted = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            granted = nm != null && nm.isNotificationPolicyAccessGranted();
        } else {
            granted = true;
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    /** هدایت کاربر به صفحه فعال‌سازی دسترسی حالت مزاحم نشوید در تنظیمات اندروید */
    @PluginMethod
    public void requestDndPermission(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            } catch (Exception e) {
                Log.e("SarvestanClassAlarms", "Error opening DND settings: " + e.getMessage());
            }
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    /** اعمال مستقیم و فوری حالت مزاحم نشوید (سایلنت خودکار) */
    @PluginMethod
    public void setDndMode(PluginCall call) {
        Context ctx = getContext();
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        boolean success = false;
        boolean needsPermission = false;
        String reason = "";

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            android.media.AudioManager audio = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);

            if (nm != null && nm.isNotificationPolicyAccessGranted()) {
                try {
                    if (enabled) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY);
                        if (audio != null) {
                            try {
                                audio.setRingerMode(android.media.AudioManager.RINGER_MODE_SILENT);
                            } catch (Exception ignore) {}
                        }
                    } else {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
                        if (audio != null) {
                            try {
                                audio.setRingerMode(android.media.AudioManager.RINGER_MODE_NORMAL);
                            } catch (Exception ignore) {}
                        }
                    }
                    success = true;
                } catch (Exception e) {
                    reason = e.getMessage() != null ? e.getMessage() : e.toString();
                    Log.e("SarvestanClassAlarms", "setDndMode failed: " + reason, e);
                }
            } else {
                needsPermission = true;
                reason = "دسترسی Do Not Disturb در تنظیمات سیستم داده نشده است";
            }
        } else {
            android.media.AudioManager audio = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (audio != null) {
                audio.setRingerMode(enabled ? android.media.AudioManager.RINGER_MODE_SILENT : android.media.AudioManager.RINGER_MODE_NORMAL);
                success = true;
            }
        }

        JSObject ret = new JSObject();
        ret.put("ok", success);
        ret.put("enabled", enabled);
        ret.put("needsPermission", needsPermission);
        if (!success) {
            ret.put("error", reason);
        }
        call.resolve(ret);
    }

    /** بررسی وضعیت کنونی فعال بودن سایلنت / DND */
    @PluginMethod
    public void getDndMode(PluginCall call) {
        Context ctx = getContext();
        boolean isDnd = false;
        boolean hasPermission = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                hasPermission = nm.isNotificationPolicyAccessGranted();
                int filter = nm.getCurrentInterruptionFilter();
                isDnd = (filter != NotificationManager.INTERRUPTION_FILTER_ALL && filter != NotificationManager.INTERRUPTION_FILTER_UNKNOWN);
            }
        }
        JSObject ret = new JSObject();
        ret.put("isDnd", isDnd);
        ret.put("hasPermission", hasPermission);
        call.resolve(ret);
    }

    /** ارسال اعلان تستی فوری برای اطمینان از عملکرد مجوز و صدا */
    @PluginMethod
    public void testNotification(PluginCall call) {
        Context ctx = getContext();

        // بررسی فعال بودن کلی نوتیفیکیشن در تنظیمات گوشی
        if (!NotificationManagerCompat.from(ctx).areNotificationsEnabled()) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("disabled", true);
            ret.put("error", "دسترسی نوتیفیکیشن در تنظیمات گوشی غیرفعال است");
            call.resolve(ret);
            return;
        }

        String title = call.getString("title", "🔔 آزمایش یادآور کلاس سروستان");
        String body = call.getString("body", "اعلان‌ها و صدای زنگ یادآوری کلاس‌ها با موفقیت فعال و آماده به کار است.");
        String url = call.getString("url", null);
        int notifId = call.getInt("id", 99999);

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(
                        ClassReminderReceiver.CHANNEL_ID,
                        "یادآوری کلاس‌ها و رزرو غذا",
                        NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("اعلان‌های هوشمند پیش از شروع کلاس‌ها و یادآوری رزرو غذای سماد");
                ch.enableVibration(true);
                ch.setVibrationPattern(new long[]{0, 250, 200, 250});
                ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(ch);
            }

            int iconRes = R.drawable.ic_stat_sarvestan;

            Intent open;
            if (url != null && !url.trim().isEmpty()) {
                open = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            } else {
                open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
                if (open == null) open = new Intent();
            }

            PendingIntent pi = PendingIntent.getActivity(
                    ctx,
                    notifId,
                    open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, ClassReminderReceiver.CHANNEL_ID)
                    .setSmallIcon(iconRes)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setAutoCancel(true)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setContentIntent(pi);

            try {
                nm.notify(notifId, b.build());
            } catch (SecurityException e) {
                JSObject ret = new JSObject();
                ret.put("ok", false);
                ret.put("disabled", true);
                ret.put("error", "مجوز اعلان داده نشده است");
                call.resolve(ret);
                return;
            }
        }

        // ارسال برودکست نیز برای اطمینان
        try {
            Intent i = new Intent(ctx, ClassReminderReceiver.class);
            i.putExtra(ClassReminderReceiver.EXTRA_TITLE, title);
            i.putExtra(ClassReminderReceiver.EXTRA_BODY, body);
            i.putExtra(ClassReminderReceiver.EXTRA_NOTIF_ID, notifId);
            if (url != null && !url.trim().isEmpty()) {
                i.putExtra(ClassReminderReceiver.EXTRA_URL, url);
            }
            ctx.sendBroadcast(i);
        } catch (Exception ignore) {}

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("message", "اعلان تستی ارسال شد");
        call.resolve(ret);
    }

    /** افزودن رویداد امتحان یا برنامه به تقویم رسمی دستگاه */
    @PluginMethod
    public void exportToCalendar(PluginCall call) {
        Context ctx = getContext();
        String title = call.getString("title", "امتحان سروستان");
        String description = call.getString("description", "");
        String location = call.getString("location", "");
        long startMs = call.getLong("startMs", 0L);
        long endMs = call.getLong("endMs", 0L);

        try {
            Intent intent = new Intent(Intent.ACTION_INSERT)
                    .setData(android.provider.CalendarContract.Events.CONTENT_URI)
                    .putExtra(android.provider.CalendarContract.Events.TITLE, title)
                    .putExtra(android.provider.CalendarContract.Events.DESCRIPTION, description)
                    .putExtra(android.provider.CalendarContract.Events.EVENT_LOCATION, location);

            if (startMs > 0) {
                intent.putExtra(android.provider.CalendarContract.EXTRA_EVENT_BEGIN_TIME, startMs);
            }
            if (endMs > 0) {
                intent.putExtra(android.provider.CalendarContract.EXTRA_EVENT_END_TIME, endMs);
            } else if (startMs > 0) {
                intent.putExtra(android.provider.CalendarContract.EXTRA_EVENT_END_TIME, startMs + 2 * 3600 * 1000L);
            }

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Activity act = getActivity();
            if (act != null && !act.isFinishing()) {
                act.startActivity(intent);
            } else {
                ctx.startActivity(intent);
            }

            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در باز کردن تقویم: " + e.getMessage());
        }
    }

    private static final String CHANNEL_TIMER_ID = "sarv_honor_magic_capsule_v1";
    private static final int TIMER_NOTIF_ID = 19800;

    /** نمایش اعلان کپسولی زنده با ثانیه‌شمار سیستمی (Dynamic Island / Chronometer Notification) */
    @PluginMethod
    public void startLiveTimer(PluginCall call) {
        Context ctx = getContext();
        if (!NotificationManagerCompat.from(ctx).areNotificationsEnabled()) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("disabled", true);
            call.resolve(ret);
            return;
        }

        String title = call.getString("title", "مطالعه و تمرکز");
        String subtitle = call.getString("subtitle", "تایمر فعال");
        boolean isCountDown = Boolean.TRUE.equals(call.getBoolean("isCountDown", true));
        Long targetEndMsVal = call.getLong("targetEndMs");
        Long baseStartMsVal = call.getLong("baseStartMs");
        long targetEndMs = targetEndMsVal != null ? targetEndMsVal : 0L;
        long baseStartMs = baseStartMsVal != null ? baseStartMsVal : 0L;
        if (baseStartMs <= 0) {
            Double d = call.getDouble("baseStartMs");
            if (d != null) baseStartMs = d.longValue();
        }
        if (targetEndMs <= 0) {
            Double d = call.getDouble("targetEndMs");
            if (d != null) targetEndMs = d.longValue();
        }

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) {
            call.reject("NotificationManager unavailable");
            return;
        }

        // حذف کانال قدیمی بی‌صدا (Muted) و ساخت کانال اختصاصی کپسول جادویی با اهمیت بالا
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                nm.deleteNotificationChannel("sarvestan_live_timer");
                nm.deleteNotificationChannel("sarv_magic_capsule_live");
            } catch (Exception ignored) {}

            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_TIMER_ID,
                    "کپسول مطالعه و تایمر زنده (Magic Capsule)",
                    NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("نمایش وضعیت تایمر در کپسول جادویی آنر (Magic Capsule)، نوار وضعیت و صفحه قفل");
            ch.setShowBadge(true);
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (open == null) open = new Intent();
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
                ctx,
                TIMER_NOTIF_ID,
                open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_TIMER_ID)
                .setSmallIcon(R.drawable.ic_stat_sarvestan)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setSubText("سروستان · " + (isCountDown ? "تایمر زنده" : "کرنومتر زنده"))
                .setColor(0xFF0D9275)
                .setColorized(true)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(pi)
                .addAction(R.drawable.ic_stat_sarvestan, "مشاهده برنامه", pi);

        // تنظیم آیکون بزرگ با لوگوی رسمی سروستان
        try {
            android.graphics.Bitmap largeIcon = android.graphics.BitmapFactory.decodeResource(
                    ctx.getResources(), R.mipmap.ic_launcher);
            if (largeIcon != null) {
                b.setLargeIcon(largeIcon);
            }
        } catch (Exception ignored) {}

        // اکستراهای اختصاصی برای پشتیبانی کامل Magic Capsule در آنر و اندروید ۱۴
        Bundle extras = new Bundle();
        extras.putString("android.substName", "سروستان");
        extras.putBoolean("android.showChronometer", true);
        extras.putBoolean("android.chronometerCountDown", isCountDown);
        extras.putBoolean("android.ongoing", true);
        extras.putBoolean("android.showWhen", true);
        extras.putBoolean("com.hihonor.notification.ongoing", true);
        extras.putBoolean("com.huawei.notification.ongoing", true);
        extras.putString("hw_live_activity", "true");
        extras.putString("honor_magic_capsule", "true");
        b.addExtras(extras);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            b.setChronometerCountDown(isCountDown);
        }

        if (isCountDown && targetEndMs > 0) {
            b.setWhen(targetEndMs);
        } else if (!isCountDown && baseStartMs > 0) {
            b.setWhen(baseStartMs);
        } else {
            b.setWhen(System.currentTimeMillis());
        }

        try {
            nm.notify(TIMER_NOTIF_ID, b.build());
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (SecurityException e) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("disabled", true);
            ret.put("error", "SecurityException: POST_NOTIFICATIONS missing");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("startLiveTimer failed: " + e.getMessage());
        }
    }

    /** لغو و حذف اعلان زنده تایمر */
    @PluginMethod
    public void stopLiveTimer(PluginCall call) {
        Context ctx = getContext();
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(TIMER_NOTIF_ID);
            }
            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("stopLiveTimer failed: " + e.getMessage());
        }
    }
}
