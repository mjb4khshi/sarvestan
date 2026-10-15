package ir.mjbakhshi.sarvestan;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
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

/**
 * ورود بومی و مستقیم SSO دانشگاه صنعتی خواجه نصیرالدین طوسی (sso.kntu.ac.ir)
 * اجرای مستقل پروتکل احراز هویت در لایهٔ Java بدون نیاز به باز شدن WebView
 */
@CapacitorPlugin(name = "SsoLogin")
public class SsoLoginPlugin extends Plugin {

    private static final String TAG = "SsoLogin";
    private static final Map<String, String> sSavedUtSsoCookies = new LinkedHashMap<>();
    private static final Map<String, String> sSavedKntuSsoCookies = new LinkedHashMap<>();

    private static class HttpResult {
        int status;
        String location;
        String body;
    }

    private HttpResult executeHttp(String urlStr, String method, String body, String contentType, String referer, Map<String, String> cookies) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
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
            boolean isBeh = url.getHost() != null && (url.getHost().contains("behestan") || url.getHost().contains("ems2.ut.ac.ir"));
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> e : cookies.entrySet()) {
                String k = e.getKey();
                // کوکی‌های درگاه احراز هویت (Keycloak یا sso1.ut) فقط برای SSO است و فرستادن آن‌ها به IIS نشست را خراب می‌کند
                if (isBeh && (k.startsWith("KC_") || k.startsWith("KEYCLOAK_")
                        || k.startsWith(".AspNetCore") || k.startsWith("idsrv") || k.startsWith("SignInMessage")
                        || k.startsWith("__RequestVerification")
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
        String uniId = call.getString("uniId", "kntu");

        if (username.isEmpty() || password.isEmpty()) {
            call.reject("نام کاربری و رمز عبور الزامی است");
            return;
        }

        if ("ut".equalsIgnoreCase(uniId)) {
            loginUt(call, username, password);
        } else if ("aut".equalsIgnoreCase(uniId)) {
            loginAut(call, username, password);
        } else {
            loginKntu(call, username, password);
        }
    }

    private void loginKntu(PluginCall call, String username, String password) {
        new Thread(() -> {
            try {
                String selectedUserNo = call.getString("selectedUserNo", null);
                String selectedUserType = call.getString("selectedUserType", "1");
                Map<String, String> cookies = new LinkedHashMap<>();
                if (selectedUserNo != null && !selectedUserNo.isEmpty()) {
                    synchronized (sSavedKntuSsoCookies) {
                        cookies.putAll(sSavedKntuSsoCookies);
                    }
                } else {
                    synchronized (sSavedKntuSsoCookies) {
                        sSavedKntuSsoCookies.clear();
                    }
                }

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

                String code = extractCodeFromUrl(currentUrl);
                String postUrl = currentUrl;
                HttpResult postRes = getRes;

                // اگر از قبل نشست فعال بود و مستقیماً کد صادر شد، نیاز به ارسال مجدد فرم لاگین نیست
                if (code == null) {
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

                    postUrl = actionUrl;
                    postRes = null;

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
                    boolean isBadCredentials = false;
                    if (postRes != null && postRes.body != null) {
                        Matcher mFb = Pattern.compile("class=[\"'][^\"']*kc-feedback-text[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/", Pattern.CASE_INSENSITIVE).matcher(postRes.body);
                        if (mFb.find()) {
                            err = decodeHtml(mFb.group(1).trim());
                            isBadCredentials = true;
                        } else if (postRes.body.contains("Invalid username or password") ||
                                 postRes.body.contains("invalid username or password") ||
                                 (postRes.body.contains("کاربری") && (postRes.body.contains("نادرست") || postRes.body.contains("اشتباه")))) {
                            err = "نام کاربری یا رمز عبور اشتباه است.";
                            isBadCredentials = true;
                        }
                    }

                    // اگر خطای پسورد نبود، یعنی لاگین موفق بوده اما Keycloak به صفحه انتخاب اکانت/رشته کهاد رفته
                    if (!isBadCredentials && postRes != null && postRes.status == 200) {
                        JSObject selectRes = new JSObject();
                        selectRes.put("ok", false);
                        selectRes.put("error", "اکانت دارای چند رشته است (طرح کهاد/دو رشته‌ای)");
                        selectRes.put("code", "needs-account-selection");
                        call.reject("اکانت دارای چند رشته است (طرح کهاد/دو رشته‌ای)", "needs-account-selection", selectRes);
                        return;
                    }

                    String finalErr = err.isEmpty() ? "نام کاربری یا رمز عبور اشتباه است." : err;
                    JSObject fail = new JSObject();
                    fail.put("ok", false);
                    fail.put("error", finalErr);
                    fail.put("code", "bad-credentials");
                    call.reject(finalErr, "bad-credentials", fail);
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

                // بررسی وجود چند حساب کاربری / طرح کهاد
                JSONArray accounts = null;
                if (oauthJson.has("rset") && !oauthJson.isNull("rset")) {
                    JSONObject rset = oauthJson.getJSONObject("rset");
                    if (rset.has("grd") && !rset.isNull("grd")) {
                        JSONArray grd = rset.getJSONArray("grd");
                        if (grd.length() > 0) {
                            String xml = grd.getJSONObject(0).optString("xml", "");
                            if (xml.contains("accountInfo")) {
                                try {
                                    JSONObject accObj = new JSONObject(xml);
                                    accounts = accObj.getJSONArray("accountInfo");
                                } catch (Exception ignore) {}
                            }
                        }
                    }
                }

                if ((ticket == null || ticket.isEmpty() || "null".equals(ticket)) && accounts != null && accounts.length() > 0) {
                    // اگر کاربر نام کاربری را برابر یکی از شماره‌های دانشجویی زده، خودکار همان را انتخاب کن
                    if (selectedUserNo == null || selectedUserNo.isEmpty()) {
                        for (int a = 0; a < accounts.length(); a++) {
                            JSONObject acc = accounts.getJSONObject(a);
                            String uNo = acc.optString("UserNo", "");
                            if (uNo.equals(username)) {
                                selectedUserNo = uNo;
                                selectedUserType = acc.optString("UserType", "1");
                                break;
                            }
                        }
                    }

                    // اگر هنوز انتخاب نشده، لیست را برای انتخاب کاربر به فرانت‌اند بفرست
                    if (selectedUserNo == null || selectedUserNo.isEmpty()) {
                        synchronized (sSavedKntuSsoCookies) {
                            sSavedKntuSsoCookies.clear();
                            sSavedKntuSsoCookies.putAll(cookies);
                        }
                        JSObject selectFail = new JSObject();
                        selectFail.put("ok", false);
                        selectFail.put("code", "needs-kahad-selection");
                        selectFail.put("error", "اکانت دارای چند رشته است (طرح کهاد/دو رشته‌ای)");
                        try {
                            selectFail.put("accounts", new com.getcapacitor.JSArray(accounts.toString()));
                        } catch (Exception ignore) {
                            selectFail.put("accountsRaw", accounts.toString());
                        }
                        call.reject("اکانت دارای چند رشته است (طرح کهاد/دو رشته‌ای)", "needs-kahad-selection", selectFail);
                        return;
                    }

                    // انتخاب مشخص شده؛ یک کد تایید تازه از SSO می‌گیریم (نشست فعال است و بلافاصله ۳۰۲ می‌دهد)
                    String reAuthUrl = "https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth" +
                        "?client_id=behestan.kntu.ac.ir" +
                        "&redirect_uri=" + URLEncoder.encode("https://behestan.kntu.ac.ir/index.html", "UTF-8") +
                        "&response_type=code&scope=" + URLEncoder.encode("openid profile", "UTF-8") +
                        "&state=" + System.currentTimeMillis();

                    HttpResult reAuthRes = executeHttp(reAuthUrl, "GET", null, null, null, cookies);
                    String secondCode = null;
                    if (reAuthRes.status >= 300 && reAuthRes.status < 400 && reAuthRes.location != null) {
                        secondCode = extractCodeFromUrl(reAuthRes.location);
                    }
                    if (secondCode == null) {
                        secondCode = code; // در صورت عدم دریافت کد جدید از همان کد قبلی استفاده کن
                    }

                    // ارسال درخواست مرحله دوم با مشخص کردن شماره دانشجویی رشته انتخابی
                    String finalOauthBody = "{\"act\":\"09\",\"r\":{\"code\":\"" + secondCode +
                        "\",\"ticket\":\"\",\"l\":\"\",\"p\":\"\",\"d\":\"0\",\"c\":\"\",\"rsc\":\"112\"," +
                        "\"un\":\"" + selectedUserNo + "\",\"ut\":\"" + selectedUserType + "\"},\"rp\":{}}";

                    HttpResult secondOauthRes = executeHttp("https://behestan.kntu.ac.ir/frmc/Authentication/oauth2/", "POST", finalOauthBody, "application/json", "https://behestan.kntu.ac.ir/", cookies);
                    if (secondOauthRes.body != null && !secondOauthRes.body.isEmpty()) {
                        try {
                            JSONObject secondJson = new JSONObject(secondOauthRes.body);
                            ticket = secondJson.optString("t", null);
                            if (secondJson.has("oaut") && !secondJson.isNull("oaut")) {
                                JSONObject oaut2 = secondJson.getJSONObject("oaut");
                                if (oaut2.has("rp") && !oaut2.isNull("rp")) {
                                    sid = oaut2.getJSONObject("rp").optString("sid", sid);
                                }
                            }
                        } catch (Exception ignore) {}
                    }
                }

                if (sid == null || ticket == null || "null".equals(ticket)) {
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

                synchronized (sSavedKntuSsoCookies) {
                    sSavedKntuSsoCookies.clear();
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

    private void loginUt(PluginCall call, String username, String password) {
        new Thread(() -> {
            try {
                String selectedUserNo = call.getString("selectedUserNo", null);
                String selectedUserType = call.getString("selectedUserType", "1");

                Map<String, String> cookies = new LinkedHashMap<>();
                if (selectedUserNo != null && !selectedUserNo.isEmpty()) {
                    synchronized (sSavedUtSsoCookies) {
                        cookies.putAll(sSavedUtSsoCookies);
                    }
                } else {
                    synchronized (sSavedUtSsoCookies) {
                        sSavedUtSsoCookies.clear();
                    }
                }

                String state = "st" + System.currentTimeMillis();
                String clientId = "golestanSSO-xRwHTGSHGtjmLJbqr2k9GDSOoai-TCc.apigateway.ut.ac.ir";
                String redirectUri = "https://ems2.ut.ac.ir/index.html";
                String authUrl = "https://sso1.ut.ac.ir/ApiContainer.SSO.RCL1/connect/authorize" +
                        "?client_id=" + URLEncoder.encode(clientId, "UTF-8") +
                        "&redirect_uri=" + URLEncoder.encode(redirectUri, "UTF-8") +
                        "&response_type=code&scope=openid&state=" + state;

                // ۱) دریافت صفحه فرم لاگین sso1.ut.ac.ir یا ریدایرکت خودکار در صورت وجود نشست فعال
                String currentUrl = authUrl;
                HttpResult page1 = null;
                String code = null;
                for (int i = 0; i < 6; i++) {
                    page1 = executeHttp(currentUrl, "GET", null, null, null, cookies);
                    if (page1.status >= 300 && page1.status < 400 && page1.location != null) {
                        currentUrl = new URL(new URL(currentUrl), page1.location).toString();
                        code = extractCodeFromUrl(currentUrl);
                        if (code != null) break;
                        continue;
                    }
                    break;
                }

                // اگر از قبل نشست SSO فعال بوده و کد تولید شده باشد، دیگر فرم لاگین ارسال نمی‌شود
                if (code == null) {
                    if (page1 == null || page1.body == null || page1.body.isEmpty()) {
                        call.reject("عدم دریافت پاسخ از سرور احراز هویت دانشگاه تهران");
                        return;
                    }

                    // استخراج __RequestVerificationToken
                    String token = "";
                    Matcher mTok = Pattern.compile("name=[\"']__RequestVerificationToken[\"'][^>]+value=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE).matcher(page1.body);
                    if (mTok.find()) {
                        token = mTok.group(1);
                    } else {
                        Matcher mTok2 = Pattern.compile("value=[\"']([^\"']+)[\"'][^>]+name=[\"']__RequestVerificationToken[\"']", Pattern.CASE_INSENSITIVE).matcher(page1.body);
                        if (mTok2.find()) token = mTok2.group(1);
                    }

                    // استخراج ReturnUrl
                    String returnUrl = "";
                    Matcher mRet = Pattern.compile("id=[\"']ReturnUrl[\"'][^>]+value=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE).matcher(page1.body);
                    if (mRet.find()) {
                        returnUrl = decodeHtml(mRet.group(1));
                    } else {
                        Matcher mRet2 = Pattern.compile("[?&]ReturnUrl=([^&]+)", Pattern.CASE_INSENSITIVE).matcher(currentUrl);
                        if (mRet2.find()) {
                            returnUrl = URLDecoder.decode(mRet2.group(1), "UTF-8");
                        }
                    }

                    // ارسال فرم به https://sso1.ut.ac.ir/ApiContainer.SSO.RCL1/Account/login
                    StringBuilder postParams = new StringBuilder();
                    postParams.append("ReturnUrl=").append(URLEncoder.encode(returnUrl, "UTF-8"));
                    postParams.append("&captcha=");
                    postParams.append("&Username=").append(URLEncoder.encode(username, "UTF-8"));
                    postParams.append("&Password=").append(URLEncoder.encode(password, "UTF-8"));
                    postParams.append("&RememberLogin=").append(URLEncoder.encode("true", "UTF-8"));
                    postParams.append("&button=").append(URLEncoder.encode("login", "UTF-8"));
                    postParams.append("&__RequestVerificationToken=").append(URLEncoder.encode(token, "UTF-8"));
                    postParams.append("&RememberLogin=").append(URLEncoder.encode("false", "UTF-8"));

                    String postUrl = "https://sso1.ut.ac.ir/ApiContainer.SSO.RCL1/Account/login";
                    HttpResult postRes = executeHttp(postUrl, "POST", postParams.toString(), "application/x-www-form-urlencoded", currentUrl, cookies);

                    // دنبال کردن ریدایرکت‌های ۳۰۲ با متد GET (مشابه مرورگر)
                    for (int i = 0; i < 8 && postRes != null && postRes.status >= 300 && postRes.status < 400 && postRes.location != null; i++) {
                        postUrl = new URL(new URL(postUrl), postRes.location).toString();
                        code = extractCodeFromUrl(postUrl);
                        if (code != null) break;
                        postRes = executeHttp(postUrl, "GET", null, null, null, cookies);
                    }

                    if (code == null && postUrl != null) {
                        code = extractCodeFromUrl(postUrl);
                    }
                    if (code == null && postRes != null && postRes.body != null) {
                        Matcher mCode = Pattern.compile("[?&]code=([A-Za-z0-9._~%-]+)").matcher(postRes.body);
                        if (mCode.find()) code = URLDecoder.decode(mCode.group(1), "UTF-8");
                    }

                    if (code == null) {
                        String err = "";
                        if (postRes != null && postRes.body != null) {
                            if (postRes.body.contains("نام کاربری و یا رمز عبور اشتباه است") ||
                                postRes.body.contains("نام کاربری یا کلمه عبور نادرست است") ||
                                postRes.body.contains("کلمه عبور اشتباه است") ||
                                postRes.body.contains("Invalid username or password")) {
                                err = "نام کاربری یا رمز عبور اشتباه است.";
                            } else {
                                Matcher mVal = Pattern.compile("validation-summary-errors[^>]*>[\\s\\S]*?<li>([\\s\\S]*?)<\\/li>", Pattern.CASE_INSENSITIVE).matcher(postRes.body);
                                if (mVal.find()) {
                                    err = decodeHtml(mVal.group(1).replaceAll("<[^>]+>", " ").trim());
                                } else {
                                    Matcher mErr = Pattern.compile("class=[\"'][^\"']*alert-danger[^\"']*[\"'][^>]*>([\\s\\S]*?)<\\/div>", Pattern.CASE_INSENSITIVE).matcher(postRes.body);
                                    if (mErr.find()) {
                                        err = decodeHtml(mErr.group(1).replaceAll("<[^>]+>", " ").trim());
                                    }
                                }
                            }
                        }
                        if (err.isEmpty()) {
                            if (postRes == null) {
                                err = "عدم دریافت پاسخ از سرور احراز هویت دانشگاه تهران";
                            } else if (postRes.status >= 500) {
                                err = "خطای سرور احراز هویت دانشگاه تهران (کد " + postRes.status + ")";
                            } else {
                                err = "نام کاربری یا رمز عبور اشتباه است.";
                            }
                        }
                        boolean isBadCred = err.contains("رمز عبور") || err.contains("کاربری");
                        JSObject fail = new JSObject();
                        fail.put("ok", false);
                        fail.put("error", err);
                        fail.put("code", isBadCred ? "bad-credentials" : "sso-error");
                        call.reject(err, isBadCred ? "bad-credentials" : "sso-error", fail);
                        return;
                    }
                }

                // ذخیره کوکی‌های فعال درگاه احراز هویت برای مرحله دوم انتخاب پرونده (طرح کهاد)
                synchronized (sSavedUtSsoCookies) {
                    sSavedUtSsoCookies.clear();
                    sSavedUtSsoCookies.putAll(cookies);
                }

                // گرم کردن نشست بهستان تهران (act=00)
                try {
                    executeHttp("https://ems2.ut.ac.ir/frm/loginapi/loginapi.svc/", "POST", "{\"r\":{},\"rp\":{},\"act\":\"00\"}", "application/json", "https://ems2.ut.ac.ir/browser/fa/", cookies);
                } catch (Exception ignore) {}

                // تبادل کد oauth2 با بهستان تهران (rsc: 120)
                JSONObject verifyObj = new JSONObject();
                verifyObj.put("code", code);
                verifyObj.put("ticket", "");
                verifyObj.put("l", "");
                verifyObj.put("p", "");
                verifyObj.put("d", "0");
                verifyObj.put("c", "");
                verifyObj.put("rsc", "120");
                if (selectedUserNo != null && !selectedUserNo.isEmpty()) {
                    verifyObj.put("un", selectedUserNo);
                    verifyObj.put("ut", selectedUserType);
                }

                JSONObject reqJson = new JSONObject();
                reqJson.put("act", "09");
                reqJson.put("r", verifyObj);
                reqJson.put("rp", new JSONObject());

                HttpResult oauthRes = executeHttp("https://ems2.ut.ac.ir/frmc/Authentication/oauth2/", "POST", reqJson.toString(), "application/json", "https://ems2.ut.ac.ir/browser/fa/", cookies);

                if (oauthRes.body == null || oauthRes.body.isEmpty()) {
                    call.reject("پاسخ احراز هویت گلستان تهران خالی بود");
                    return;
                }

                JSONObject oauthJson = new JSONObject(oauthRes.body);
                String sid = null;
                if (oauthJson.has("oaut") && !oauthJson.isNull("oaut")) {
                    JSONObject oaut = oauthJson.getJSONObject("oaut");
                    if (oaut.has("rp") && !oaut.isNull("rp")) {
                        sid = oaut.getJSONObject("rp").optString("sid", null);
                    }
                }
                String ticket = oauthJson.optString("t", null);

                // بررسی کهاد / چند پرونده
                JSONArray accounts = null;
                if (oauthJson.has("rset") && !oauthJson.isNull("rset")) {
                    JSONObject rset = oauthJson.getJSONObject("rset");
                    if (rset.has("grd") && !rset.isNull("grd")) {
                        JSONArray grd = rset.getJSONArray("grd");
                        if (grd.length() > 0) {
                            String xml = grd.getJSONObject(0).optString("xml", "");
                            if (xml.contains("accountInfo")) {
                                try {
                                    JSONObject accObj = new JSONObject(xml);
                                    accounts = accObj.optJSONArray("accountInfo");
                                } catch (Exception ignore) {}
                            }
                        }
                    }
                }

                if ((ticket == null || ticket.isEmpty() || "null".equals(ticket)) && accounts != null && accounts.length() > 0) {
                    if (selectedUserNo == null || selectedUserNo.isEmpty()) {
                        for (int i = 0; i < accounts.length(); i++) {
                            JSONObject acc = accounts.getJSONObject(i);
                            if (username.equals(acc.optString("UserNo", ""))) {
                                selectedUserNo = acc.optString("UserNo");
                                selectedUserType = acc.optString("UserType", "1");
                                break;
                            }
                        }
                    }

                    if (selectedUserNo == null || selectedUserNo.isEmpty()) {
                        JSObject kahadRes = new JSObject();
                        kahadRes.put("ok", false);
                        kahadRes.put("code", "needs-kahad-selection");
                        JSONArray cleanAccs = new JSONArray();
                        for (int i = 0; i < accounts.length(); i++) {
                            JSONObject a = accounts.getJSONObject(i);
                            JSONObject item = new JSONObject();
                            java.util.Iterator<String> it = a.keys();
                            while (it.hasNext()) {
                                String k = it.next();
                                item.put(k, a.opt(k));
                            }
                            if (!item.has("DegreeName") || item.optString("DegreeName").isEmpty()) {
                                String d = a.optString("UserLabel", "");
                                if (d.isEmpty()) d = a.optString("DegreeDes", "");
                                if (d.isEmpty()) d = a.optString("DegreeName", "");
                                if (d.isEmpty()) d = a.optString("FieldDes", "");
                                if (d.isEmpty()) d = "دانشجو: " + a.optString("UserNo");
                                item.put("DegreeName", d);
                            }
                            cleanAccs.put(item);
                        }
                        kahadRes.put("accounts", cleanAccs);
                        kahadRes.put("accountsRaw", cleanAccs.toString());
                        call.reject("اکانت دارای چند پرونده تحصیلی است (طرح کهاد)", "needs-kahad-selection", kahadRes);
                        return;
                    }
                }

                if (sid == null || ticket == null || ticket.isEmpty() || "null".equals(ticket)) {
                    String err = "نشست کاری از سامانه گلستان تهران دریافت نشد";
                    if (oauthJson.has("msg") && !oauthJson.isNull("msg")) {
                        JSONObject msg = oauthJson.getJSONObject("msg");
                        if (msg.has("errors") && !msg.isNull("errors")) {
                            JSONArray errArr = msg.getJSONArray("errors");
                            if (errArr.length() > 0) {
                                err = errArr.optString(0, err);
                            }
                        }
                    }
                    call.reject(err);
                    return;
                }

                // ورود موفقیت‌آمیز — پاکسازی کوکی‌های موقت
                synchronized (sSavedUtSsoCookies) {
                    sSavedUtSsoCookies.clear();
                }

                // فعال‌سازی نشست (sys.svc nav 11130)
                String studentId = selectedUserNo != null && !selectedUserNo.isEmpty() ? selectedUserNo : username;
                String userId = username;

                try {
                    JSONObject navReq = new JSONObject();
                    JSONObject navR = new JSONObject();
                    navR.put("fid", "11130");
                    navR.put("ft", "0");
                    navR.put("subfrm", "");
                    navReq.put("r", navR);
                    navReq.put("act", "nav");
                    JSONObject navRp = new JSONObject();
                    navRp.put("loc", "fa");
                    navRp.put("ut", "0");
                    navRp.put("b", "0");
                    navRp.put("sid", sid);
                    navRp.put("sp", "{\"BrnNo\":\"0\",\"BrnLimit\":\"0\",\"UsrType\":\"0\",\"TrmType\":\"2\"}");
                    navReq.put("rp", navRp);
                    if (ticket != null) {
                        navReq.put("t", ticket);
                    }

                    HttpResult navRes = executeHttp("https://ems2.ut.ac.ir/frm/sys/sys.svc/", "POST", navReq.toString(), "application/json", "https://ems2.ut.ac.ir/browser/fa/", cookies);
                    if (navRes.body != null && !navRes.body.isEmpty()) {
                        JSONObject navData = new JSONObject(navRes.body);
                        if (navData.has("t") && !navData.isNull("t")) ticket = navData.getString("t");
                        if (navData.has("outpar") && !navData.isNull("outpar")) {
                            JSONObject outpar = navData.getJSONObject("outpar");
                            if (outpar.has("std")) studentId = outpar.getString("std");
                            if (outpar.has("u")) userId = outpar.getString("u");
                        }
                    }
                } catch (Exception ignore) {}

                StringBuilder cookieSb = new StringBuilder();
                for (Map.Entry<String, String> e : cookies.entrySet()) {
                    if (cookieSb.length() > 0) cookieSb.append("; ");
                    cookieSb.append(e.getKey()).append("=").append(e.getValue());
                }

                JSObject res = new JSObject();
                res.put("ok", true);
                res.put("sid", sid);
                res.put("ticket", ticket);
                res.put("cookies", cookieSb.toString());
                res.put("studentId", studentId);
                res.put("userId", userId);
                res.put("university", "ut");
                res.put("source", "native_java");
                call.resolve(res);
            } catch (Exception ex) {
                Log.e(TAG, "UT login error", ex);
                call.reject("خطای ورود دانشگاه تهران: " + ex.getMessage());
            }
        }).start();
    }

    private void loginAut(PluginCall call, String username, String password) {
        new Thread(() -> {
            try {
                Map<String, String> cookies = new LinkedHashMap<>();
                String entryUrl = "https://accounts.aut.ac.ir/cas/login?service=https%3A%2F%2Fportal.aut.ac.ir%2Findex.html%3Fsso%3D101";
                HttpResult page1 = executeHttp(entryUrl, "GET", null, null, null, cookies);

                Pattern execPat = Pattern.compile("name=[\"']execution[\"']\\s+value=[\"']([^\"']+)[\"']", Pattern.CASE_INSENSITIVE);
                Matcher execMat = execPat.matcher(page1.body != null ? page1.body : "");
                String execution = "";
                if (execMat.find()) {
                    execution = execMat.group(1);
                } else {
                    Pattern execPat2 = Pattern.compile("value=[\"']([^\"']+)[\"']\\s+name=[\"']execution[\"']", Pattern.CASE_INSENSITIVE);
                    Matcher execMat2 = execPat2.matcher(page1.body != null ? page1.body : "");
                    if (execMat2.find()) {
                        execution = execMat2.group(1);
                    }
                }

                StringBuilder formBody = new StringBuilder();
                formBody.append("username=").append(URLEncoder.encode(username, "UTF-8"));
                formBody.append("&password=").append(URLEncoder.encode(password, "UTF-8"));
                formBody.append("&execution=").append(URLEncoder.encode(execution, "UTF-8"));
                formBody.append("&_eventId=").append(URLEncoder.encode("submit", "UTF-8"));
                formBody.append("&geolocation=");

                HttpResult loginRes = executeHttp("https://accounts.aut.ac.ir/cas/login", "POST", formBody.toString(), "application/x-www-form-urlencoded", entryUrl, cookies);

                String ticket = null;
                if (loginRes.location != null) {
                    Matcher tm = Pattern.compile("[?&]ticket=([^&]+)").matcher(loginRes.location);
                    if (tm.find()) ticket = URLDecoder.decode(tm.group(1), "UTF-8");
                }
                if (ticket == null && loginRes.body != null) {
                    Matcher tm = Pattern.compile("[?&]ticket=([^&\"'\\s]+)").matcher(loginRes.body);
                    if (tm.find()) ticket = URLDecoder.decode(tm.group(1), "UTF-8");
                }

                if (ticket == null) {
                    Pattern alertPat = Pattern.compile("class=[\"'][^\"']*alert[^\"']*[\"'][^>]*>([\\s\\S]*?)</div>", Pattern.CASE_INSENSITIVE);
                    Matcher am = alertPat.matcher(loginRes.body != null ? loginRes.body : "");
                    String errMsg = "نام کاربری یا رمز عبور اشتباه است.";
                    if (am.find()) {
                        errMsg = am.group(1).replaceAll("<[^>]+>", "").trim();
                    }
                    JSObject ret = new JSObject();
                    ret.put("ok", false);
                    ret.put("error", errMsg);
                    ret.put("code", "bad-credentials");
                    call.resolve(ret);
                    return;
                }

                // Step 4: گرم کردن نشست وب بهستان (loginapi act 00)
                try {
                    executeHttp("https://portal.aut.ac.ir/frm/loginapi/loginapi.svc/", "POST", "{\"r\":{},\"rp\":{},\"act\":\"00\"}", "application/json", "https://portal.aut.ac.ir/browser/fa/", cookies);
                } catch (Exception ignore) {}

                // Step 5: تبادل بلیط در سامانه بهستان امیرکبیر
                String verifyUrl = "https://portal.aut.ac.ir/frmc/Authentication/CAS/";
                String verifyBody = "{\"act\":\"09\",\"r\":{\"code\":\"\",\"ticket\":\"" + ticket + "\",\"l\":\"\",\"p\":\"\",\"d\":\"0\",\"c\":\"\",\"rsc\":\"101\"},\"rp\":{}}";
                HttpResult verifyRes = executeHttp(verifyUrl, "POST", verifyBody, "application/json", "https://portal.aut.ac.ir/browser/fa/?sso=101&ticket=" + URLEncoder.encode(ticket, "UTF-8"), cookies);

                JSONObject verifyJson = new JSONObject(verifyRes.body);
                String sid = verifyJson.optJSONObject("oaut") != null && verifyJson.getJSONObject("oaut").optJSONObject("rp") != null
                    ? verifyJson.getJSONObject("oaut").getJSONObject("rp").optString("sid", "")
                    : "";
                String behestanTicket = verifyJson.optString("t", "");

                if (sid.isEmpty() || behestanTicket.isEmpty()) {
                    JSObject ret = new JSObject();
                    ret.put("ok", false);
                    ret.put("error", "نشست از سامانه بهستان امیرکبیر دریافت نشد");
                    call.resolve(ret);
                    return;
                }

                // Step 6: فعال‌سازی نشست کاری + دریافت شماره دانشجویی
                String currentTicket = behestanTicket;
                String resolvedStudentId = username;
                String resolvedUserId = null;
                try {
                    String navBody = "{\"r\":{\"fid\":\"11130\",\"ft\":\"0\",\"subfrm\":\"\"},\"act\":\"nav\",\"rp\":{\"sp\":\"{\\\"BrnNo\\\":\\\"0\\\",\\\"BrnLimit\\\":\\\"0\\\",\\\"UsrType\\\":\\\"0\\\",\\\"TrmType\\\":\\\"2\\\"}\",\"loc\":\"fa\",\"ut\":\"0\",\"b\":\"0\",\"sid\":\"" + sid + "\"},\"t\":" + JSONObject.quote(currentTicket) + "}";
                    HttpResult navRes = executeHttp("https://portal.aut.ac.ir/frm/sys/sys.svc/", "POST", navBody, "application/json", "https://portal.aut.ac.ir/browser/fa/", cookies);
                    JSONObject navJson = new JSONObject(navRes.body);
                    if (navJson.has("t")) currentTicket = navJson.getString("t");
                    JSONObject outpar = navJson.optJSONObject("outpar");
                    if (outpar != null) {
                        if (outpar.has("std") && !outpar.isNull("std")) resolvedStudentId = outpar.getString("std");
                        if (outpar.has("u") && !outpar.isNull("u")) resolvedUserId = outpar.getString("u");
                    }
                } catch (Exception ignore) {}

                StringBuilder cookieHeader = new StringBuilder();
                for (Map.Entry<String, String> entry : cookies.entrySet()) {
                    if (entry.getKey().toLowerCase().contains("sso")) continue;
                    if (cookieHeader.length() > 0) cookieHeader.append("; ");
                    cookieHeader.append(entry.getKey()).append("=").append(entry.getValue());
                }
                if (!cookieHeader.toString().contains("ASP.NET_SessionId=")) {
                    if (cookieHeader.length() > 0) cookieHeader.append("; ");
                    cookieHeader.append("ASP.NET_SessionId=").append(sid);
                }

                JSObject ret = new JSObject();
                ret.put("ok", true);
                ret.put("sid", sid);
                ret.put("ticket", currentTicket);
                ret.put("studentId", resolvedStudentId);
                if (resolvedUserId != null) ret.put("userId", resolvedUserId);
                ret.put("university", "aut");
                ret.put("cookies", cookieHeader.toString());
                ret.put("source", "native_java");
                call.resolve(ret);
            } catch (Exception ex) {
                Log.e(TAG, "AUT login error", ex);
                call.reject("خطا در احراز هویت دانشگاه صنعتی امیرکبیر: " + ex.getMessage());
            }
        }).start();
    }
}
