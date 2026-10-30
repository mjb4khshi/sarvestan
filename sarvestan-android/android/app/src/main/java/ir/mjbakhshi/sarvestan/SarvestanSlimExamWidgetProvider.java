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
 * ویجت نواری و باریک روزشمار امتحانات (۴×۱)
 */
public class SarvestanSlimExamWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanSlimExamWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_slim_exam);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String title = sp.getString(SarvestanWidgetProvider.KEY_EXAM_TITLE, "");
        int examDays = sp.getInt(SarvestanWidgetProvider.KEY_EXAM_DAYS, -1);
        String examDate = sp.getString(SarvestanWidgetProvider.KEY_EXAM_DATE, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_slim_exam_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_slim : R.drawable.widget_bg_slim_light);

        int colorTitle = isNight ? Color.WHITE : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorBadge = isNight ? Color.parseColor("#FB7185") : Color.parseColor("#E11D48");

        String displayTitle = (title != null && !title.isEmpty()) ? title : "امتحانی در هفته جاری نیست";
        Bitmap bTitle = WidgetTypographyHelper.renderTextRight(context, displayTitle, 12f, colorTitle, WidgetTypographyHelper.getBold(context));
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_slim_exam_title, bTitle);

        String displayMeta = (examDate != null && !examDate.isEmpty()) ? SarvestanWidgetProvider.toFaDigits(examDate) : "روزشمار امتحانات پایان‌ترم";
        Bitmap bMeta = WidgetTypographyHelper.renderTextRight(context, displayMeta, 10f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bMeta != null) rv.setImageViewBitmap(R.id.w_slim_exam_meta, bMeta);

        String badgeText;
        if (examDays == 0) {
            badgeText = "امروز موعد آزمون";
        } else if (examDays == 1) {
            badgeText = "فردا امتحان";
        } else if (examDays > 1) {
            badgeText = SarvestanWidgetProvider.toFaDigits(String.valueOf(examDays)) + " روز تا امتحان";
        } else {
            badgeText = "بدون امتحان";
        }

        Bitmap bBadge = WidgetTypographyHelper.renderTextCenter(context, badgeText, 10.5f, colorBadge, WidgetTypographyHelper.getBold(context));
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_slim_exam_badge, bBadge);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "schedule");
        rv.setOnClickPendingIntent(
            R.id.w_slim_exam_root,
            android.app.PendingIntent.getActivity(
                context,
                208,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
