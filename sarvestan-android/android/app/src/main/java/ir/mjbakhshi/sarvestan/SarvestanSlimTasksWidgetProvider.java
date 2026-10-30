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
 * ویجت نواری و باریک کارهای امروز و تسک‌ها (۴×۱)
 */
public class SarvestanSlimTasksWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanSlimTasksWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_slim_tasks);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String topTitle = sp.getString("top_task_title", "");
        int doneCount = sp.getInt("tasks_done_count", 0);
        int totalCount = sp.getInt("tasks_total_count", 0);
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_slim_tasks_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_slim : R.drawable.widget_bg_slim_light);

        int colorTitle = isNight ? Color.WHITE : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorBadge = isNight ? Color.parseColor("#A855F7") : Color.parseColor("#7E22CE");

        String displayTitle = (topTitle != null && !topTitle.isEmpty()) ? topTitle : "کاری برای امروز در انتظار نیست";
        Bitmap bTitle = WidgetTypographyHelper.renderTextRight(context, displayTitle, 12f, colorTitle, WidgetTypographyHelper.getBold(context));
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_slim_tasks_title, bTitle);

        String displayMeta = totalCount > 0 ? "تسک اولویت‌دار امروز" : "برنامه‌ریزی و پلنر تحصیلی";
        Bitmap bMeta = WidgetTypographyHelper.renderTextRight(context, displayMeta, 10f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bMeta != null) rv.setImageViewBitmap(R.id.w_slim_tasks_meta, bMeta);

        String badgeText;
        if (totalCount > 0) {
            badgeText = SarvestanWidgetProvider.toFaDigits(String.valueOf(doneCount)) + " از " + SarvestanWidgetProvider.toFaDigits(String.valueOf(totalCount)) + " انجام شد";
        } else {
            badgeText = "پلنر فعال";
        }

        Bitmap bBadge = WidgetTypographyHelper.renderTextCenter(context, badgeText, 10f, colorBadge, WidgetTypographyHelper.getBold(context));
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_slim_tasks_progress, bBadge);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "study");
        rv.setOnClickPendingIntent(
            R.id.w_slim_tasks_root,
            android.app.PendingIntent.getActivity(
                context,
                209,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
