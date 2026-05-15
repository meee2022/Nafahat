import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme, TypographyVariant } from '@theme/index';

interface Props extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
}

export const Text: React.FC<Props> = ({
  variant = 'body',
  color,
  weight,
  align = 'right',
  style,
  ...rest
}) => {
  const t = useTheme();
  const v = t.typography[variant];
  return (
    <RNText
      allowFontScaling
      {...rest}
      style={[
        {
          ...v,
          fontSize: (v.fontSize ?? 14) * t.fontScale,
          lineHeight: (v.lineHeight ?? 20) * t.fontScale,
          color: color ?? t.colors.textPrimary,
          textAlign: align,
          writingDirection: 'rtl' as const,
        },
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
};
