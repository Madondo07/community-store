import React, { useMemo, useState } from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';

import { useAppTheme } from '@/context/ThemeContext';

interface ListingImageProps {
  /** First image URL for a listing — pass `listing.images[0]`, may be undefined for a listing with no photos. */
  uri: string | null | undefined;
  /** Accepts the same width/height/aspectRatio/borderRadius shape as an Image or View style — passed through to whichever one actually renders. */
  style: StyleProp<ViewStyle>;
  iconSize?: number;
}

/**
 * `<Image>` with a real fallback instead of silently rendering blank —
 * covers both a listing with no `images` at all and a stored URL that 404s
 * (expired upload, broken link). Without this, a bad URI just renders
 * nothing, which is indistinguishable from a layout bug.
 */
export default function ListingImage({ uri, style, iconSize = 28 }: ListingImageProps) {
  const [failed, setFailed] = useState(false);
  const { colors } = useAppTheme();
  const placeholderStyle = useMemo(() => ({ backgroundColor: colors.surfaceAlt }), [colors]);

  if (!uri || failed) {
    return (
      <View style={[styles.placeholder, placeholderStyle, style]}>
        <ImageOff size={iconSize} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style as StyleProp<ImageStyle>}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
