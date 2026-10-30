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
 * ویجت کارت کارهای امروز و پلنر (۴×۲)
 */
public class SarvestanTasksWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanTasksWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_tasks);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String topTitle = sp.getString("top_task_title", "");
        String secondTitle = sp.getString("second_task_title", "");
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

        rv.setInt(R.id.w_tasks_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_modern : R.drawable.widget_bg_modern_light);
        rv.setInt(R.id.w_tasks_card1, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);
        rv.setInt(R.id.w_tasks_card2, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);

        int colorBrand = isNight ? Color.parseColor("#A855F7") : Color.parseColor("#7E22CE");
        int colorTitle = isNight ? Color.WHITE : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorDone = isNight ? Color.parseColor("#34D399") : Color.parseColor("#059669");

        Bitmap bHeader = WidgetTypographyHelper.renderTextRight(context, "کارهای امروز و پلنر", 12.5f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bHeader != null) rv.setImageViewBitmap(R.id.w_tasks_header_title, bHeader);

        String ratioStr = totalCount > 0
            ? SarvestanWidgetProvider.toFaDigits(String.valueOf(doneCount)) + " از " + SarvestanWidgetProvider.toFaDigits(String.valueOf(totalCount)) + " انجام شد"
            : "پلنر مطالعه";
        Bitmap bBadge = WidgetTypographyHelper.renderTextCenter(context, ratioStr, 10f, colorBrand, WidgetTypographyHelper.getMedium(context));
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_tasks_header_badge, bBadge);

        // کارت کار ۱
        Bitmap bCheck1 = WidgetTypographyHelper.renderTextCenter(context, "○", 13f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bCheck1 != null) rv.setImageViewBitmap(R.id.w_tasks_t1_check, bCheck1);

        String t1Title = (topTitle != null && !topTitle.isEmpty()) ? topTitle : "کاری برای امروز در انتظار نیست";
        Bitmap bT1Title = WidgetTypographyHelper.renderTextRight(context, t1Title, 11.5f, colorTitle, WidgetTypographyHelper.getBold(context));
        if (bT1Title != null) rv.setImageViewBitmap(R.id.w_tasks_t1_title, bT1Title);

        String t1Meta = (topTitle != null && !topTitle.isEmpty()) ? "اولویت فوری · برای انجام لمس کنید" : "برای افزودن تسک جدید برنامه را باز کنید";
        Bitmap bT1Meta = WidgetTypographyHelper.renderTextRight(context, t1Meta, 9.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bT1Meta != null) rv.setImageViewBitmap(R.id.w_tasks_t1_meta, bT1Meta);

        // کارت کار ۲
        Bitmap bCheck2 = WidgetTypographyHelper.renderTextCenter(context, "○", 13f, colorMeta, WidgetTypographyHelper.getBold(context));
        if (bCheck2 != null) rv.setImageViewBitmap(R.id.w_tasks_t2_check, bCheck2);

        String t2Title = (secondTitle != null && !secondTitle.isEmpty()) ? secondTitle : "تمرین و مطالعه آزاد هفتگی";
        Bitmap bT2Title = WidgetTypographyHelper.renderTextRight(context, t2Title, 11.5f, colorTitle, WidgetTypographyHelper.getBold(context));
        if (bT2Title != null) rv.setImageViewBitmap(R.id.w_tasks_t2_title, bT2Title);

        String t2Meta = (secondTitle != null && !secondTitle.isEmpty()) ? "تسک بعدی برنامه" : "پلنر هوشمند و ماتریس سالانه";
        Bitmap bT2Meta = WidgetTypographyHelper.renderTextRight(context, t2Meta, 9.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bT2Meta != null) rv.setImageViewBitmap(R.id.w_tasks_t2_meta, bT2Meta);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "study");
        rv.setOnClickPendingIntent(
            R.id.w_tasks_root,
            android.app.PendingIntent.getActivity(
                context,
                210,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
