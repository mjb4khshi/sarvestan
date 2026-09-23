package ir.mjbakhshi.sarvestan;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * ورود بومی و مستقیم SSO دانشگاه صنعتی خواجه نصیرالدین طوسی (sso.kntu.ac.ir)
 * اجرای مستقل پروتکل احراز هویت در لایهٔ Java بدون نیاز به باز شدن WebView
 */
@CapacitorPlugin(name = "SsoLogin")
public class SsoLoginPlugin extends Plugin {

    private static final String TAG = "SsoLogin";
    private SSLSocketFactory trustAllSslFactory;
    private final HostnameVerifier trustAllHostnames = (hostname, session) -> true;

    private SSLSocketFactory getTrustAllSslFactory() {
        if (trustAllSslFactory == null) {
            try {
                TrustManager[] trustAllCerts = new TrustManager[]{
                    new X509TrustManager() {
                        public X509Certificate[] getAcceptedIssuers() {
                            return new X509Certificate[0];
                        }
                        public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                        public void checkServerTrusted(X509Certificate[] certs, String authType) {}
                    }
                };
                SSLContext sc = SSLContext.getInstance("TLS");
                sc.init(null, trustAllCerts, new SecureRandom());
                trustAllSslFactory = sc.getSocketFactory();
            } catch (Exception e) {
                Log.e(TAG, "Error init SSL: " + e.getMessage());
            }
        }
        return trustAllSslFactory;
    }

    private static class HttpResult {
        int status;
        String location;
        String body;
    }

    private HttpResult executeHttp(String urlStr, String method, String body, String contentType, String referer, Map<String, String> cookies) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        if (conn instanceof HttpsURLConnection) {
            SSLSocketFactory sf = getTrustAllSslFactory();
            if (sf != null) {
                ((HttpsURLConnection) conn).setSSLSocketFactory(sf);
                ((HttpsURLConnection) conn).setHostnameVerifier(trustAllHostnames);
            }
        }
        conn.setRequestMethod(method);
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(20000);
        conn.setReadTimeout(25000);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36");

        if (contentType != null) {
            conn.setRequestProperty("Content-Type", contentType);
            if (contentType.contains("json")) {
                conn.setRequestProperty("Accept", "application/json, text/plain, */*");
            } else {
                conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
            }
        } else {
            conn.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
        }

        if (referer != null) {
            conn.setRequestProperty("Referer", referer);
        }
        try {
            conn.setRequestProperty("Origin", url.getProtocol() + "://" + url.getHost());
        } catch (Exception ignore) {}

        if (!cookies.isEmpty()) {
            boolean isBeh = url.getHost() != null && url.getHost().contains("behestan");
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> e : cookies.entrySet()) {
                String k = e.getKey();
                // کوکی‌های Keycloak فقط برای sso — فرستادن آن‌ها به IIS نشست کاری را خراب می‌کند
                if (isBeh && (k.startsWith("KC_") || k.startsWith("KEYCLOAK_")
                        || k.equals("AUTH_SESSION_ID") || k.equals("KC_RESTART")
                        || k.equals("JSESSIONID") || k.equals("OAuth_Token_Request_State"))) {
                    continue;
                }
                if (sb.length() > 0) sb.append("; ");
                sb.append(k).append("=").append(e.getValue());
            }
            if (sb.length() > 0) {
                conn.setRequestProperty("Cookie", sb.toString());
            }
        }

        if ("POST".equalsIgnoreCase(method) && body != null) {
            conn.setDoOutput(true);
            byte[] bytes = body.getBytes("UTF-8");
            conn.setFixedLengthStreamingMode(bytes.length);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(bytes);
                os.flush();
            }
        }

        int status = conn.getResponseCode();

        // Capture Set-Cookie headers
        for (Map.Entry<String, List<String>> header : conn.getHeaderFields().entrySet()) {
            if ("set-cookie".equalsIgnoreCase(header.getKey())) {
                for (String sc : header.getValue()) {
                    if (sc == null) continue;
                    String[] parts = sc.split(";");
                    if (parts.length > 0) {
                        String pair = parts[0].trim();
                        int eq = pair.indexOf('=');
                        if (eq > 0) {
                            String name = pair.substring(0, eq).trim();
                            String val = pair.substring(eq + 1).trim();
                            if (!name.isEmpty()) {
                                cookies.put(name, val);
                            }
                        }
                    }
                }
            }
        }

        HttpResult res = new HttpResult();
        res.status = status;
        res.location = conn.getHeaderField("Location");

        InputStream is = null;
        try {
            if (status >= 400) {
                is = conn.getErrorStream();
            } else {
                is = conn.getInputStream();
            }
        } catch (Exception ignore) {}

        if (is != null) {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line).append("\n");
                }
            }
            res.body = sb.toString();
        } else {
            res.body = "";
        }

        conn.disconnect();
        return res;
    }

    private String extractCodeFromUrl(String url) {
        if (url == null) return null;
        try {
            int i = url.indexOf("code=");
            if (i >= 0) {
                String rest = url.substring(i + 5);
                int amp = rest.indexOf('&');
                if (amp >= 0) rest = rest.substring(0, amp);
                return URLDecoder.decode(rest, "UTF-8");
            }
        } catch (Exception ignore) {}
        return null;
    }

    private String decodeHtml(String s) {
        if (s == null) return "";
        return s.replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#x3d;", "=")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
    }

    @PluginMethod
    public void login(PluginCall call) {
        String username = call.getString("username", "").trim();
        String password = call.getString("password", "");

        if (username.isEmpty() || password.isEmpty()) {
            call.reject("نام کاربری و رمز عبور الزامی است");
            return;
        }

        new Thread(() -> {
            try {
                Map<String, String> cookies = new LinkedHashMap<>();
                String state = "st" + System.currentTimeMillis();
                String authUrl = "https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth" +
                    "?client_id=behestan.kntu.ac.ir" +
                    "&redirect_uri=" + URLEncoder.encode("https://behestan.kntu.ac.ir/index.html", "UTF-8") +
                    "&response_type=code&scope=" + URLEncoder.encode("openid profile", "UTF-8") +
                    "&state=" + state;

                // Step 1: دریافت فرم ورود Keycloak
                String currentUrl = authUrl;
                HttpResult getRes = null;
                for (int i = 0; i < 6; i++) {
                    getRes = executeHttp(currentUrl, "GET", null, null, null, cookies);
                    if (getRes.status >= 300 && getRes.status < 400 && getRes.location != null) {
                        currentUrl = new URL(new URL(currentUrl), getRes.location).toString();
                        continue;
                    }
                    break;
                }

                if (getRes == null || getRes.body == null || getRes.body.isEmpty()) {
                    call.reject("عدم دریافت پاسخ از سرور SSO دانشگاه (کد " + (getRes != null ? getRes.status : 0) + ")");
                    return;
                }

                // یافتن آدرس اکشن فرم
                Pattern actionPat = Pattern.compile("action\\s*=\\s*[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);
                Matcher mAct = actionPat.matcher(getRes.body);
                String action = null;
                if (mAct.find()) {
                    action = decodeHtml(mAct.group(1).trim());
                }

                if (action == null) {
                    Pattern fbPat = Pattern.compile("class=[\"'][^\"']*kc-feedback-text[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/", Pattern.CASE_INSENSITIVE);
                    Matcher mFb = fbPat.matcher(getRes.body);
                    if (mFb.find()) {
                        call.reject("پیام سامانه احراز هویت: " + decodeHtml(mFb.group(1).trim()));
                        return;
                    }
                    call.reject("فرم ورود SSO پیدا نشد (کد وضعیت " + getRes.status + ")");
                    return;
                }

                String actionUrl = new URL(new URL(currentUrl), action).toString();

                // استخراج فیلدهای مخفی فرم
                Map<String, String> hidden = new LinkedHashMap<>();
                Pattern inputPat = Pattern.compile("<input[^>]+type=[\"']hidden[\"'][^>]*>", Pattern.CASE_INSENSITIVE);
                Matcher mInp = inputPat.matcher(getRes.body);
                while (mInp.find()) {
                    String tag = mInp.group(0);
                    Matcher mName = Pattern.compile("name=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE).matcher(tag);
                    Matcher mVal = Pattern.compile("value=[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE).matcher(tag);
                    if (mName.find()) {
                        hidden.put(mName.group(1), mVal.find() ? decodeHtml(mVal.group(1)) : "");
                    }
                }

                // Step 2: ارسال اطلاعات کاربری
                StringBuilder formBody = new StringBuilder();
                formBody.append("username=").append(URLEncoder.encode(username, "UTF-8"));
                formBody.append("&password=").append(URLEncoder.encode(password, "UTF-8"));
                formBody.append("&credentialId=");
                for (Map.Entry<String, String> entry : hidden.entrySet()) {
                    if ("username".equalsIgnoreCase(entry.getKey()) || "password".equalsIgnoreCase(entry.getKey())) continue;
                    formBody.append("&").append(URLEncoder.encode(entry.getKey(), "UTF-8"))
                            .append("=").append(URLEncoder.encode(entry.getValue(), "UTF-8"));
                }
                if (!hidden.containsKey("login")) {
                    formBody.append("&login=").append(URLEncoder.encode("Sign In", "UTF-8"));
                }

                String postUrl = actionUrl;
                HttpResult postRes = null;
                String code = null;

                for (int i = 0; i < 8; i++) {
                    postRes = executeHttp(postUrl, "POST", formBody.toString(), "application/x-www-form-urlencoded", currentUrl, cookies);
                    if (postRes.status >= 300 && postRes.status < 400 && postRes.location != null) {
                        postUrl = new URL(new URL(postUrl), postRes.location).toString();
                        code = extractCodeFromUrl(postUrl);
                        if (code != null) break;

                        postRes = executeHttp(postUrl, "GET", null, null, null, cookies);
                        if (postRes.location != null) {
                            postUrl = new URL(new URL(postUrl), postRes.location).toString();
                            code = extractCodeFromUrl(postUrl);
                            if (code != null) break;
                            continue;
                        }
                    }
                    break;
                }

                if (code == null && postRes != null) {
                    code = extractCodeFromUrl(postUrl);
                    if (code == null && postRes.body != null) {
                        Matcher mCode = Pattern.compile("[?&]code=([A-Za-z0-9._~%-]+)").matcher(postRes.body);
                        if (mCode.find()) code = URLDecoder.decode(mCode.group(1), "UTF-8");
                    }
                }

                if (code == null) {
                    String err = "";
                    if (postRes != null && postRes.body != null) {
                        Matcher mFb = Pattern.compile("class=[\"'][^\"']*kc-feedback-text[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/", Pattern.CASE_INSENSITIVE).matcher(postRes.body);
                        if (mFb.find()) err = decodeHtml(mFb.group(1).trim());
                        else if (postRes.body.contains("Invalid username or password")) err = "نام کاربری یا کلمه عبور نادرست است.";
                    }
                    call.reject(err.isEmpty() ? "ورود ناموفق — نام کاربری یا کلمه عبور نادرست است." : err);
                    return;
                }

                // Step 3: GET exact return URL (مثل مرورگر: /browser/fa/?state=..&session_state=..&iss=..&code=..)
                // بازسازی دستی index.html?code= باعث می‌شود نشست کاری ساخته نشود (50216)
                String behUrl = (postUrl != null && postUrl.contains("code="))
                        ? postUrl
                        : "https://behestan.kntu.ac.ir/browser/fa/?state=" + state + "&code=" + URLEncoder.encode(code, "UTF-8");
                try {
                    executeHttp(behUrl, "GET", null, null, null, cookies);
                } catch (Exception ignore) {}

                // Step 4: گرم کردن نشست وب بهستان (loginapi act 00)
                try {
                    executeHttp("https://behestan.kntu.ac.ir/frm/loginapi/loginapi.svc/", "POST", "{\"r\":{},\"rp\":{},\"act\":\"00\"}", "application/json", "https://behestan.kntu.ac.ir/browser/fa/", cookies);
                } catch (Exception ignore) {}

                // Step 5: اعتبارسنجی OAuth2 در بهستان (act 09)
                String oauthBody = "{\"act\":\"09\",\"r\":{\"code\":\"" + code + "\",\"ticket\":\"\",\"l\":\"\",\"p\":\"\",\"d\":\"0\",\"c\":\"\",\"rsc\":\"112\"},\"rp\":{}}";
                HttpResult oauthRes = executeHttp("https://behestan.kntu.ac.ir/frmc/Authentication/oauth2/", "POST", oauthBody, "application/json", "https://behestan.kntu.ac.ir/", cookies);

                if (oauthRes.body == null || oauthRes.body.isEmpty()) {
                    call.reject("پاسخ oauth2 بهستان خالی بود");
                    return;
                }

                JSONObject oauthJson;
                try {
                    oauthJson = new JSONObject(oauthRes.body);
                } catch (Exception e) {
                    call.reject("پاسخ نامعتبر oauth2: " + oauthRes.body.substring(0, Math.min(120, oauthRes.body.length())));
                    return;
                }

                String sid = null;
                if (oauthJson.has("oaut") && !oauthJson.isNull("oaut")) {
                    JSONObject oaut = oauthJson.getJSONObject("oaut");
                    if (oaut.has("rp") && !oaut.isNull("rp")) {
                        sid = oaut.getJSONObject("rp").optString("sid", null);
                    }
                }
                String ticket = oauthJson.optString("t", null);

                if (sid == null || ticket == null) {
                    String err = "نشست از بهستان برنگشت";
                    if (oauthJson.has("msg") && !oauthJson.isNull("msg")) {
                        JSONObject msg = oauthJson.getJSONObject("msg");
                        if (msg.has("errors") && !msg.isNull("errors")) {
                            err = msg.getJSONArray("errors").optString(0, err);
                        }
                    }
                    call.reject(err);
                    return;
                }

                // Step 6: فعال‌سازی نشست کاری + شناسه دانشجو (sys nav 11130) — مثل loginViaCentralSso روی وب
                String detectedStd = null;
                String detectedUid = null;
                try {
                    String navBody = "{\"r\":{\"fid\":\"11130\",\"ft\":\"0\",\"subfrm\":\"\"},\"act\":\"nav\"," +
                        "\"rp\":{\"sp\":\"{\\\"BrnNo\\\":\\\"0\\\",\\\"BrnLimit\\\":\\\"0\\\",\\\"UsrType\\\":\\\"0\\\",\\\"TrmType\\\":\\\"2\\\"}\"," +
                        "\"loc\":\"fa\",\"ut\":\"0\",\"b\":\"0\",\"sid\":\"" + sid + "\"},\"t\":" + JSONObject.quote(ticket) + "}";
                    HttpResult navRes = executeHttp("https://behestan.kntu.ac.ir/frm/sys/sys.svc/", "POST", navBody, "application/json", "https://behestan.kntu.ac.ir/browser/fa/", cookies);
                    if (navRes.body != null && !navRes.body.isEmpty()) {
                        JSONObject navJson = new JSONObject(navRes.body);
                        if (navJson.has("t") && !navJson.isNull("t")) {
                            ticket = navJson.optString("t", ticket);
                        }
                        if (navJson.has("outpar") && !navJson.isNull("outpar")) {
                            JSONObject outpar = navJson.getJSONObject("outpar");
                            if (outpar.has("std") && !outpar.isNull("std")) {
                                detectedStd = outpar.optString("std", null);
                            }
                            if (outpar.has("u") && !outpar.isNull("u")) {
                                detectedUid = outpar.optString("u", null);
                            }
                        }
                    }
                } catch (Exception ignore) {}

                // فقط کوکی‌های دامنه بهستان — کوکی‌های Keycloak مانع پردازش نشست در IIS می‌شوند
                StringBuilder cookieHeader = new StringBuilder();
                for (Map.Entry<String, String> e : cookies.entrySet()) {
                    String k = e.getKey();
                    if (k.startsWith("KC_") || k.startsWith("KEYCLOAK_") || k.equals("AUTH_SESSION_ID") || k.equals("KC_RESTART")) {
                        continue;
                    }
                    // کوکی‌های SSO نباید به IIS بهستان بروند (مثل فیلتر domain در curl jar)
                    if (k.equals("JSESSIONID") || k.equals("KEYCLOAK_SESSION") || k.equals("OAuth_Token_Request_State")) {
                        continue;
                    }
                    if (cookieHeader.length() > 0) cookieHeader.append("; ");
                    cookieHeader.append(k).append("=").append(e.getValue());
                }

                String studentId = detectedStd;
                if (studentId == null || studentId.isEmpty()) {
                    studentId = username; // نام کاربری SSO — گزارش ۸۸ بعداً شمارهٔ دانشجویی واقعی را جایگزین می‌کند
                }

                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("sid", sid);
                ret.put("ticket", ticket);
                ret.put("cookies", cookieHeader.toString());
                ret.put("studentId", studentId);
                if (detectedUid != null && !detectedUid.isEmpty()) {
                    ret.put("userId", detectedUid);
                }
                ret.put("source", "native_java");
                call.resolve(ret);

            } catch (Exception e) {
                Log.e(TAG, "Login error: " + e.getMessage(), e);
                call.reject("خطای ارتباط با سرور احراز هویت: " + e.getMessage());
            }
        }).start();
    }
}
