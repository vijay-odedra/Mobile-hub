package com.stockly.app;

import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.addJavascriptInterface(new AndroidNativeInterface(), "AndroidNative");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public class AndroidNativeInterface {
        @JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                try {
                    WebView webView = getBridge() != null ? getBridge().getWebView() : null;
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    if (printManager != null && webView != null) {
                        PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter("Stockly_Invoice");
                        printManager.print("Stockly Invoice", printAdapter, new PrintAttributes.Builder().build());
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @JavascriptInterface
        public void exitApp() {
            runOnUiThread(() -> finish());
        }
    }

    @Override
    public void onBackPressed() {
        try {
            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null) {
                webView.evaluateJavascript(
                    "(function() { try { return (window.handleAndroidBackGesture && window.handleAndroidBackGesture()) || 'unhandled'; } catch(e) { return 'unhandled'; } })();",
                    value -> {
                        if ("\"handled\"".equals(value)) {
                            // Back gesture was handled by JavaScript (closed modal or navigated back)
                            return;
                        } else if ("\"exit\"".equals(value)) {
                            finish();
                        } else {
                            // Default back navigation
                            MainActivity.super.onBackPressed();
                        }
                    }
                );
                return;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        super.onBackPressed();
    }
}
