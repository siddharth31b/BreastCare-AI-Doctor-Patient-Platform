import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { TABLET_ID } from '../config/constants';
import { ApiService } from '../services/api.service';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loginDemoDoctor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic Server URL configuration for physical tablet testing
  const [serverUrl, setServerUrl] = useState('');
  const [activeServerUrl, setActiveServerUrl] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadCurrentServer() {
      const current = await ApiService.getBaseUrl();
      setActiveServerUrl(current);
      setServerUrl(current);
    }
    loadCurrentServer();
  }, []);

  const handleTestConnection = async () => {
    setTestingHealth(true);
    setHealthStatus(null);
    try {
      const result = await ApiService.checkHealth(serverUrl);
      if (result.success) {
        setHealthStatus(`Connected! (Status: ${result.status}, v${result.version})`);
      } else {
        setHealthStatus(`Connection failed: ${result.status}`);
      }
    } catch (err: any) {
      setHealthStatus(`Error: ${err.message}`);
    } finally {
      setTestingHealth(false);
    }
  };

  const handleSaveServer = async () => {
    try {
      await ApiService.setBaseUrl(serverUrl);
      const updated = await ApiService.getBaseUrl();
      setActiveServerUrl(updated);
      setShowConfigModal(false);
      Alert.alert('Server Configured', `API URL updated to:\n${updated}`);
    } catch (err: any) {
      Alert.alert('Save Error', err.message);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter your clinical email and password.');
      return;
    }

    setLoading(true);
    try {
      // In production with Firebase Client SDK, authWithEmailAndPassword returns ID token
      // In development fallback, verify with token
      const mockToken = email.includes('doctor') ? 'demo-doctor-token' : `mock:DOCTOR:${email}:${email}:Doctor`;
      await login(mockToken);
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Unable to authenticate doctor account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginDemoDoctor();
      navigation.replace('Dashboard');
    } catch (err: any) {
      Alert.alert('Demo Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerArea}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🩺</Text>
            </View>
            <Text style={styles.brandTitle}>BreastCare AI</Text>
            <Text style={styles.brandSubtitle}>Clinical Doctor Portal</Text>
            <View style={styles.tabletBadge}>
              <Text style={styles.tabletBadgeText}>Tablet ID: {TABLET_ID}</Text>
            </View>
          </View>

          <View style={styles.formArea}>
            <Text style={styles.inputLabel}>Doctor Email / Medical ID</Text>
            <TextInput
              style={styles.input}
              placeholder="doctor@breastcare.ai"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Doctor Secure Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK ACCESS</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <Text style={styles.demoButtonText}>⚡ Instant Doctor Demo Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serverConfigBadge}
              onPress={() => setShowConfigModal(true)}
            >
              <Text style={styles.serverConfigText} numberOfLines={1}>
                📡 Backend: {activeServerUrl || 'Detecting...'}
              </Text>
              <Text style={styles.serverConfigAction}>Configure</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Server URL Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configure API Server</Text>
            <Text style={styles.modalSubtitle}>
              For a physical Android tablet, enter your development machine's Wi-Fi / LAN IP (e.g. http://192.168.1.100:5000/api).
            </Text>

            <Text style={styles.modalInputLabel}>API Base URL</Text>
            <TextInput
              style={styles.modalInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://192.168.1.X:5000/api"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {healthStatus ? (
              <View
                style={[
                  styles.statusBox,
                  healthStatus.includes('Connected') ? styles.statusSuccess : styles.statusError
                ]}
              >
                <Text style={styles.statusText}>{healthStatus}</Text>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleTestConnection}
                disabled={testingHealth}
              >
                {testingHealth ? (
                  <ActivityIndicator color="#38bdf8" size="small" />
                ) : (
                  <Text style={styles.testButtonText}>Test Connection</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveServer}
              >
                <Text style={styles.saveButtonText}>Save & Apply</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConfigModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 36,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
  },
  brandSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 4,
  },
  tabletBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  tabletBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  formArea: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#f8fafc',
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#334155',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 12,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  demoButton: {
    backgroundColor: '#047857',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  serverConfigBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 20,
  },
  serverConfigText: {
    color: '#94a3b8',
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  serverConfigAction: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#f8fafc',
    marginBottom: 14,
  },
  statusBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusError: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  statusText: {
    fontSize: 12,
    color: '#f8fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
