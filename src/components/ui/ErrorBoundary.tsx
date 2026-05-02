import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from './Text';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global UI hata sınırı.
 *
 * Render esnasında throw eden bir component olursa app'in beyaz/siyah ekrana
 * dönmesini engeller; kullanıcıya kibar bir mesaj + "Yeniden dene" butonu sunar.
 *
 * Hata `logger.error` ile raporlanır → ileride Sentry init edilirse oradan akar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('[ErrorBoundary] caught', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Ionicons name="alert-circle-outline" size={56} color="#F59E0B" />
        <Text variant="title" align="center" style={styles.title}>
          Bir şeyler ters gitti
        </Text>
        <Text muted align="center" style={styles.desc}>
          Beklenmedik bir hata oluştu. Tekrar deneyebilir veya uygulamayı kapatıp açabilirsin.
        </Text>
        {__DEV__ && this.state.error.message ? (
          <Text size="xs" align="center" style={styles.devMsg}>
            {this.state.error.message}
          </Text>
        ) : null}
        <Pressable onPress={this.reset} style={styles.cta} accessibilityRole="button">
          <Text weight="semibold" color="#FFFFFF">
            Yeniden dene
          </Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
    backgroundColor: '#0A0A0F',
  },
  title: {
    color: '#F2F2F7',
  },
  desc: {
    maxWidth: 320,
  },
  devMsg: {
    color: '#FF9494',
    fontFamily: 'Courier',
    marginTop: 8,
  },
  cta: {
    marginTop: 16,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
