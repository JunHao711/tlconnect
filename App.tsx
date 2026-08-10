import React, {useRef, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  BackHandler,
  Linking,
  StatusBar,
  ActivityIndicator,
  View,
} from 'react-native';
import WebView from 'react-native-webview';

const JOOMLA_URL = 'https://mall.tolong.com.my/';

const App = () => {
  const webViewRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);

  // Android返回键 — 在WebView里goBack而不是退出app
  React.useEffect(() => {
    const handleBackButton = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButton);
    return () => subscription.remove();
  }, []);

  // 拦截window.open — 用外部浏览器打开（SSO redirect用）
  const injectedJavaScript = `
    (function() {
      var originalOpen = window.open;
      window.open = function(url) {
        if (url) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_EXTERNAL',
            url: url
          }));
        }
      };
    })();
    true;
  `;

  // 处理WebView发来的消息
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'OPEN_EXTERNAL' && data.url) {
        Linking.openURL(data.url);
      }
    } catch (e) {
      console.log('Message parse error:', e);
    }
  };

  // 监听navigation — 处理支付redirect等
  const handleNavigationStateChange = (navState: any) => {
    setLoading(navState.loading);
    console.log('Navigating to:', navState.url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView
        ref={webViewRef}
        source={{uri: JOOMLA_URL}}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsBackForwardNavigationGestures={true}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        // 允许混合内容（http + https）
        mixedContentMode="compatibility"
        // User agent — 让网站知道是app
        // userAgent="TLConnectApp/1.0 (ReactNative)"

        onLoad={() => console.log('WebView loaded successfully')}
          onError={(syntheticEvent) => {
            const {nativeEvent} = syntheticEvent;
            console.log('WebView error:', nativeEvent);
          }}
          onHttpError={(syntheticEvent) => {
            const {nativeEvent} = syntheticEvent;
            console.log('WebView HTTP error:', nativeEvent.statusCode);
          }}
      />
      {/* Spinner overlay — shows when loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1a73e8" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
export default App;