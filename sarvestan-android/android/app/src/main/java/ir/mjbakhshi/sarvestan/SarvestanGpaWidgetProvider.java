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
 * ویجت اختصاصی معدل کل سروستان با فونت بومی آراد و تم دارک
 */
public class SarvestanGpaWidgetProvider extends AppWidgetProvider {

    private static String toFaDigits(String s) {
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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanGpaWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_gpa);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String gpa = sp.getString(SarvestanWidgetProvider.KEY_GPA, "");
        String unitsPassed = sp.getString("units_passed", "");
        String termGpa = sp.getString("term_gpa", "");

        // 1. سربرگ
        Bitmap bTitle = WidgetTypographyHelper.renderText(context, "سروستان", 13f, Color.parseColor("#34D399"), WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_gpa_header_title, bTitle);

        Bitmap bBadge = WidgetTypographyHelper.renderText(context, "معدل کل", 11f, Color.parseColor("#94A3B8"), WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.LEFT);
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_gpa_header_badge, bBadge);

        // 2. عدد درشت معدل با فونت آراد بولد
        String gpaDisplay = (gpa == null || gpa.isEmpty() || gpa.equals("ـ") || gpa.equals("-")) ? "—" : toFaDigits(gpa);
        Bitmap bVal = WidgetTypographyHelper.renderTextCenter(context, gpaDisplay, 38f, Color.WHITE, WidgetTypographyHelper.getBold(context));
        if (bVal != null) rv.setImageViewBitmap(R.id.w_gpa_value_img, bVal);

        // 3. وضعیت تحصیلی
        String statusText = "وضعیت: عادی";
        int statusColor = Color.parseColor("#0D9275");
        if (!gpaDisplay.equals("—")) {
            try {
                double g = Double.parseDouble(gpa.replace("٫", "."));
                if (g >= 17.0) {
                    statusText = "وضعیت: ممتاز ✨";
                    statusColor = Color.parseColor("#34D399");
                } else if (g < 12.0) {
                    statusText = "وضعیت: مشروط ⚠️";
                    statusColor = Color.parseColor("#F87171");
                }
            } catch (Exception ignore) {}
        } else {
            statusText = "در حال همگام‌سازی";
            statusColor = Color.parseColor("#94A3B8");
        }
        Bitmap bStatus = WidgetTypographyHelper.renderTextCenter(context, statusText, 11f, statusColor, WidgetTypographyHelper.getMedium(context));
        if (bStatus != null) rv.setImageViewBitmap(R.id.w_gpa_status_img, bStatus);

        // 4. واحدهای گذرانده
        String unitsText = (unitsPassed != null && !unitsPassed.isEmpty()) ? ("واحدهای پاس‌شده: " + toFaDigits(unitsPassed)) : "کارنامه فعال";
        Bitmap bUnits = WidgetTypographyHelper.renderText(context, unitsText, 10f, Color.parseColor("#CBD5E1"), WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bUnits != null) rv.setImageViewBitmap(R.id.w_gpa_units_img, bUnits);

        String termText = (termGpa != null && !termGpa.isEmpty()) ? ("ترم: " + toFaDigits(termGpa)) : "ترم جاری";
        Bitmap bTerm = WidgetTypographyHelper.renderText(context, termText, 10f, Color.parseColor("#64748B"), WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.LEFT);
        if (bTerm != null) rv.setImageViewBitmap(R.id.w_gpa_term_img, bTerm);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_gpa_root,
            android.app.PendingIntent.getActivity(
                context,
                101,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
