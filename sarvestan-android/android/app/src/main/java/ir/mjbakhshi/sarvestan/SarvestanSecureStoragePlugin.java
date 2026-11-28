package ir.mjbakhshi.sarvestan;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * ذخیره‌سازی امن نام کاربری و رمز عبور با AndroidKeyStore (AES-256-GCM) بدون وابستگی خارجی
 */
@CapacitorPlugin(name = "SarvestanSecureStorage")
public class SarvestanSecureStoragePlugin extends Plugin {

    private static final String KEY_ALIAS = "sarvestan_creds_aes_v1";
    private static final String PREFS_NAME = "sarvestan_secure_prefs";
    private static final String KEY_BLOB = "creds_gcm_v1";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LEN = 12;
    private static final int GCM_TAG_BITS = 128;

    private static SecretKey getOrCreateKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
        ks.load(null);
        if (ks.containsAlias(KEY_ALIAS)) {
            KeyStore.Entry entry = ks.getEntry(KEY_ALIAS, null);
            if (entry instanceof KeyStore.SecretKeyEntry) {
                return ((KeyStore.SecretKeyEntry) entry).getSecretKey();
            }
        }
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build();
        kg.init(spec);
        return kg.generateKey();
    }

    @PluginMethod
    public void setCreds(PluginCall call) {
        String value = call.getString("value", "");
        Context ctx = getContext();
        if (ctx == null || value == null || value.isEmpty()) {
            call.resolve(new JSObject().put("ok", false));
            return;
        }
        try {
            SecretKey key = getOrCreateKey();
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = cipher.getIV();
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);

            String encoded = Base64.encodeToString(combined, Base64.NO_WRAP);
            SharedPreferences sp = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            sp.edit().putString(KEY_BLOB, encoded).apply();
            call.resolve(new JSObject().put("ok", true));
        } catch (Exception e) {
            call.resolve(new JSObject().put("ok", false).put("error", e.getMessage()));
        }
    }

    @PluginMethod
    public void getCreds(PluginCall call) {
        Context ctx = getContext();
        if (ctx == null) {
            call.resolve(new JSObject().put("value", (String) null));
            return;
        }
        try {
            SharedPreferences sp = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String encoded = sp.getString(KEY_BLOB, null);
            if (encoded == null || encoded.isEmpty()) {
                call.resolve(new JSObject().put("value", (String) null));
                return;
            }
            byte[] combined = Base64.decode(encoded, Base64.NO_WRAP);
            if (combined.length <= GCM_IV_LEN) {
                call.resolve(new JSObject().put("value", (String) null));
                return;
            }
            byte[] iv = new byte[GCM_IV_LEN];
            byte[] encrypted = new byte[combined.length - GCM_IV_LEN];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LEN);
            System.arraycopy(combined, GCM_IV_LEN, encrypted, 0, encrypted.length);

            SecretKey key = getOrCreateKey();
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] plain = cipher.doFinal(encrypted);
            call.resolve(new JSObject().put("value", new String(plain, StandardCharsets.UTF_8)));
        } catch (Exception e) {
            // اگر کلید پس از ریست تغییر کرده باشد، رکورد قدیمی را پاک کن
            try {
                ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_BLOB).apply();
            } catch (Exception ignore) {}
            call.resolve(new JSObject().put("value", (String) null));
        }
    }

    @PluginMethod
    public void clearCreds(PluginCall call) {
        Context ctx = getContext();
        if (ctx != null) {
            ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().remove(KEY_BLOB).apply();
        }
        call.resolve(new JSObject().put("ok", true));
    }
}
