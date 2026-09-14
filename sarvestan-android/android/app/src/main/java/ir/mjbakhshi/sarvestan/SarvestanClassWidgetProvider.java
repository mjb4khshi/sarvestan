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
 * ویجت کلاس بعدی سروستان با فونت بومی آراد و تم دارک
 */
public class SarvestanClassWidgetProvider extends AppWidgetProvider {

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
            int[] ids = mgr.getAppWidgetIds(new ComponentName(context, SarvestanClassWidgetProvider.class));
            onUpdate(context, mgr, ids);
        }
    }

    public static void updateOne(Context context, AppWidgetManager mgr, int id) {
        RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_next_class);
        SharedPreferences sp = context.getSharedPreferences(SarvestanWidgetProvider.PREFS, Context.MODE_PRIVATE);

        String nextTitle = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TITLE, "");
        String nextTime = sp.getString(SarvestanWidgetProvider.KEY_NEXT_TIME, "");
        String nextRoom = sp.getString(SarvestanWidgetProvider.KEY_NEXT_ROOM, "");
        String theme = sp.getString(SarvestanWidgetProvider.KEY_THEME, "auto");

        boolean isNight;
        if ("light".equalsIgnoreCase(theme)) {
            isNight = false;
        } else if ("dark".equalsIgnoreCase(theme)) {
            isNight = true;
        } else {
            isNight = (context.getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES;
        }

        // تنظیم کادرهای پس‌زمینه و کارت داخلی متناسب با تم لایت و دارک
        rv.setInt(R.id.w_class_root, "setBackgroundResource", isNight ? R.drawable.widget_bg_modern : R.drawable.widget_bg_modern_light);
        rv.setInt(R.id.w_class_card_inner, "setBackgroundResource", isNight ? R.drawable.widget_card_inner : R.drawable.widget_card_inner_light);

        int colorBrand = isNight ? Color.parseColor("#34D399") : Color.parseColor("#059669");
        int colorBadge = isNight ? Color.parseColor("#38BDF8") : Color.parseColor("#0284C7");
        int colorTitle = isNight ? Color.WHITE : Color.parseColor("#0F172A");
        int colorTime = isNight ? Color.parseColor("#38BDF8") : Color.parseColor("#0284C7");
        int colorRoom = isNight ? Color.parseColor("#94A3B8") : Color.parseColor("#64748B");

        // 1. سربرگ
        Bitmap bTitle = WidgetTypographyHelper.renderText(context, "سروستان", 13f, colorBrand, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bTitle != null) rv.setImageViewBitmap(R.id.w_class_header_title, bTitle);

        Bitmap bBadge = WidgetTypographyHelper.renderText(context, "کلاس بعدی", 11f, colorBadge, WidgetTypographyHelper.getMedium(context), android.graphics.Paint.Align.LEFT);
        if (bBadge != null) rv.setImageViewBitmap(R.id.w_class_header_badge, bBadge);

        // 2. نام درس
        String titleStr = (nextTitle == null || nextTitle.isEmpty()) ? "امروز کلاسی ثبت نشده" : nextTitle;
        Bitmap bClassTitle = WidgetTypographyHelper.renderText(context, titleStr, 15f, colorTitle, WidgetTypographyHelper.getBold(context), android.graphics.Paint.Align.RIGHT);
        if (bClassTitle != null) rv.setImageViewBitmap(R.id.w_class_title_img, bClassTitle);

        // 3. ساعت
        String timeStr = (nextTime == null || nextTime.isEmpty()) ? "—" : toFaDigits(nextTime);
        Bitmap bTime = WidgetTypographyHelper.renderText(context, timeStr, 11f, colorTime, WidgetTypographyHelper.getMedium(context), android.graphics.Paint.Align.RIGHT);
        if (bTime != null) rv.setImageViewBitmap(R.id.w_class_time_img, bTime);

        // 4. کلاس / دانشکده
        String roomStr = (nextRoom != null && !nextRoom.isEmpty() && !nextRoom.equals("ـ")) ? ("کلاس " + toFaDigits(nextRoom)) : "کلاس حضوری";
        Bitmap bRoom = WidgetTypographyHelper.renderText(context, roomStr, 11f, colorRoom, WidgetTypographyHelper.getRegular(context), android.graphics.Paint.Align.RIGHT);
        if (bRoom != null) rv.setImageViewBitmap(R.id.w_class_room_img, bRoom);

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        rv.setOnClickPendingIntent(
            R.id.w_class_root,
            android.app.PendingIntent.getActivity(
                context,
                102,
                open,
                android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
            )
        );

        mgr.updateAppWidget(id, rv);
    }
}
