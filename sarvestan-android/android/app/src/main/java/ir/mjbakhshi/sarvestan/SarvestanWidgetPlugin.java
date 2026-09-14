package ir.mjbakhshi.sarvestan;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** به‌روزرسانی تمام ویجت‌های خانه از داده‌های سنک‌شده */
@CapacitorPlugin(name = "SarvestanWidget")
public class SarvestanWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        if (ctx == null) {
            call.reject("no context");
            return;
        }
        String nextTitle = call.getString("nextTitle", "");
        String nextTime = call.getString("nextTime", "");
        String nextRoom = call.getString("nextRoom", "");
        String examTitle = call.getString("examTitle", "");
        int examDays = call.getInt("examDays", -1) == null ? -1 : call.getInt("examDays", -1);
        String examDate = call.getString("examDate", "");
        String gpa = call.getString("gpa", "");
        String unitsPassed = call.getString("unitsPassed", "");
        String termGpa = call.getString("termGpa", "");
        String theme = call.getString("theme", "auto");

        SarvestanWidgetProvider.save(ctx, nextTitle, nextTime, nextRoom, examTitle, examDays, examDate, gpa, unitsPassed, termGpa, theme);

        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int total = 0;

        // 1. بروزرسانی ویجت ترکیبی
        int[] comboIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanWidgetProvider.class));
        if (comboIds != null && comboIds.length > 0) {
            total += comboIds.length;
            for (int id : comboIds) {
                SarvestanWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 2. بروزرسانی ویجت اختصاصی معدل
        int[] gpaIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanGpaWidgetProvider.class));
        if (gpaIds != null && gpaIds.length > 0) {
            total += gpaIds.length;
            for (int id : gpaIds) {
                SarvestanGpaWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        // 3. بروزرسانی ویجت کلاس بعدی
        int[] classIds = mgr.getAppWidgetIds(new ComponentName(ctx, SarvestanClassWidgetProvider.class));
        if (classIds != null && classIds.length > 0) {
            total += classIds.length;
            for (int id : classIds) {
                SarvestanClassWidgetProvider.updateOne(ctx, mgr, id);
            }
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("count", total);
        call.resolve(ret);
    }
}
