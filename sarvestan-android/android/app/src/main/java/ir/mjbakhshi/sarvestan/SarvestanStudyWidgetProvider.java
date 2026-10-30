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
 * ویجت نواری مطالعه و استریک روزانه (۴×۱)
 */
public class SarvestanStudyWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanStudyWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_slim_study);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        int studyMins = sp.getInt("study_minutes", 0);
        int streak = sp.getInt("study_streak", 0);
        String subject = sp.getString("study_subject", "مطالعه و برنامه‌ریزی");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_slim_study_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_slim : R.drawable.widget_bg_slim_light);

        int colorTitle = isNight ? Color.parseColor("#F8FAFC") : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorStreak = isNight ? Color.parseColor("#F59E0B") : Color.parseColor("#D97706");

        int h = studyMins / 60;
        int m = studyMins % 60;
        String timeStr = h > 0 ? (SarvestanWidgetProvider.toFaDigits(String.valueOf(h)) + "س و " + SarvestanWidgetProvider.toFaDigits(String.valueOf(m)) + "د") : (SarvestanWidgetProvider.toFaDigits(String.valueOf(m)) + " دقیقه");
        String header = "مطالعه امروز: " + timeStr;

        Bitmap bTime = WidgetTypographyHelper.renderText(context, header, 11.5f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bTime != null) rv.setImageViewBitmap(R.id.w_slim_study_time, bTime);

        Bitmap bSubject = WidgetTypographyHelper.renderText(context, subject, 9.5f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bSubject != null) rv.setImageViewBitmap(R.id.w_slim_study_subject, bSubject);

        String streakText = streak > 0 ? (SarvestanWidgetProvider.toFaDigits(String.valueOf(streak)) + " روز") : "ثبت مطالعه";
        Bitmap bStreak = WidgetTypographyHelper.renderText(context, streakText, 10f, colorStreak, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.LEFT);
        if (bStreak != null) rv.setImageViewBitmap(R.id.w_slim_study_streak, bStreak);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_slim_study_root,
            android.app.PendingIntent.getActivity(
                context,
                202,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
