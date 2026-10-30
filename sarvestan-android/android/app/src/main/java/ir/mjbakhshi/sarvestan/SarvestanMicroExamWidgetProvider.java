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
 * ویجت مینی بندانگشتی روزشمار نزدیک‌ترین امتحان (۱×۱)
 */
public class SarvestanMicroExamWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanMicroExamWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_micro_exam);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        int examDays = sp.getInt(SarvestanWidgetProvider.KEY_EXAM_DAYS, -1);
        String examTitle = sp.getString(SarvestanWidgetProvider.KEY_EXAM_TITLE, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        rv.setInt(R.id.w_micro_exam_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_micro : R.drawable.widget_bg_micro_light);

        int colorBrand = isNight ? Color.parseColor("#F43F5E") : Color.parseColor("#E11D48");
        int colorValue = isNight ? Color.parseColor("#FB7185") : Color.parseColor("#BE123C");
        int colorMeta = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");

        Bitmap bTag = WidgetTypographyHelper.renderTextCenter(context, "امتحان", 8.5f, colorBrand, WidgetTypographyHelper.getBold(context));
        if (bTag != null) rv.setImageViewBitmap(R.id.w_micro_exam_tag, bTag);

        String valStr;
        if (examDays == 0) {
            valStr = "امروز";
        } else if (examDays == 1) {
            valStr = "فردا";
        } else if (examDays > 1) {
            valStr = SarvestanWidgetProvider.toFaDigits(String.valueOf(examDays)) + " روز";
        } else {
            valStr = "—";
        }

        Bitmap bVal = WidgetTypographyHelper.renderTextCenter(context, valStr, 14.5f, colorValue, WidgetTypographyHelper.getBold(context));
        if (bVal != null) rv.setImageViewBitmap(R.id.w_micro_exam_value, bVal);

        String titleShort = "آزمون";
        if (examTitle != null && !examTitle.isEmpty()) {
            String[] parts = examTitle.trim().split("\\s+");
            titleShort = parts[0];
            if (parts.length > 1 && parts[0].length() <= 4) {
                titleShort += " " + parts[1];
            }
        }
        Bitmap bStatus = WidgetTypographyHelper.renderTextCenter(context, titleShort, 8.5f, colorMeta, WidgetTypographyHelper.getRegular(context));
        if (bStatus != null) rv.setImageViewBitmap(R.id.w_micro_exam_status, bStatus);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", "schedule");
        rv.setOnClickPendingIntent(
            R.id.w_micro_exam_root,
            android.app.PendingIntent.getActivity(
                context,
                206,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
