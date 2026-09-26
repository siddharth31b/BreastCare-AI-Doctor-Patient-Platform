import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { ClinicalTheme } from '../theme/clinicalTheme';
import { SpeechPlaybackState } from '../services/speechService';

interface SpeechButtonProps {
  status: SpeechPlaybackState;
  onListen: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  language?: 'en' | 'hi';
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Minimalist Clinical Audio Wave Icon rendered with geometric views (No emojis)
 */
const AudioWaveGlyph: React.FC<{ active?: boolean }> = ({ active = false }) => (
  <View style={styles.glyphContainer}>
    <View style={[styles.waveBar, { height: 7 }, active && styles.waveBarActive]} />
    <View style={[styles.waveBar, { height: 14 }, active && styles.waveBarActive]} />
    <View style={[styles.waveBar, { height: 10 }, active && styles.waveBarActive]} />
  </View>
);

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
      <View style={[styles.loadingButton, compact && styles.compactContainer, style]}>
        <ActivityIndicator size="small" color={ClinicalTheme.colors.primaryAccent} />
        <Text style={styles.loadingText}>
          {isHi ? 'ऑडियो तैयार हो रहा है...' : 'Preparing audio...'}
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
          activeOpacity={0.8}
          accessibilityLabel={isHi ? 'ऑडियो रोकें' : 'Pause speech'}
          accessibilityRole="button"
        >
          <View style={styles.pauseIconBox}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
          <Text style={styles.pauseBtnText}>{isHi ? 'रोकें' : 'Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          activeOpacity={0.8}
          accessibilityLabel={isHi ? 'ऑडियो बंद करें' : 'Stop speech'}
          accessibilityRole="button"
        >
          <View style={styles.stopIconSquare} />
          <Text style={styles.stopBtnText}>{isHi ? 'बंद करें' : 'Stop'}</Text>
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
          activeOpacity={0.8}
          accessibilityLabel={isHi ? 'ऑडियो पुनः चालू करें' : 'Resume speech'}
          accessibilityRole="button"
        >
          <Text style={styles.resumeIconTriangle}>▶</Text>
          <Text style={styles.resumeBtnText}>{isHi ? 'पुनः चालू' : 'Resume'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          activeOpacity={0.8}
          accessibilityLabel={isHi ? 'ऑडियो बंद करें' : 'Stop speech'}
          accessibilityRole="button"
        >
          <View style={styles.stopIconSquare} />
          <Text style={styles.stopBtnText}>{isHi ? 'बंद करें' : 'Stop'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <TouchableOpacity
        style={[styles.errorBtn, compact && styles.compactContainer, style]}
        onPress={onListen}
        activeOpacity={0.85}
        accessibilityLabel={isHi ? 'ऑडियो पुनः प्रयास करें' : 'Retry audio playback'}
        accessibilityRole="button"
      >
        <Text style={styles.errorIcon}>⟳</Text>
        <Text style={styles.errorBtnText}>
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
      activeOpacity={0.8}
      accessibilityLabel={isHi ? 'नैदानिक प्रश्न सुनें' : 'Listen to clinical prompt'}
      accessibilityRole="button"
    >
      <AudioWaveGlyph active={false} />
      <Text style={styles.idleButtonText}>
        {isHi ? 'प्रश्न सुनें' : 'Listen Prompt'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  idleButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  compactButton: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactContainer: {
    minHeight: 44,
  },
  idleButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
    letterSpacing: 0.3,
  },
  loadingButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: ClinicalTheme.colors.textMuted,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  pauseBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.secondarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.secondary,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  pauseIconBox: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  pauseBar: {
    width: 3,
    height: 14,
    backgroundColor: ClinicalTheme.colors.secondary,
    borderRadius: 1,
  },
  pauseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.secondary,
  },
  resumeBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.primarySoft,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  resumeIconTriangle: {
    fontSize: 14,
    color: ClinicalTheme.colors.primaryLight,
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.primaryLight,
  },
  stopBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.borderMedium,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stopIconSquare: {
    width: 10,
    height: 10,
    backgroundColor: ClinicalTheme.colors.textMuted,
    borderRadius: 1,
  },
  stopBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.textSecondary,
  },
  errorBtn: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ClinicalTheme.colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: ClinicalTheme.colors.riskUrgent,
    borderRadius: ClinicalTheme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  errorIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: ClinicalTheme.colors.riskUrgent,
  },
  errorBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ClinicalTheme.colors.riskUrgent,
  },
  glyphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 14,
  },
  waveBar: {
    width: 2.5,
    backgroundColor: ClinicalTheme.colors.primaryAccent,
    borderRadius: 1,
  },
  waveBarActive: {
    backgroundColor: ClinicalTheme.colors.secondary,
  },
});
