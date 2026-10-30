package ir.mjbakhshi.sarvestan;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.widget.RemoteViews;

/**
 * ویجت نواری و جمع‌وجور کلاس بعدی (۴×۱)
 */
public class SarvestanSlimClassWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateOne(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanSlimClassWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_slim_class);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String nextTitle = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TITLE, "");
        String nextTime = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TIME, "");
        String nextRoom = sp.getString(SarvestanWidgetProvider.KEY_NEXT_ROOM, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_slim_class_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_slim : R.drawable.widget_bg_slim_light);

        int colorTitle = isNight ? Color.parseColor("#F8FAFC") : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorTime = isNight ? Color.parseColor("#38BDF8") : Color.parseColor("#0284C7");

        String title = (nextTitle == null || nextTitle.isEmpty()) ? "امروز کلاسی ثبت نشده" : nextTitle;
        Bitmap bTitle = WidgetTypographyHelper.renderText(context, title, 11.5f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_slim_class_title, bTitle);

        String meta = (nextRoom != null && !nextRoom.isEmpty() && !nextRoom.equals("ـ")) ? ("کلاس " + SarvestanWidgetProvider.toFaDigits(nextRoom)) : "برنامه هفتگی";
        Bitmap bMeta = WidgetTypographyHelper.renderText(context, meta, 9.5f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bMeta != null) rv.setImageViewBitmap(R.id.w_slim_class_meta, bMeta);

        String timeStr = (nextTime != null && !nextTime.isEmpty()) ? SarvestanWidgetProvider.toFaDigits(nextTime) : "—";
        Bitmap bTime = WidgetTypographyHelper.renderText(context, timeStr, 10f, colorTime, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.LEFT);
        if (bTime != null) rv.setImageViewBitmap(R.id.w_slim_class_time, bTime);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_slim_class_root,
            android.app.PendingIntent.getActivity(
                context,
                201,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
