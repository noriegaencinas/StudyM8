import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

/** Íconos de la app: SF Symbols en iOS y Material Symbols en Android y web. */
const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  note: { ios: 'doc.text', android: 'description', web: 'description' },
  book: { ios: 'books.vertical', android: 'menu_book', web: 'menu_book' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  cards: { ios: 'rectangle.on.rectangle', android: 'style', web: 'style' },
  quiz: { ios: 'checklist', android: 'quiz', web: 'quiz' },
  chat: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  xCircle: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  send: { ios: 'arrow.up', android: 'send', web: 'send' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  chart: { ios: 'chart.bar', android: 'insights', web: 'insights' },
  trophy: { ios: 'trophy', android: 'emoji_events', web: 'emoji_events' },
  flip: { ios: 'arrow.triangle.2.circlepath', android: 'flip', web: 'flip' },
  school: { ios: 'graduationcap', android: 'school', web: 'school' },
} satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
};

export function Icon({ name, size = 20, color }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
