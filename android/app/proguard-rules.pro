# Proguard rules for Photobooth Kiosk
-keepclassmembers class * extends android.webkit.WebChromeClient {
   public void openFileChooser(...);
}
-keepattributes JavascriptInterface
