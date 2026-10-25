package com.photobooth.himatik;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "PhotoboothHimatikPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_URL = "http://192.168.1.100:3000/booth";
    private static final int PERMISSION_REQ_CODE = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorView;
    private TextView txtTargetUrl;
    private Button btnRetry;
    private Button btnChangeIp;
    private ImageButton btnOpenSettings;

    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Jaga agar layar tablet tidak pernah mati/tidur selama aplikasi dibuka
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        initViews();
        setupWebView();
        checkAndRequestPermissions();
        
        loadCurrentServer();
    }

    private void initViews() {
        webView = findViewById(R.id.kioskWebView);
        progressBar = findViewById(R.id.loadProgressBar);
        errorView = findViewById(R.id.errorView);
        txtTargetUrl = findViewById(R.id.txtTargetUrl);
        btnRetry = findViewById(R.id.btnRetry);
        btnChangeIp = findViewById(R.id.btnChangeIp);
        btnOpenSettings = findViewById(R.id.btnOpenSettings);

        btnRetry.setOnClickListener(v -> {
            errorView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.reload();
        });

        btnChangeIp.setOnClickListener(v -> showSettingsDialog());
        btnOpenSettings.setOnClickListener(v -> showSettingsDialog());

        // Long press di gear settings untuk refresh paksa
        btnOpenSettings.setOnLongClickListener(v -> {
            Toast.makeText(this, "Memuat ulang bilik Photobooth HIMATIK...", Toast.LENGTH_SHORT).show();
            webView.reload();
            return true;
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Custom User-Agent agar server mengenali sebagai aplikasi tablet Android Photobooth HIMATIK
        String customUA = settings.getUserAgentString() + " PhotoboothHIMATIK/1.0 (Android Tablet; RedmiPad)";
        settings.setUserAgentString(customUA);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(View.GONE);
                }
            }

            // Izinkan akses kamera dan mikrofon otomatis tanpa pop-up yang mengganggu
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    String[] resources = request.getResources();
                    request.grant(resources);
                });
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return super.onConsoleMessage(consoleMessage);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                errorView.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showErrorScreen(request.getUrl().toString());
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showErrorScreen(failingUrl);
            }

            @SuppressLint("WebViewClientOnReceivedSslError")
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Izinkan koneksi lokal HTTP / self-signed certificate
                handler.proceed();
            }
        });
    }

    private void showErrorScreen(String failingUrl) {
        runOnUiThread(() -> {
            webView.setVisibility(View.GONE);
            errorView.setVisibility(View.VISIBLE);
            txtTargetUrl.setText("Alamat: " + failingUrl);
        });
    }

    private void loadCurrentServer() {
        String serverUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        txtTargetUrl.setText("Alamat: " + serverUrl);
        webView.loadUrl(serverUrl);
    }

    private void showSettingsDialog() {
        LayoutInflater inflater = LayoutInflater.from(this);
        View dialogView = inflater.inflate(R.layout.dialog_settings, null);

        EditText editUrl = dialogView.findViewById(R.id.editServerUrl);
        Button btnCancel = dialogView.findViewById(R.id.btnCancelSettings);
        Button btnSave = dialogView.findViewById(R.id.btnSaveSettings);

        String currentUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_URL);
        editUrl.setText(currentUrl);
        editUrl.setSelection(currentUrl.length());

        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        btnCancel.setOnClickListener(v -> dialog.dismiss());

        btnSave.setOnClickListener(v -> {
            String newUrl = editUrl.getText().toString().trim();
            if (newUrl.isEmpty()) {
                Toast.makeText(MainActivity.this, "URL Server tidak boleh kosong!", Toast.LENGTH_SHORT).show();
                return;
            }

            if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
                newUrl = "http://" + newUrl;
            }

            prefs.edit().putString(KEY_SERVER_URL, newUrl).apply();
            dialog.dismiss();

            Toast.makeText(MainActivity.this, "Alamat tersimpan, menghubungkan...", Toast.LENGTH_SHORT).show();
            errorView.setVisibility(View.GONE);
            webView.setVisibility(View.VISIBLE);
            webView.loadUrl(newUrl);
        });

        dialog.show();
    }

    private void checkAndRequestPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO},
                    PERMISSION_REQ_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            webView.reload();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    // Mengunci tampilan tablet ke mode Immersive Fullscreen Sticky Kiosk
    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            Toast.makeText(this, "Photobooth HIMATIK Aktif. Gunakan tombol di layar.", Toast.LENGTH_SHORT).show();
        }
    }
}
