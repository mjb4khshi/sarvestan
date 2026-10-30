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
 * ویجت مینی بندانگشتی استریک و زنجیره مطالعه (۱×۱)
 */
public class SarvestanMicroStreakWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanMicroStreakWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_micro_streak);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        int streak = sp.getInt("study_streak", 0);
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_micro_streak_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_micro : R.drawable.widget_bg_micro_light);

        int colorBrand = isNight ? Color.parseColor("#F59E0B") : Color.parseColor("#D97706");
        int colorStreak = isNight ? Color.parseColor("#FBBF24") : Color.parseColor("#B45309");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");

        Bitmap bTag = WidgetTypographyHelper.renderTextCenter(context, "استریک", 8.5f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bTag != null) rv.setImageViewBitmap(R.id.w_micro_streak_tag, bTag);

        String streakStr = streak > 0 ? SarvestanWidgetProvider.toFaDigits(String.valueOf(streak)) : "۰";
        Bitmap bVal = WidgetTypographyHelper.renderTextCenter(context, streakStr, 17f, colorStreak, WidgetTypographyHelper.getBold(context));
        if (bVal != null) rv.setImageViewBitmap(R.id.w_micro_streak_value, bVal);

        Bitmap bStatus = WidgetTypographyHelper.renderTextCenter(context, "روز متوالی", 8.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bStatus != null) rv.setImageViewBitmap(R.id.w_micro_streak_status, bStatus);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "study");
        rv.setOnClickPendingIntent(
            R.id.w_micro_streak_root,
            android.app.PendingIntent.getActivity(
                context,
                205,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
