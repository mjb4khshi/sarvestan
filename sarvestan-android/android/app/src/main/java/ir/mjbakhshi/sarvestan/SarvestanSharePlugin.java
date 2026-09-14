package ir.mjbakhshi.sarvestan;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "SarvestanShare")
public class SarvestanSharePlugin extends Plugin {

    private byte[] decodeBase64(String base64Data) {
        if (base64Data == null) return null;
        String clean = base64Data;
        int commaIdx = clean.indexOf(",");
        if (commaIdx >= 0) {
            clean = clean.substring(commaIdx + 1);
        }
        return Base64.decode(clean, Base64.DEFAULT);
    }

    @PluginMethod
    public void share(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename", "sarvestan-story.png");
        String title = call.getString("title", "اشتراک‌گذاری سروستان");

        byte[] bytes = decodeBase64(base64);
        if (bytes == null || bytes.length == 0) {
            call.reject("تصویر نامعتبر است");
            return;
        }

        try {
            Context ctx = getContext();
            File shareDir = new File(ctx.getCacheDir(), "shared_stories");
            if (!shareDir.exists()) shareDir.mkdirs();
            File imageFile = new File(shareDir, filename);

            try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                fos.write(bytes);
                fos.flush();
            }

            Uri contentUri = FileProvider.getUriForFile(
                ctx,
                ctx.getPackageName() + ".fileprovider",
                imageFile
            );

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/png");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            Intent chooser = Intent.createChooser(shareIntent, title);
            chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Activity activity = getActivity();
            if (activity != null) {
                activity.startActivity(chooser);
            } else {
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(chooser);
            }

            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در اشتراک‌گذاری: " + e.getMessage());
        }
    }

    @PluginMethod
    public void saveToGallery(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename", "sarvestan_" + System.currentTimeMillis() + ".png");

        byte[] bytes = decodeBase64(base64);
        if (bytes == null || bytes.length == 0) {
            call.reject("تصویر نامعتبر است");
            return;
        }

        try {
            Context ctx = getContext();
            ContentResolver resolver = ctx.getContentResolver();
            Uri imageUri = null;

            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Sarvestan");
                values.put(MediaStore.Images.Media.IS_PENDING, 1);
            }

            imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
            if (imageUri != null) {
                try (OutputStream os = resolver.openOutputStream(imageUri)) {
                    if (os != null) {
                        os.write(bytes);
                        os.flush();
                    }
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.clear();
                    values.put(MediaStore.Images.Media.IS_PENDING, 0);
                    resolver.update(imageUri, values, null, null);
                }
            }

            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> Toast.makeText(ctx, "تصویر با موفقیت در گالری ذخیره شد", Toast.LENGTH_SHORT).show());
            }

            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("uri", imageUri != null ? imageUri.toString() : "");
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در ذخیره در گالری: " + e.getMessage());
        }
    }

    @PluginMethod
    public void copyToClipboard(PluginCall call) {
        String base64 = call.getString("base64");
        String filename = call.getString("filename", "sarvestan_clip.png");

        byte[] bytes = decodeBase64(base64);
        if (bytes == null || bytes.length == 0) {
            call.reject("تصویر نامعتبر است");
            return;
        }

        try {
            Context ctx = getContext();
            File shareDir = new File(ctx.getCacheDir(), "shared_stories");
            if (!shareDir.exists()) shareDir.mkdirs();
            File imageFile = new File(shareDir, filename);

            try (FileOutputStream fos = new FileOutputStream(imageFile)) {
                fos.write(bytes);
                fos.flush();
            }

            Uri contentUri = FileProvider.getUriForFile(
                ctx,
                ctx.getPackageName() + ".fileprovider",
                imageFile
            );

            ClipboardManager cm = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
            ClipData clip = ClipData.newUri(ctx.getContentResolver(), "Sarvestan Story", contentUri);
            cm.setPrimaryClip(clip);

            Activity activity = getActivity();
            if (activity != null) {
                activity.runOnUiThread(() -> Toast.makeText(ctx, "تصویر در حافظه کپی شد", Toast.LENGTH_SHORT).show());
            }

            JSObject ret = new JSObject();
            ret.put("ok", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("خطا در کپی: " + e.getMessage());
        }
    }
}
