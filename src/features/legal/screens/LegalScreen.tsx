import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/app/providers/ThemeProvider';
import { PRIVACY_TR, PRIVACY_EN } from '@/features/legal/content/privacy';
import { TERMS_TR, TERMS_EN } from '@/features/legal/content/terms';
import type { RootStackParamList } from '@/app/navigation/types';

type LegalRoute = RouteProp<RootStackParamList, 'Legal'>;

/**
 * Hem Gizlilik Politikası hem de Kullanım Koşulları bu ekranda gösterilir.
 * `kind` route paramı ile içerik seçilir, dil i18n.language'a göre belirlenir.
 *
 * Markdown'ı tam parse etmiyoruz; başlıklar (#, ##, ###) ve liste (- ) için
 * basit bir line renderer yetiyor. Linkleri text olarak bırakıyoruz.
 */
export function LegalScreen() {
  const route = useRoute<LegalRoute>();
  const { i18n } = useTranslation();
  const theme = useTheme();
  const kind = route.params.kind;
  const isTr = i18n.language === 'tr';

  const content = useMemo(() => {
    if (kind === 'privacy') return isTr ? PRIVACY_TR : PRIVACY_EN;
    return isTr ? TERMS_TR : TERMS_EN;
  }, [kind, isTr]);

  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <Screen scroll padded withBottomInset>
      <View style={styles.body}>
        {blocks.map((b, idx) => {
          if (b.kind === 'h1') {
            return (
              <Text key={idx} variant="title" style={styles.h1}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === 'h2') {
            return (
              <Text key={idx} variant="heading" weight="bold" style={styles.h2}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === 'h3') {
            return (
              <Text key={idx} variant="label" weight="semibold" style={styles.h3}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === 'bullet') {
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: theme.colors.primary }]}>•</Text>
                <Text style={styles.bulletText}>{b.text}</Text>
              </View>
            );
          }
          // paragraph
          return (
            <Text key={idx} style={styles.paragraph}>
              {b.text}
            </Text>
          );
        })}
      </View>
    </Screen>
  );
}

type Block =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'paragraph'; text: string };

function parseMarkdown(src: string): Block[] {
  const out: Block[] = [];
  const lines = src.split('\n');
  let para: string[] = [];
  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(' ').trim();
    if (text) out.push({ kind: 'paragraph', text });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line === '') {
      flushPara();
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      out.push({ kind: 'h1', text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      out.push({ kind: 'h2', text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      out.push({ kind: 'h3', text: line.slice(4).trim() });
      continue;
    }
    if (line.startsWith('- ')) {
      flushPara();
      out.push({ kind: 'bullet', text: line.slice(2).trim() });
      continue;
    }
    para.push(line);
  }
  flushPara();
  return out;
}

const styles = StyleSheet.create({
  body: {
    gap: 8,
  },
  h1: {
    marginTop: 8,
    marginBottom: 4,
  },
  h2: {
    marginTop: 18,
    marginBottom: 4,
  },
  h3: {
    marginTop: 10,
    marginBottom: 2,
  },
  paragraph: {
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    fontWeight: 'bold',
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});
