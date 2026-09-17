package ir.mjbakhshi.sarvestan;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "SarvestanInstaller")
public class SarvestanInstallerPlugin extends Plugin {

    private HttpURLConnection openConnectionWithRedirects(String urlString) throws IOException {
        int hops = 0;
        String currentUrl = urlString;
        while (hops < 8) {
            URL url = new URL(currentUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent", "Sarvestan-Android");
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(30000);

            int status = conn.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM
                    || status == 307 || status == 308) {
                String newUrl = conn.getHeaderField("Location");
                conn.disconnect();
                if (newUrl != null && !newUrl.isEmpty()) {
                    currentUrl = newUrl;
                    hops++;
                    continue;
                }
            }
            return conn;
        }
        throw new IOException("تعداد تغییر مسیرها بیش از حد مجاز است");
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("آدرس فایل به‌روزرسانی نامعتبر است");
            return;
        }

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                conn = openConnectionWithRedirects(downloadUrl);
                long contentLength = conn.getContentLengthLong();

                Context ctx = getContext();
                File cacheDir = ctx.getCacheDir();
                File apkFile = new File(cacheDir, "sarvestan_update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                try (InputStream in = conn.getInputStream();
                     FileOutputStream out = new FileOutputStream(apkFile)) {

                    byte[] buffer = new byte[8192];
                    int read;
                    long totalRead = 0;
                    long lastNotifyTime = 0;

                    while ((read = in.read(buffer)) != -1) {
                        out.write(buffer, 0, read);
                        totalRead += read;

                        long now = System.currentTimeMillis();
                        if (contentLength > 0 && (now - lastNotifyTime > 150)) {
                            lastNotifyTime = now;
                            int percent = (int) ((totalRead * 100) / contentLength);
                            JSObject progress = new JSObject();
                            progress.put("percent", Math.min(percent, 99));
                            progress.put("total", contentLength);
                            progress.put("current", totalRead);
                            notifyListeners("downloadProgress", progress);
                        }
                    }
                    out.flush();
                }

                // ارسال وضعیت اتمام دانلود
                JSObject completed = new JSObject();
                completed.put("percent", 100);
                completed.put("total", apkFile.length());
                completed.put("current", apkFile.length());
                notifyListeners("downloadProgress", completed);

                // باز کردن دیالوگ نصب سیستم اندروید
                promptInstall(ctx, apkFile);

                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);

            } catch (Exception e) {
                call.reject("خطا در دانلود یا نصب: " + e.getMessage());
            } finally {
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }).start();
    }

    private void promptInstall(Context ctx, File apkFile) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!ctx.getPackageManager().canRequestPackageInstalls()) {
                try {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:" + ctx.getPackageName()));
                    permIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(permIntent);
                } catch (Exception ignored) {}
            }
        }

        Uri apkUri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", apkFile);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    }
}
