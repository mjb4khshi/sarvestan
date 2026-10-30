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
 * ویجت مینی بندانگشتی ساعت کلاس بعدی (۱×۱)
 */
public class SarvestanMicroClassWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanMicroClassWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_micro_class);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String nextTitle = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TITLE, "");
        String nextTime = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TIME, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_micro_class_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_micro : R.drawable.widget_bg_micro_light);

        int colorBrand = isNight ? Color.parseColor("#38BDF8") : Color.parseColor("#0284C7");
        int colorValue = isNight ? Color.parseColor("#7DD3FC") : Color.parseColor("#0369A1");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");

        Bitmap bTag = WidgetTypographyHelper.renderTextCenter(context, "کلاس", 8.5f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bTag != null) rv.setImageViewBitmap(R.id.w_micro_class_tag, bTag);

        String timeDisplay = "—";
        if (nextTime != null && !nextTime.isEmpty()) {
            String[] parts = nextTime.split(" تا | - ");
            timeDisplay = SarvestanWidgetProvider.toFaDigits(parts[0].trim());
        }

        Bitmap bVal = WidgetTypographyHelper.renderTextCenter(context, timeDisplay, 12.5f, colorValue, WidgetTypographyHelper.getBold(context));
        if (bVal != null) rv.setImageViewBitmap(R.id.w_micro_class_value, bVal);

        String titleShort = "کلاس";
        if (nextTitle != null && !nextTitle.isEmpty() && !nextTitle.contains("پایان") && !nextTitle.contains("ثبت نشده")) {
            String[] parts = nextTitle.trim().split("\\s+");
            titleShort = parts[0];
            if (parts.length > 1 && parts[0].length() <= 4) {
                titleShort += " " + parts[1];
            }
        }
        Bitmap bStatus = WidgetTypographyHelper.renderTextCenter(context, titleShort, 8.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bStatus != null) rv.setImageViewBitmap(R.id.w_micro_class_status, bStatus);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "schedule");
        rv.setOnClickPendingIntent(
            R.id.w_micro_class_root,
            android.app.PendingIntent.getActivity(
                context,
                207,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
