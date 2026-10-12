import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import {
  ClinicalTheme,
  TOUCH_TARGETS,
  SPACING,
  RADIUS,
  INTERACTION,
  ACCESSIBILITY,
} from '../theme/clinicalTheme';
import { SpeechPlaybackState } from '../services/speechService';

export interface SpeechButtonProps {
  status: SpeechPlaybackState;
  onListen: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  language?: 'en' | 'hi';
  compact?: boolean;
  style?: ViewStyle;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({
  status,
  onListen,
  onPause,
  onResume,
  onStop,
  language = 'en',
  compact = false,
  style,
}) => {
  const isHi = language === 'hi';

  if (status === 'loading') {
    return (
      <View
        style={[styles.loadingButton, compact && styles.compactContainer, style]}
        accessibilityRole="progressbar"
        accessibilityLabel={isHi ? 'ऑडियो तैयार हो रहा है' : 'Loading audio prompt'}
      >
        <ActivityIndicator size="small" color={ClinicalTheme.colors.primaryAccent} />
        <Text style={[styles.loadingText, isHi && styles.textHindi]}>
          {isHi ? 'ऑडियो तैयार हो रहा है...' : 'Loading audio...'}
        </Text>
      </View>
    );
  }

  if (status === 'playing') {
    return (
      <View style={[styles.activeRow, compact && styles.compactContainer, style]}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={onPause}
          activeOpacity={INTERACTION.pressOpacity}
          accessibilityLabel={isHi ? 'ऑडियो रोकें' : 'Pause speech prompt'}
          accessibilityRole="button"
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.buttonGlyph}>⏸</Text>
          <Text style={[styles.pauseBtnText, isHi && styles.btnTextHindi]}>
            {isHi ? 'रोकें' : 'Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          activeOpacity={INTERACTION.pressOpacity}
          accessibilityLabel={isHi ? 'ऑडियो बंद करें' : 'Stop speech prompt'}
          accessibilityRole="button"
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.stopGlyph}>⏹</Text>
          <Text style={[styles.stopBtnText, isHi && styles.btnTextHindi]}>
            {isHi ? 'बंद करें' : 'Stop'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'paused') {
    return (
      <View style={[styles.activeRow, compact && styles.compactContainer, style]}>
        <TouchableOpacity
          style={styles.resumeBtn}
          onPress={onResume}
          activeOpacity={INTERACTION.pressOpacity}
          accessibilityLabel={isHi ? 'ऑडियो पुनः चालू करें' : 'Resume speech prompt'}
          accessibilityRole="button"
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.buttonGlyph}>▶</Text>
          <Text style={[styles.resumeBtnText, isHi && styles.btnTextHindi]}>
            {isHi ? 'पुनः चालू करें' : 'Resume'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          activeOpacity={INTERACTION.pressOpacity}
          accessibilityLabel={isHi ? 'ऑडियो बंद करें' : 'Stop speech prompt'}
          accessibilityRole="button"
          hitSlop={ACCESSIBILITY.hitSlop}
        >
          <Text style={styles.stopGlyph}>⏹</Text>
          <Text style={[styles.stopBtnText, isHi && styles.btnTextHindi]}>
            {isHi ? 'बंद करें' : 'Stop'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <TouchableOpacity
        style={[styles.errorBtn, compact && styles.compactContainer, style]}
        onPress={onListen}
        activeOpacity={INTERACTION.pressOpacity}
        accessibilityLabel={isHi ? 'ऑडियो पुनः प्रयास करें' : 'Retry audio playback'}
        accessibilityRole="button"
        hitSlop={ACCESSIBILITY.hitSlop}
      >
        <Text style={styles.errorIcon}>⟳</Text>
        <Text style={[styles.errorBtnText, isHi && styles.btnTextHindi]}>
          {isHi ? 'पुनः प्रयास करें' : 'Retry Audio'}
        </Text>
      </TouchableOpacity>
    );
  }

  // IDLE State
  return (
    <TouchableOpacity
      style={[styles.idleButton, compact && styles.compactButton, style]}
      onPress={onListen}
      activeOpacity={INTERACTION.pressOpacity}
      accessibilityLabel={isHi ? 'नैदानिक प्रश्न सुनें' : 'Listen to clinical prompt'}
      accessibilityRole="button"
      hitSlop={ACCESSIBILITY.hitSlop}
    >
      <Text style={styles.speakerGlyph}>🔊</Text>
      <Text style={[styles.idleButtonText, isHi && styles.btnTextHindi]}>
        {isHi ? 'प्रश्न सुनें' : 'Listen Prompt'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  idleButton: {
    minHeight: TOUCH_TARGETS.minTouchTarget, // 48dp
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderFocus,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  compactButton: {
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  compactContainer: {
    minHeight: 44,
  },
  speakerGlyph: {
    fontSize: 16,
  },
  buttonGlyph: {
    fontSize: 14,
    color: ClinicalTheme.colors.primaryLight,
  },
  stopGlyph: {
    fontSize: 13,
    color: ClinicalTheme.colors.riskUrgent,
  },
  idleButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
    letterSpacing: 0.2,
  },
  loadingButton: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
  },
  pauseBtn: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.secondarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.secondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  pauseBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.secondary,
  },
  resumeBtn: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  resumeBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
  },
  stopBtn: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.riskUrgentBg,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgentBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stopBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskUrgent,
  },
  errorBtn: {
    minHeight: TOUCH_TARGETS.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: ClinicalTheme.colors.bgMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgent,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  errorIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: ClinicalTheme.colors.riskUrgent,
  },
  errorBtnText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskUrgent,
  },
  btnTextHindi: {
    lineHeight: 20,
  },
  textHindi: {
    lineHeight: 20,
  },
});
