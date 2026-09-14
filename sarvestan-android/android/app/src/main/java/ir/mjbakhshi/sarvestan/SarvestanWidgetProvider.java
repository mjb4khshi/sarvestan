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
 * ویجت ترکیبی سروستان — کلاس بعدی + امتحان + معدل (تم تاریک مدرن و فونت بومی آراد)
 */
public class SarvestanWidgetProvider extends AppWidgetProvider {

    public static final String PREFS = "sarvestan_widget_data";
    public static final String KEY_NEXT_TITLE = "next_title";
    public static final String KEY_NEXT_TIME = "next_time";
    public static final String KEY_NEXT_ROOM = "next_room";
    public static final String KEY_EXAM_TITLE = "exam_title";
    public static final String KEY_EXAM_DAYS = "exam_days";
    public static final String KEY_EXAM_DATE = "exam_date";
    public static final String KEY_GPA = "gpa";
    public static final String KEY_UNITS_PASSED = "units_passed";
    public static final String KEY_TERM_GPA = "term_gpa";
    public static final String KEY_THEME = "widget_theme";

    public static String toFaDigits(String s) {
        if (s == null) return "";
        char[] fa = new char[]{'۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'};
        StringBuilder sb = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (c >= '0' && c <= '9') {
                sb.append(fa[c - '0']);
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    public static void save(
        Context ctx,
        String nextTitle,
        String nextTime,
        String nextRoom,
        String examTitle,
        int examDays,
        String examDate,
        String gpa,
        String unitsPassed,
        String termGpa,
        String theme
    ) {
        SharedPreferences sp = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        sp.edit()
            .putString(KEY_NEXT_TITLE, nextTitle == null ? "" : nextTitle)
            .putString(KEY_NEXT_TIME, nextTime == null ? "" : nextTime)
            .putString(KEY_NEXT_ROOM, nextRoom == null ? "" : nextRoom)
            .putString(KEY_EXAM_TITLE, examTitle == null ? "" : examTitle)
            .putInt(KEY_EXAM_DAYS, examDays)
            .putString(KEY_EXAM_DATE, examDate == null ? "" : examDate)
            .putString(KEY_GPA, gpa == null ? "" : gpa)
            .putString(KEY_UNITS_PASSED, unitsPassed == null ? "" : unitsPassed)
            .putString(KEY_TERM_GPA, termGpa == null ? "" : termGpa)
            .putString(KEY_THEME, theme == null ? "auto" : theme)
            .apply();
    }

    public static void save(
        Context ctx,
        String nextTitle,
        String nextTime,
        String nextRoom,
        String examTitle,
        int examDays,
        String examDate,
        String gpa,
        String unitsPassed,
        String termGpa
    ) {
        save(ctx, nextTitle, nextTime, nextRoom, examTitle, examDays, examDate, gpa, unitsPassed, termGpa, "auto");
    }

    public static void save(
        Context ctx,
        String nextTitle,
        String nextTime,
        String nextRoom,
        String examTitle,
        int examDays,
        String examDate,
        String gpa
    ) {
        save(ctx, nextTitle, nextTime, nextRoom, examTitle, examDays, examDate, gpa, "", "");
    }

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_sarvestan);
        SharedPreferences sp = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);

        String nextTitle = sp.getString(KEY_NEXT_TITLE, "");
        String nextTime = sp.getString(KEY_NEXT_TIME, "");
        String nextRoom = sp.getString(KEY_NEXT_ROOM, "");
        String examTitle = sp.getString(KEY_EXAM_TITLE, "");
        int examDays = sp.getInt(KEY_EXAM_DAYS, -1);
        String examDate = sp.getString(KEY_EXAM_DATE, "");
        String gpa = sp.getString(KEY_GPA, "");
        String theme = sp.getString(KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        // تنظیم پس‌زمینه ویجت و کارت‌های داخلی بر اساس تم روز / شب
        rv.setInt(R.id.w_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_modern : R.drawable.widget_bg_modern_light);
        rv.setInt(R.id.w_combo_card_class, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);
        rv.setInt(R.id.w_combo_card_exam, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);

        int colorBrand = isNight ? Color.parseColor("#34D399") : Color.parseColor("#059669");
        int colorGpaBadge = isNight ? Color.parseColor("#F1F5F9") : Color.parseColor("#1E293B");
        int colorClassBadge = isNight ? Color.parseColor("#38BDF8") : Color.parseColor("#0284C7");
        int colorTitle = isNight ? Color.parseColor("#F8FAFC") : Color.parseColor("#0F172A");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");
        int colorDays = isNight ? Color.WHITE : Color.parseColor("#15803D");

        // 1. سربرگ
        Bitmap bTitle = WidgetTypographyHelper.renderText(context, "سروستان", 13f, colorBrand, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_combo_header_title, bTitle);

        if (gpa != null && !gpa.isEmpty() && !gpa.equals("ـ") && !gpa.equals("-")) {
            Bitmap bGpa = WidgetTypographyHelper.renderText(context, "معدل " + toFaDigits(gpa), 11f, colorGpaBadge, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.LEFT);
            if (bGpa != null) rv.setImageViewBitmap(R.id.w_combo_gpa_img, bGpa);
        }

        // 2. کلاس بعدی
        Bitmap bClassBadge = WidgetTypographyHelper.renderText(context, "کلاس بعدی", 10f, colorClassBadge, WidgetTypographyHelper.getMedium(context), android.graphics.Paint.Align.RIGHT);
        if (bClassBadge != null) rv.setImageViewBitmap(R.id.w_combo_class_badge, bClassBadge);

        String cTitle = (nextTitle == null || nextTitle.isEmpty()) ? "امروز کلاسی ثبت نشده" : nextTitle;
        Bitmap bCTitle = WidgetTypographyHelper.renderText(context, cTitle, 13f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bCTitle != null) rv.setImageViewBitmap(R.id.w_combo_class_title, bCTitle);

        String meta = nextTime == null ? "" : toFaDigits(nextTime);
        if (nextRoom != null && !nextRoom.isEmpty() && !nextRoom.equals("ـ")) {
            meta = meta + " · " + toFaDigits(nextRoom);
        }
        if (meta.isEmpty()) meta = "برنامه هفتگی خالی است";
        Bitmap bCMeta = WidgetTypographyHelper.renderText(context, meta, 10f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bCMeta != null) rv.setImageViewBitmap(R.id.w_combo_class_meta, bCMeta);

        // 3. امتحان
        if (examTitle == null || examTitle.isEmpty() || examDays < 0) {
            Bitmap bETitle = WidgetTypographyHelper.renderText(context, "امتحانی نزدیک نیست", 12f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
            if (bETitle != null) rv.setImageViewBitmap(R.id.w_combo_exam_title, bETitle);

            Bitmap bEMeta = WidgetTypographyHelper.renderText(context, "روزشمار خالی", 10f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
            if (bEMeta != null) rv.setImageViewBitmap(R.id.w_combo_exam_meta, bEMeta);

            Bitmap bEDays = WidgetTypographyHelper.renderTextCenter(context, "—", 11f, colorDays, WidgetTypographyHelper.getBold(context));
            if (bEDays != null) rv.setImageViewBitmap(R.id.w_combo_exam_days, bEDays);
        } else {
            Bitmap bETitle = WidgetTypographyHelper.renderText(context, examTitle, 12f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
            if (bETitle != null) rv.setImageViewBitmap(R.id.w_combo_exam_title, bETitle);

            Bitmap bEMeta = WidgetTypographyHelper.renderText(context, toFaDigits(examDate == null ? "" : examDate), 10f, colorMeta, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
            if (bEMeta != null) rv.setImageViewBitmap(R.id.w_combo_exam_meta, bEMeta);

            String daysStr = examDays == 0 ? "امروز" : examDays == 1 ? "فردا" : (toFaDigits(String.valueOf(examDays)) + " روز");
            Bitmap bEDays = WidgetTypographyHelper.renderTextCenter(context, daysStr, 11f, colorDays, WidgetTypographyHelper.getBold(context));
            if (bEDays != null) rv.setImageViewBitmap(R.id.w_combo_exam_days, bEDays);
        }

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_root,
            android.app.PendingIntent.getActivity(
                context,
                100,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
