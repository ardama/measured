import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function TabBarIcon({ style, ...rest }: IconProps<ComponentProps<typeof MaterialCommunityIcons>['name']>) {
  return <MaterialCommunityIcons size={32} style={[{ marginTop: -4 }, style]} {...rest} />;
}
