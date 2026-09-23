import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'FacePhotoCapture'>;

export const FacePhotoCaptureScreen: React.FC<Props> = ({ route, navigation }) => {
  const { patient } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<any>(null);

  const handleCapture = async () => {
    if (cameraRef.current) {
      try {
        setCapturing(true);
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });

        if (photo && photo.uri) {
          navigation.navigate('PhotoPreview', {
            patient,
            photoUri: photo.uri,
            base64: photo.base64,
          });
        }
      } catch (err: any) {
        Alert.alert('Capture Error', err.message || 'Failed to capture photo.');
      } finally {
        setCapturing(false);
      }
    } else {
      // Simulator/fallback mock capture
      handleMockCapture();
    }
  };

  const handleMockCapture = () => {
    // Generate SVG/canvas/data URI fallback for simulator
    const mockUri = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400';
    navigation.navigate('PhotoPreview', {
      patient,
      photoUri: mockUri,
      base64: 'UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
    });
  };

  if (!permission) {
    return (
      <View style={styles.containerCenter}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.textWait}>Initializing camera subsystem...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.permissionTitle}>Tablet Camera Access Required</Text>
        <Text style={styles.permissionSub}>
          To capture the patient's face photo for their clinical file, camera permissions are required.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipBtn} onPress={handleMockCapture}>
          <Text style={styles.skipBtnText}>Use Demonstration Sample Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← Cancel</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Capture Patient Face Photo</Text>
          <Text style={styles.headerSub}>
            Patient: {patient.name} ({patient.patient_code})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.flashBtn}
          onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
        >
          <Text style={styles.flashBtnText}>⚡ {flash.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flash === 'on'}
        >
          {/* Face Oval Guide */}
          <View style={styles.overlay}>
            <View style={styles.faceOval}>
              <Text style={styles.ovalHint}>Align patient's face inside guide</Text>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Camera Controls Footer */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.flipBtn}
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
        >
          <Text style={styles.controlIconText}>🔄</Text>
          <Text style={styles.controlLabel}>Flip Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shutterBtn, capturing && styles.shutterBtnDisabled]}
          onPress={handleCapture}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoBtn} onPress={handleMockCapture}>
          <Text style={styles.controlIconText}>🖼️</Text>
          <Text style={styles.controlLabel}>Demo Image</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  containerCenter: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  textWait: {
    color: '#94a3b8',
    marginTop: 16,
    fontSize: 15,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 22,
  },
  grantBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  grantBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  skipBtn: {
    marginTop: 14,
    padding: 10,
  },
  skipBtnText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerBack: {
    padding: 8,
  },
  headerBackText: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  flashBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flashBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: 280,
    height: 380,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.05)',
  },
  ovalHint: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  controls: {
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  flipBtn: {
    alignItems: 'center',
    width: 80,
  },
  demoBtn: {
    alignItems: 'center',
    width: 80,
  },
  controlIconText: {
    fontSize: 26,
  },
  controlLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  shutterBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  shutterBtnDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#ffffff',
  },
});
