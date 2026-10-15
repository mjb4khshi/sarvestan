package ir.mjbakhshi.sarvestan;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ورود بهستان با WebView واقعی
 * بعد از redirect به behestan?code= ، oauth2 را از داخل WebView (همان دامنه) می‌زنیم
 * و sid/t را برمی‌گردانیم — بدون اینکه کاربر در بهستان گیر کند.
 */
@CapacitorPlugin(name = "SsoWebView")
public class SsoWebViewPlugin extends Plugin {

    private static final String SSO_AUTH =
        "https://sso.kntu.ac.ir/realms/kntu/protocol/openid-connect/auth" +
            "?client_id=behestan.kntu.ac.ir" +
            "&redirect_uri=https%3A%2F%2Fbehestan.kntu.ac.ir%2Findex.html" +
            "&response_type=code&scope=openid+profile";

    private WebView webView;
    private PluginCall pendingCall;
    private boolean resolved = false;
    private View overlayRoot;
    private String capturedCode;
    private String inputUsername = "";
    private String inputPassword = "";
    private String currentUniId = "kntu";

    @PluginMethod
    public void login(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("activity null");
            return;
        }
        pendingCall = call;
        resolved = false;
        capturedCode = null;
        inputUsername = call.getString("username", "");
        inputPassword = call.getString("password", "");
        currentUniId = call.getString("uniId", "kntu");
        boolean isUt = "ut".equalsIgnoreCase(currentUniId);
        boolean isAut = "aut".equalsIgnoreCase(currentUniId);
        String ssoUrl;
        if (isUt) {
            String state = "st" + System.currentTimeMillis();
            ssoUrl = "https://sso1.ut.ac.ir/ApiContainer.SSO.RCL1/connect/authorize" +
                "?client_id=golestanSSO-xRwHTGSHGtjmLJbqr2k9GDSOoai-TCc.apigateway.ut.ac.ir" +
                "&redirect_uri=https%3A%2F%2Fems2.ut.ac.ir%2Findex.html" +
                "&response_type=code&scope=openid&state=" + state;
        } else if (isAut) {
            ssoUrl = "https://accounts.aut.ac.ir/cas/login?service=https%3A%2F%2Fportal.aut.ac.ir%2Findex.html%3Fsso%3D101";
        } else {
            ssoUrl = SSO_AUTH;
        }

        activity.runOnUiThread(() -> {
            try {
                // نشست WebView کهنه نباید فرم/ریدایرکت تلاش را خراب کند
                try {
                    CookieManager cm = CookieManager.getInstance();
                    cm.setAcceptCookie(true);
                    cm.removeAllCookies(null);
                    cm.flush();
                } catch (Exception ignore) {}

                activity.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));

                LinearLayout column = new LinearLayout(activity);
                column.setOrientation(LinearLayout.VERTICAL);
                column.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));
                column.setBackgroundColor(Color.parseColor("#0A0A0C"));
                overlayRoot = column;

                // نوار بالا: عنوان + لغو
                LinearLayout top = new LinearLayout(activity);
                top.setOrientation(LinearLayout.HORIZONTAL);
                top.setGravity(Gravity.CENTER_VERTICAL);
                top.setPadding(32, 48, 32, 16);
                top.setLayoutParams(new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ));

                TextView title = new TextView(activity);
                title.setText(isUt ? "ورود به سامانه دانشگاه تهران…" : "ورود به بهستان…");
                title.setTextColor(Color.WHITE);
                title.setTextSize(16f);
                title.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
                top.addView(title);

                Button cancel = new Button(activity);
                cancel.setText("انصراف");
                cancel.setTextColor(Color.parseColor("#93c5fd"));
                cancel.setBackgroundColor(Color.TRANSPARENT);
                cancel.setOnClickListener(v -> finishError("انصراف کاربر"));
                top.addView(cancel);

                column.addView(top);

                ProgressBar bar = new ProgressBar(activity);
                LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
                blp.gravity = Gravity.CENTER_HORIZONTAL;
                blp.bottomMargin = 8;
                bar.setLayoutParams(blp);
                column.addView(bar);

                webView = new WebView(activity);
                LinearLayout.LayoutParams wlp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1f
                );
                webView.setLayoutParams(wlp);
                column.addView(webView);

                WebSettings ws = webView.getSettings();
                ws.setJavaScriptEnabled(true);
                ws.setDomStorageEnabled(true);
                ws.setDatabaseEnabled(true);
                ws.setUseWideViewPort(true);
                ws.setLoadWithOverviewMode(true);
                ws.setUserAgentString(
                    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                );

                CookieManager cm = CookieManager.getInstance();
                cm.setAcceptCookie(true);
                cm.setAcceptThirdPartyCookies(webView, true);

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        String url = request.getUrl() != null ? request.getUrl().toString() : "";
                        return handleNav(view, url);
                    }

                    @Override
                    @SuppressWarnings("deprecation")
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        return handleNav(view, url);
                    }

                    @Override
                    public void onReceivedSslError(WebView view, android.webkit.SslErrorHandler handler, android.net.http.SslError error) {
                        super.onReceivedSslError(view, handler, error);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        bar.setVisibility(View.GONE);
                        if (url != null && (url.contains("sso.kntu.ac.ir") || url.contains("sso1.ut.ac.ir")) && !inputUsername.isEmpty()) {
                            // فقط پر کردن فیلدها — submit خودکار حذف شد (الگوی phishing برای Play Protect)
                            String autoFillJs =
                                "(function(){" +
                                "  try {" +
                                "    var u = document.querySelector('input[name=\"username\" i], #username, #Username, input[name=\"Username\"]');" +
                                "    var p = document.querySelector('input[name=\"password\" i], #password, #Password, input[name=\"Password\"]');" +
                                "    if (u && " + jsonStr(inputUsername) + ") {" +
                                "      u.value = " + jsonStr(inputUsername) + ";" +
                                "      u.dispatchEvent(new Event('input', { bubbles: true }));" +
                                "      u.dispatchEvent(new Event('change', { bubbles: true }));" +
                                "    }" +
                                "    if (p && " + jsonStr(inputPassword) + ") {" +
                                "      p.value = " + jsonStr(inputPassword) + ";" +
                                "      p.dispatchEvent(new Event('input', { bubbles: true }));" +
                                "      p.dispatchEvent(new Event('change', { bubbles: true }));" +
                                "    }" +
                                "    return 'filled';" +
                                "  } catch(e) { return 'fail'; }" +
                                "})()";
                            view.evaluateJavascript(autoFillJs, null);
                        }
                        onUrlSettled(view, url);
                    }
                });

                FrameLayout.LayoutParams rootLp = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                );
                getActivity().addContentView(column, rootLp);
                webView.loadUrl(ssoUrl);
            } catch (Exception e) {
                finishError("WebView: " + e.getMessage());
            }
        });
    }

    /** اگر به behestan?code= یا ems2?code= رسیدیم، بگذار لود شود و بعد oauth2 بزنیم */
    private boolean handleNav(WebView view, String url) {
        if (url == null) return false;
        // همه لینک‌ها در همین WebView
        return false;
    }

    private void onUrlSettled(WebView view, String url) {
        if (resolved || view == null || url == null) return;

        if (url.contains("behestan.kntu.ac.ir") || url.contains("ems2.ut.ac.ir") || url.contains("portal.aut.ac.ir")) {
            // کد یا تیکت را از URL بگیر
            try {
                int i = url.indexOf("code=");
                if (i > 0) {
                    String rest = url.substring(i + 5);
                    int amp = rest.indexOf('&');
                    if (amp >= 0) rest = rest.substring(0, amp);
                    capturedCode = java.net.URLDecoder.decode(rest, "UTF-8");
                }
            } catch (Exception ignore) {}

            // از داخل دامنهٔ گلستان: احراز هویت را بزن و در localStorage بگذار
            runBehestanOauth(view, capturedCode, 0);
        }
    }

    /**
     * fetch oauth2 / CAS از خود WebView (same-origin بهستان)
     * و ذخیره sid/t در localStorage — سپس خواندن و resolve
     */
    private void runBehestanOauth(WebView view, String code, int attempt) {
        if (resolved || view == null) return;
        if (attempt > 12) {
            // شاید Angular خودش زده — فقط localStorage را بخوان
            readLocalStorage(view, 0);
            return;
        }

        String js =
            "javascript:(function(){" +
                "try{" +
                "  var sid=localStorage.getItem('sid')||localStorage.getItem('SID');" +
                "  var t=localStorage.getItem('t');" +
                "  if(sid&&t&&t.length>8){" +
                "    window.__Ssv=JSON.stringify({ok:true,sid:sid,ticket:t,from:'ls'});" +
                "    return;" +
                "  }" +
                "  var isUt = location.hostname.indexOf('ut.ac.ir') >= 0;" +
                "  var isAut = location.hostname.indexOf('aut.ac.ir') >= 0;" +
                "  var verifyEndpoint = isAut ? '/frmc/Authentication/CAS/' : '/frmc/Authentication/oauth2/';" +
                "  var rscVal = isAut ? '101' : (isUt ? '120' : '112');" +
                "  var ticketParam = '';" +
                "  var codeParam = " + jsonStr(code) + ";" +
                "  if (isAut) {" +
                "    var tm = location.href.match(/[?&]ticket=([^&]+)/);" +
                "    ticketParam = tm ? decodeURIComponent(tm[1]) : '';" +
                "    if (!ticketParam) {" +
                "      window.__Ssv=JSON.stringify({ok:false,wait:true});" +
                "      return;" +
                "    }" +
                "  } else {" +
                "    if (!codeParam) {" +
                "      var m = location.href.match(/[?&]code=([^&]+)/);" +
                "      codeParam = m ? decodeURIComponent(m[1]) : null;" +
                "    }" +
                "    if (!codeParam) {" +
                "      window.__Ssv=JSON.stringify({ok:false,wait:true});" +
                "      return;" +
                "    }" +
                "  }" +
                "  if (" + attempt + " < 3) {" +
                "    window.__Ssv=JSON.stringify({ok:false,wait:true});" +
                "    return;" +
                "  }" +
                "  if(window.__SsvBusy) return;" +
                "  window.__SsvBusy=1;" +
                "  fetch(verifyEndpoint, {" +
                "    method:'POST'," +
                "    headers:{'Content-Type':'application/json','Accept':'application/json'}," +
                "    body:JSON.stringify({act:'09',r:{code:isAut ? '' : codeParam,ticket:ticketParam,l:'',p:'',d:'0',c:'',rsc:rscVal},rp:{}})" +
                "  }).then(function(r){return r.text();}).then(function(txt){" +
                "    window.__SsvBusy=0;" +
                "    try{" +
                "      var d=JSON.parse(txt);" +
                "      var sid=d&&d.oaut&&d.oaut.rp&&d.oaut.rp.sid;" +
                "      var tk=d&&d.t;" +
                "      if(sid&&tk){" +
                "        try{localStorage.setItem('sid',sid);localStorage.setItem('t',tk);}catch(e){}" +
                "        window.__Ssv=JSON.stringify({ok:true,sid:sid,ticket:tk,from:'verify'});" +
                "      }else{" +
                "        var er=d&&d.msg&&d.msg.errors&&d.msg.errors[0];" +
                "        window.__Ssv=JSON.stringify({ok:false,err:er||'no-sid',body:txt.slice(0,120)});" +
                "      }" +
                "    }catch(e){window.__Ssv=JSON.stringify({ok:false,err:String(e)});}" +
                "  }).catch(function(e){window.__SsvBusy=0;window.__Ssv=JSON.stringify({ok:false,err:String(e)});});" +
                "}catch(e){window.__Ssv=JSON.stringify({ok:false,err:String(e)});}" +
                "})()";

        view.evaluateJavascript(js.replaceFirst("^javascript:", ""), value -> {
            if (resolved) return;
            String raw = unquote(value);
            if (raw != null && raw.contains("\"ok\":true")) {
                try {
                    JSObject obj = new JSObject(raw);
                    if (obj != null) {
                        String sid = obj.getString("sid");
                        String ticket = obj.getString("ticket");
                        if (sid != null && ticket != null) {
                            finishOk(sid, ticket, "");
                            return;
                        }
                    }
                } catch (Exception ignore) {}
            }
            if (raw != null && raw.contains("\"ok\":false") && !raw.contains("wait")) {
                // یک بار دیگر بعد از تأخیر (ممکن است کد هنوز آماده نباشد)
            }
            // هر حالتی: دوباره بخوان / دوباره تلاش
            if (!resolved) {
                view.postDelayed(() -> {
                    if (!resolved) runBehestanOauth(webView, code, attempt + 1);
                }, 1200);
            }
        });
    }

    private void readLocalStorage(WebView view, int attempt) {
        if (resolved || view == null || attempt > 15) {
            if (!resolved) finishError("نشست ساخته نشد — دوباره وارد شو");
            return;
        }
        String js =
            "var sid=localStorage.getItem('sid')||localStorage.getItem('SID');" +
            "var t=localStorage.getItem('t');" +
            "JSON.stringify({sid:sid,ticket:t});";
        view.evaluateJavascript(js, value -> {
            if (resolved) return;
            String raw = unquote(value);
            try {
                JSObject obj = new JSObject(raw);
                String sid = obj != null ? obj.getString("sid") : null;
                String ticket = obj != null ? obj.getString("ticket") : null;
                if (sid != null && ticket != null && ticket.length() > 8) {
                    finishOk(sid, ticket, "");
                    return;
                }
            } catch (Exception ignore) {}
            if (!resolved) {
                view.postDelayed(() -> readLocalStorage(webView, attempt + 1), 1000);
            }
        });
    }

    private static String jsonStr(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static String unquote(String v) {
        if (v == null) return null;
        String raw = v.trim();
        if (raw.length() > 1 && raw.startsWith("\"") && raw.endsWith("\"")) {
            raw = raw.substring(1, raw.length() - 1);
            raw = raw.replace("\\\"", "\"").replace("\\\\", "\\").replace("\\n", "\n");
        }
        return raw;
    }

    private void finishOk(String sid, String ticket, String studentId) {
        if (resolved) return;
        resolved = true;
        PluginCall call = pendingCall;
        pendingCall = null;
        closeUi();
        if (call != null) {
            JSObject ret = new JSObject();
            ret.put("ok", true);
            ret.put("sid", sid);
            ret.put("ticket", ticket);
            ret.put("studentId", studentId == null ? "" : studentId);
            boolean isUt = "ut".equalsIgnoreCase(currentUniId);
            String cookieDomain = isUt ? "https://ems2.ut.ac.ir" : "https://behestan.kntu.ac.ir";
            try {
                String behCookies = CookieManager.getInstance().getCookie(cookieDomain);
                ret.put("cookies", behCookies != null ? behCookies : "");
            } catch (Exception ignore) {
                ret.put("cookies", "");
            }
            if (isUt) {
                ret.put("university", "ut");
            }
            call.resolve(ret);
        }
    }

    private void finishError(String msg) {
        if (resolved) return;
        resolved = true;
        PluginCall call = pendingCall;
        pendingCall = null;
        closeUi();
        if (call != null) {
            String m = msg == null ? "خطای ورود" : msg;
            String code = m.contains("انصراف") ? "cancelled" : "webview-error";
            call.reject(m, code);
        }
    }

    /** پاک کردن کوکی‌های WebView — برای تلاش تازهٔ ورود */
    @PluginMethod
    public void clearCookies(PluginCall call) {
        try {
            CookieManager cm = CookieManager.getInstance();
            cm.removeAllCookies(null);
            cm.flush();
            call.resolve();
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    private void closeUi() {
        Activity activity = getActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            try {
                if (webView != null) {
                    ViewGroup parent = (ViewGroup) webView.getParent();
                    if (parent != null) parent.removeAllViews();
                    webView.destroy();
                    webView = null;
                }
                if (overlayRoot != null) {
                    ViewGroup p = (ViewGroup) overlayRoot.getParent();
                    if (p != null) p.removeView(overlayRoot);
                    overlayRoot = null;
                }
            } catch (Exception ignore) {}
        });
    }
}
