package ir.mjbakhshi.sarvestan;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;
import androidx.core.content.res.ResourcesCompat;

/**
 * هلپر تایپوگرافی ویجت‌ها — رندر دقیق متن با فونت فارسی «آراد» به Bitmap شفاف
 * این روش تضمین می‌کند که در تمام لانچرهای اندروید (سامسونگ، شیائومی، پیکسل و...)
 * فونت اختصاصی آراد با اعداد فارسی و بدون بازگشت به روبوتو نمایش یابد.
 */
public class WidgetTypographyHelper {

    private static Typeface sBold;
    private static Typeface sMedium;
    private static Typeface sRegular;

    public static Typeface getBold(Context context) {
        if (sBold == null) {
            try {
                sBold = ResourcesCompat.getFont(context, R.font.arad_bold);
            } catch (Throwable e) {
                try {
                    sBold = Typeface.createFromAsset(context.getAssets(), "fonts/arad_bold.ttf");
                } catch (Throwable e2) {
                    sBold = Typeface.DEFAULT_BOLD;
                }
            }
        }
        return sBold != null ? sBold : Typeface.DEFAULT_BOLD;
    }

    public static Typeface getMedium(Context context) {
        if (sMedium == null) {
            try {
                sMedium = ResourcesCompat.getFont(context, R.font.arad_medium);
            } catch (Throwable e) {
                try {
                    sMedium = Typeface.createFromAsset(context.getAssets(), "fonts/arad_medium.ttf");
                } catch (Throwable e2) {
                    sMedium = Typeface.DEFAULT;
                }
            }
        }
        return sMedium != null ? sMedium : Typeface.DEFAULT;
    }

    public static Typeface getRegular(Context context) {
        if (sRegular == null) {
            try {
                sRegular = ResourcesCompat.getFont(context, R.font.arad_regular);
            } catch (Throwable e) {
                try {
                    sRegular = Typeface.createFromAsset(context.getAssets(), "fonts/arad_regular.ttf");
                } catch (Throwable e2) {
                    sRegular = Typeface.DEFAULT;
                }
            }
        }
        return sRegular != null ? sRegular : Typeface.DEFAULT;
    }

    public static Bitmap renderText(Context context, String text, float sp, int color, Typeface tf, Paint.Align align) {
        if (text == null || text.trim().isEmpty()) return null;
        float density = context.getResources().getDisplayMetrics().density;
        float px = sp * density;

        Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setTypeface(tf != null ? tf : getBold(context));
        paint.setColor(color);
        paint.setTextSize(px);
        paint.setTextAlign(align != null ? align : Paint.Align.CENTER);

        Paint.FontMetrics fm = paint.getFontMetrics();
        float textWidth = paint.measureText(text);
        int width = Math.max(1, (int) Math.ceil(textWidth + 8 * density));
        int height = Math.max(1, (int) Math.ceil(fm.bottom - fm.top + 6 * density));

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);

        float baseline = -fm.top + 3 * density;
        float x = (align == Paint.Align.RIGHT) ? (width - 4 * density) :
                  (align == Paint.Align.LEFT) ? (4 * density) : (width / 2.0f);
        canvas.drawText(text, x, baseline, paint);

        return bitmap;
    }

    public static Bitmap renderTextCenter(Context context, String text, float sp, int color, Typeface tf) {
        return renderText(context, text, sp, color, tf, Paint.Align.CENTER);
    }

    public static Bitmap renderTextRight(Context context, String text, float sp, int color, Typeface tf) {
        return renderText(context, text, sp, color, tf, Paint.Align.RIGHT);
    }
}
