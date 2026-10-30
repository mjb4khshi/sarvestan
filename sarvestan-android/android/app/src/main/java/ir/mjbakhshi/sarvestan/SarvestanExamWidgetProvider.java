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
 * ویجت اختصاصی روزشمار امتحانات (۴×۲)
 */
public class SarvestanExamWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanExamWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_exam);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String examTitle = sp.getString(SarvestanWidgetProvider.KEY_EXAM_TITLE, "");
        int examDays = sp.getInt(SarvestanWidgetProvider.KEY_EXAM_DAYS, -1);
        String examDate = sp.getString(SarvestanWidgetProvider.KEY_EXAM_DATE, "");
        String secondExamTitle = sp.getString("second_exam_title", "");
        int secondExamDays = sp.getInt("second_exam_days", -1);
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_exam_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_modern : R.drawable.widget_bg_modern_light);
        rv.setInt(R.id.w_exam_card_main, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);

        int colorBrand = isNight ? Color.parseColor("#FB7185") : Color.parseColor("#E11D48");
        int colorTitle = isNight ? Color.parseColor("#F8FAFC") : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorBadge = isNight ? Color.parseColor("#FDA4AF") : Color.parseColor("#BE123C");

        Bitmap bHeader = WidgetTypographyHelper.renderText(context, "روزشمار امتحانات", 12f, colorBrand, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bHeader != null) rv.setImageViewBitmap(R.id.w_exam_header_title, bHeader);

        String badgeStr = examDays == 0 ? "امروز" : examDays == 1 ? "فردا" : examDays > 1 ? (SarvestanWidgetProvider.toFaDigits(String.valueOf(examDays)) + " روز مانده") : "پایان امتحانات";
        Bitmap bBadge = WidgetTypographyHelper.renderText(context, badgeStr, 10f, colorBadge, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.LEFT);
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_exam_badge, bBadge);

        String mainTitle = (examTitle == null || examTitle.isEmpty() || examDays < 0) ? "امتحانی نزدیک نیست" : examTitle;
        Bitmap bCourse = WidgetTypographyHelper.renderText(context, mainTitle, 13f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bCourse != null) rv.setImageViewBitmap(R.id.w_exam_course_title, bCourse);

        String meta = examDate != null && !examDate.isEmpty() ? SarvestanWidgetProvider.toFaDigits(examDate) : "برنامه امتحانات ترم جاری";
        Bitmap bMeta = WidgetTypographyHelper.renderText(context, meta, 10f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bMeta != null) rv.setImageViewBitmap(R.id.w_exam_course_meta, bMeta);

        if (secondExamTitle != null && !secondExamTitle.isEmpty()) {
            Bitmap bSec = WidgetTypographyHelper.renderText(context, "امتحان بعدی: " + secondExamTitle, 10f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
            if (bSec != null) rv.setImageViewBitmap(R.id.w_exam_second_info, bSec);

            if (secondExamDays >= 0) {
                Bitmap bSecDays = WidgetTypographyHelper.renderText(context, SarvestanWidgetProvider.toFaDigits(String.valueOf(secondExamDays)) + " روز بعد", 10f, colorMeta, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.LEFT);
                if (bSecDays != null) rv.setImageViewBitmap(R.id.w_exam_second_days, bSecDays);
            }
        }

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_exam_root,
            android.app.PendingIntent.getActivity(
                context,
                203,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
