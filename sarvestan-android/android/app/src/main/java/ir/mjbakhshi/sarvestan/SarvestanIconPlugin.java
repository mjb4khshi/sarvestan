package ir.mjbakhshi.sarvestan;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.ColorInt;
import androidx.annotation.DrawableRes;
import androidx.core.content.ContextCompat;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.DrawableCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "SarvestanIcon")
public class SarvestanIconPlugin extends Plugin {

    private static final String TAG = "SarvestanIcon";
    public static final String DEFAULT_ICON = "default";
    public static final String DEFAULT_COLOR = "#0D9275";

    public static final Map<String, String> ALIAS_MAP = new HashMap<>();
    public static final Map<String, String> COLOR_MAP = new HashMap<>();

    static {
        ALIAS_MAP.put("default", "ir.mjbakhshi.sarvestan.MainActivityDefault");
        ALIAS_MAP.put("dark", "ir.mjbakhshi.sarvestan.MainActivityDark");
        ALIAS_MAP.put("sapphire", "ir.mjbakhshi.sarvestan.MainActivitySapphire");
        ALIAS_MAP.put("cyberpunk", "ir.mjbakhshi.sarvestan.MainActivityCyberpunk");
        ALIAS_MAP.put("gold", "ir.mjbakhshi.sarvestan.MainActivityGold");
        ALIAS_MAP.put("crimson", "ir.mjbakhshi.sarvestan.MainActivityCrimson");
        ALIAS_MAP.put("violet", "ir.mjbakhshi.sarvestan.MainActivityViolet");
        ALIAS_MAP.put("sunset", "ir.mjbakhshi.sarvestan.MainActivitySunset");
        ALIAS_MAP.put("matcha", "ir.mjbakhshi.sarvestan.MainActivityMatcha");
        ALIAS_MAP.put("rose", "ir.mjbakhshi.sarvestan.MainActivityRose");
        ALIAS_MAP.put("nordic", "ir.mjbakhshi.sarvestan.MainActivityNordic");
        ALIAS_MAP.put("stealth", "ir.mjbakhshi.sarvestan.MainActivityStealth");

        COLOR_MAP.put("default", "#0D9275");
        COLOR_MAP.put("dark", "#10B981");
        COLOR_MAP.put("sapphire", "#38BDF8");
        COLOR_MAP.put("cyberpunk", "#00F0FF");
        COLOR_MAP.put("gold", "#F59E0B");
        COLOR_MAP.put("crimson", "#F43F5E");
        COLOR_MAP.put("violet", "#C084FC");
        COLOR_MAP.put("sunset", "#FB923C");
        COLOR_MAP.put("matcha", "#15803D");
        COLOR_MAP.put("rose", "#E11D48");
        COLOR_MAP.put("nordic", "#0284C7");
        COLOR_MAP.put("stealth", "#64748B");
    }

    public static ComponentName getActiveLauncherComponent(Context context) {
        PackageManager pm = context.getPackageManager();
        for (String alias : ALIAS_MAP.values()) {
            ComponentName cn = new ComponentName(context.getPackageName(), alias);
            if (pm.getComponentEnabledSetting(cn) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                return cn;
            }
        }
        return new ComponentName(context.getPackageName(), ALIAS_MAP.get(DEFAULT_ICON));
    }

    public static IconCompat createShortcutIcon(Context context, @ColorInt int bgColor, @DrawableRes int fgResId) {
        int size = 192;
        Bitmap bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        paint.setColor(bgColor);
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint);

        Drawable fg = ContextCompat.getDrawable(context, fgResId);
        if (fg != null) {
            int pad = (int) (size * 0.22f);
            fg.setBounds(pad, pad, size - pad, size - pad);
            DrawableCompat.setTint(fg, Color.WHITE);
            fg.draw(canvas);
        }

        return IconCompat.createWithBitmap(bitmap);
    }

    public static String resolveCurrentThemeColor(Context context) {
        try {
            // ۱. بررسی آیکون ذخیره‌شده کاربر در تنظیمات محلی
            SharedPreferences prefs = context.getSharedPreferences("sarvestan_icon_prefs", Context.MODE_PRIVATE);
            String savedIcon = prefs.getString("active_icon", null);
            if (savedIcon != null && COLOR_MAP.containsKey(savedIcon)) {
                return COLOR_MAP.get(savedIcon);
            }

            // ۲. بررسی آیکون فعال در لانچر سیستم عامل
            PackageManager pm = context.getPackageManager();
            for (Map.Entry<String, String> entry : ALIAS_MAP.entrySet()) {
                ComponentName cn = new ComponentName(context.getPackageName(), entry.getValue());
                if (pm.getComponentEnabledSetting(cn) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                    return COLOR_MAP.getOrDefault(entry.getKey(), DEFAULT_COLOR);
                }
            }

            return COLOR_MAP.getOrDefault(DEFAULT_ICON, DEFAULT_COLOR);
        } catch (Exception e) {
            return DEFAULT_COLOR;
        }
    }

    public static void syncShortcuts(Context context, String colorHex) {
        syncShortcuts(context, colorHex, null);
    }

    public static void syncShortcuts(Context context, String colorHex, ComponentName targetCn) {
        try {
            if (targetCn == null) {
                targetCn = getActiveLauncherComponent(context);
            }
            if (colorHex == null || colorHex.trim().isEmpty()) {
                colorHex = resolveCurrentThemeColor(context);
            }

            int color = Color.parseColor(colorHex);

            Intent scheduleIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("sarvestan://shortcut/schedule"))
                .setPackage(context.getPackageName())
                .setClass(context, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            Intent behestanIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("sarvestan://shortcut/behestan"))
                .setPackage(context.getPackageName())
                .setClass(context, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            Intent vcIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("sarvestan://shortcut/vc"))
                .setPackage(context.getPackageName())
                .setClass(context, MainActivity.class)
                .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

            ShortcutInfoCompat s1 = new ShortcutInfoCompat.Builder(context, "shortcut_schedule")
                .setActivity(targetCn)
                .setShortLabel(context.getString(R.string.shortcut_schedule_short))
                .setLongLabel(context.getString(R.string.shortcut_schedule_long))
                .setIcon(createShortcutIcon(context, color, R.drawable.ic_shortcut_schedule_fg))
                .setIntent(scheduleIntent)
                .setRank(1)
                .build();

            ShortcutInfoCompat s2 = new ShortcutInfoCompat.Builder(context, "shortcut_behestan")
                .setActivity(targetCn)
                .setShortLabel(context.getString(R.string.shortcut_behestan_short))
                .setLongLabel(context.getString(R.string.shortcut_behestan_long))
                .setIcon(createShortcutIcon(context, color, R.drawable.ic_shortcut_behestan_fg))
                .setIntent(behestanIntent)
                .setRank(2)
                .build();

            ShortcutInfoCompat s3 = new ShortcutInfoCompat.Builder(context, "shortcut_vc")
                .setActivity(targetCn)
                .setShortLabel(context.getString(R.string.shortcut_vc_short))
                .setLongLabel(context.getString(R.string.shortcut_vc_long))
                .setIcon(createShortcutIcon(context, color, R.drawable.ic_shortcut_vc_fg))
                .setIntent(vcIntent)
                .setRank(3)
                .build();

            ShortcutManagerCompat.removeAllDynamicShortcuts(context);
            ShortcutManagerCompat.setDynamicShortcuts(context, Arrays.asList(s1, s2, s3));
            Log.i(TAG, "Dynamic shortcuts updated for " + targetCn.getShortClassName() + " with color: " + colorHex);
        } catch (Exception e) {
            Log.e(TAG, "Failed to sync dynamic shortcuts", e);
        }
    }

    @PluginMethod
    public void getPendingShortcut(PluginCall call) {
        String pending = MainActivity.consumePendingShortcut();
        JSObject ret = new JSObject();
        ret.put("target", pending != null ? pending : "");
        call.resolve(ret);
    }

    @PluginMethod
    public void updateShortcutsColor(PluginCall call) {
        String color = resolveCurrentThemeColor(getContext());
        syncShortcuts(getContext(), color);
        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("color", color);
        call.resolve(ret);
    }

    @PluginMethod
    public void getIcon(PluginCall call) {
        try {
            Context ctx = getContext();
            SharedPreferences prefs = ctx.getSharedPreferences("sarvestan_icon_prefs", Context.MODE_PRIVATE);
            String currentIcon = prefs.getString("active_icon", null);

            if (currentIcon == null) {
                PackageManager pm = ctx.getPackageManager();
                currentIcon = DEFAULT_ICON;
                for (Map.Entry<String, String> entry : ALIAS_MAP.entrySet()) {
                    ComponentName cn = new ComponentName(ctx.getPackageName(), entry.getValue());
                    int state = pm.getComponentEnabledSetting(cn);
                    if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                        currentIcon = entry.getKey();
                        break;
                    }
                }
            }

            JSObject ret = new JSObject();
            ret.put("iconId", currentIcon);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Failed to get icon", e);
            JSObject ret = new JSObject();
            ret.put("iconId", DEFAULT_ICON);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String iconId = call.getString("iconId");
        if (iconId == null || !ALIAS_MAP.containsKey(iconId)) {
            iconId = DEFAULT_ICON;
        }

        try {
            Context ctx = getContext();
            PackageManager pm = ctx.getPackageManager();
            String targetAlias = ALIAS_MAP.get(iconId);

            // ۱. ذخیره آیکون در تنظیمات محلی
            ctx.getSharedPreferences("sarvestan_icon_prefs", Context.MODE_PRIVATE)
                .edit()
                .putString("active_icon", iconId)
                .apply();

            // ۲. ابتدا آیکون مورد نظر را فعال می‌کنیم تا لانچر بی‌برنامه نماند
            ComponentName targetCn = new ComponentName(ctx.getPackageName(), targetAlias);
            pm.setComponentEnabledSetting(
                targetCn,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );

            // ۳. سایر آیکون‌ها را غیرفعال می‌کنیم
            for (Map.Entry<String, String> entry : ALIAS_MAP.entrySet()) {
                if (!entry.getKey().equals(iconId)) {
                    ComponentName otherCn = new ComponentName(ctx.getPackageName(), entry.getValue());
                    pm.setComponentEnabledSetting(
                        otherCn,
                        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                        PackageManager.DONT_KILL_APP
                    );
                }
            }

            // ۴. همگام‌سازی و اتصال مجدد شورتکات‌های لانچر با رنگ هماهنگ با همان آیکون
            String targetColor = COLOR_MAP.getOrDefault(iconId, DEFAULT_COLOR);
            syncShortcuts(ctx, targetColor, targetCn);

            Log.i(TAG, "Successfully changed app launcher icon to: " + iconId + " with shortcut color: " + targetColor);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("iconId", iconId);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error changing app icon", e);
            call.reject("خطا در تغییر آیکون لانچر: " + e.getMessage());
        }
    }
}
