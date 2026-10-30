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
 * ویجت مینی بندانگشتی معدل کل (۱×۱)
 */
public class SarvestanMicroWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanMicroWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_micro_gpa);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String gpa = sp.getString(SarvestanWidgetProvider.KEY_GPA, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_micro_gpa_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_micro : R.drawable.widget_bg_micro_light);

        int colorBrand = isNight ? Color.parseColor("#34D399") : Color.parseColor("#059669");
        int colorGpa = isNight ? Color.WHITE : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");

        Bitmap bTag = WidgetTypographyHelper.renderTextCenter(context, "معدل کل", 8.5f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bTag != null) rv.setImageViewBitmap(R.id.w_micro_gpa_tag, bTag);

        String gpaStr = (gpa != null && !gpa.isEmpty() && !gpa.equals("ـ")) ? SarvestanWidgetProvider.toFaDigits(gpa) : "—";
        Bitmap bVal = WidgetTypographyHelper.renderTextCenter(context, gpaStr, 17f, colorGpa, WidgetTypographyHelper.getBold(context));
        if (bVal != null) rv.setImageViewBitmap(R.id.w_micro_gpa_value, bVal);

        Bitmap bStatus = WidgetTypographyHelper.renderTextCenter(context, "سروستان", 8.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bStatus != null) rv.setImageViewBitmap(R.id.w_micro_gpa_status, bStatus);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_micro_gpa_root,
            android.app.PendingIntent.getActivity(
                context,
                204,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
