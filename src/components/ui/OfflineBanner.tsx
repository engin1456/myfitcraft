import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';

/**
 * İnternet bağlantısı düştüğünde ekranın en üstünde görünen küçük amber banner.
 * Bağlantı geri gelince yumuşakça kaybolur.
 *
 * App.tsx içinde root seviyede render edilir; her ekranda otomatik çalışır.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    const handle = (s: NetInfoState) => {
      const connected = Boolean(s.isConnected) && s.isInternetReachable !== false;
      setOffline(!connected);
    };
    // İlk durum
    NetInfo.fetch().then(handle).catch(() => {});
    // Subscribe
    const unsub = NetInfo.addEventListener(handle);
    return () => unsub();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: offline ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: offline ? 0 : -30,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [offline, opacity, translateY]);

  if (!offline) {
    // Layout'u tutmasın; gerçekten render edilmesin
    return (
      <Animated.View pointerEvents="none" style={{ opacity }} />
    );
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 4,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.inner}>
        <Ionicons name="cloud-offline-outline" size={16} color="#0A0A0F" />
        <Text size="sm" weight="semibold" color="#0A0A0F" numberOfLines={1}>
          {t('common.offline')}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingBottom: 6,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
});
