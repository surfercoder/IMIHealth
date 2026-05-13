import { useEffect } from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Text } from "@/src/components/ui";
import { useEffectEvent } from "@/src/hooks/useEffectEvent";
import { colors, spacing } from "@/src/theme";

const WELCOME_MESSAGE_COUNT = 10;
const VISIBLE_MS = 3000;
const FADE_OUT_MS = 350;

const botWelcome = require("@/assets/images/imi-bot-welcome.webp");

const randomMessageIndex = Math.floor(Math.random() * WELCOME_MESSAGE_COUNT);

interface WelcomeOverlayProps {
  userName?: string;
  onDone: () => void;
}

export function WelcomeOverlay({ userName, onDone }: WelcomeOverlayProps) {
  const { t } = useTranslation();
  const displayName = userName?.trim() || t("welcomeScreen.defaultName");
  const greeting = t("welcomeScreen.greeting", { name: displayName });
  const message = t(`welcomeScreen.messages.${randomMessageIndex}`);

  const overlayOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.94);
  const imageOpacity = useSharedValue(0);
  const textOffset = useSharedValue(16);
  const textOpacity = useSharedValue(0);
  const phraseOffset = useSharedValue(16);
  const phraseOpacity = useSharedValue(0);

  const handleDone = useEffectEvent(onDone);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    imageOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    imageScale.value = withDelay(
      100,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      }),
    );
    textOpacity.value = withDelay(
      350,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    textOffset.value = withDelay(
      350,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    phraseOpacity.value = withDelay(
      550,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
    phraseOffset.value = withDelay(
      550,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );

    const fadeOutTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, {
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
      });
    }, VISIBLE_MS - FADE_OUT_MS);

    const doneTimer = setTimeout(() => handleDone(), VISIBLE_MS);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageOpacity,
    imageScale,
    overlayOpacity,
    phraseOffset,
    phraseOpacity,
    textOffset,
    textOpacity,
  ]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textOffset.value }],
  }));
  const phraseStyle = useAnimatedStyle(() => ({
    opacity: phraseOpacity.value,
    transform: [{ translateY: phraseOffset.value }],
  }));

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle]}
      pointerEvents="auto"
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`${greeting}. ${message}`}
    >
      <Animated.View style={imageStyle}>
        <Image
          source={botWelcome}
          style={styles.image}
          contentFit="contain"
          accessibilityLabel={t("alt.botWelcome")}
        />
      </Animated.View>

      <View style={styles.textBlock}>
        <Animated.View style={textStyle}>
          <Text variant="display" center style={styles.greeting}>
            {greeting}
          </Text>
        </Animated.View>
        <Animated.View style={phraseStyle}>
          <Text variant="body" center color={colors.mutedForeground} style={styles.message}>
            {message}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing["3xl"],
    zIndex: 50,
  },
  image: {
    width: 240,
    height: 240,
  },
  textBlock: {
    alignItems: "center",
    gap: spacing.sm,
    maxWidth: 480,
  },
  greeting: {
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
});
