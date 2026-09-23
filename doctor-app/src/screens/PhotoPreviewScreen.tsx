import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoPreview'>;

export const PhotoPreviewScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient, photoUri, base64 } = route.params;
  const [uploading, setUploading] = useState(false);

  const handleConfirmAndUpload = async () => {
    setUploading(true);
    try {
      const uploadPayload = base64 || 'data:image/jpeg;base64,' + photoUri;
      const res = await ApiService.uploadPatientPhoto(patient.id, uploadPayload);

      const updatedPatient = {
        ...patient,
        face_photo_url: res.face_photo_url,
      };

      // Proceed to Assessment Start
      navigation.replace('AssessmentStart', { patient: updatedPatient });
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload patient face photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Patient Face Photo</Text>
        <Text style={styles.subtitle}>
          Patient: {patient.name} ({patient.patient_code})
        </Text>
      </View>

      <View style={styles.previewCard}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
      </View>

      <View style={styles.guidanceBox}>
        <Text style={styles.guidanceText}>
          🔒 This photo will be securely encrypted in Supabase storage and attached to the patient's medical file.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retakeBtn}
          onPress={() => navigation.goBack()}
          disabled={uploading}
        >
          <Text style={styles.retakeBtnText}>🔄 Retake Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmBtn, uploading && styles.confirmBtnDisabled]}
          onPress={handleConfirmAndUpload}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.confirmBtnText}>✓ Confirm & Start Assessment →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 36,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  previewCard: {
    alignSelf: 'center',
    width: 320,
    height: 420,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  guidanceBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 16,
  },
  guidanceText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
  },
  retakeBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeBtnText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0284c7',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
