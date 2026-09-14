package ir.mjbakhshi.sarvestan;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "SarvestanIcon")
public class SarvestanIconPlugin extends Plugin {

    private static final String TAG = "SarvestanIcon";
    private static final String DEFAULT_ICON = "default";

    private static final Map<String, String> ALIAS_MAP = new HashMap<>();

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
    }

    @PluginMethod
    public void getIcon(PluginCall call) {
        try {
            Context ctx = getContext();
            PackageManager pm = ctx.getPackageManager();
            String currentIcon = DEFAULT_ICON;

            for (Map.Entry<String, String> entry : ALIAS_MAP.entrySet()) {
                ComponentName cn = new ComponentName(ctx.getPackageName(), entry.getValue());
                int state = pm.getComponentEnabledSetting(cn);
                if (state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) {
                    currentIcon = entry.getKey();
                    break;
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

            // ۱. ابتدا آیکون مورد نظر را فعال می‌کنیم تا لانچر بی‌برنامه نماند
            ComponentName targetCn = new ComponentName(ctx.getPackageName(), targetAlias);
            pm.setComponentEnabledSetting(
                targetCn,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            );

            // ۲. سایر آیکون‌ها را غیرفعال می‌کنیم
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

            Log.i(TAG, "Successfully changed app launcher icon to: " + iconId);
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
