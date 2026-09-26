import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SupportedLanguage, translations, Translations } from './translations';

const LANGUAGE_STORAGE_KEY = 'breastcare_doctor_app_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: keyof Translations, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => translations.en[key] || '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'hi' || saved === 'en') {
          setLanguageState(saved);
        }
      } catch (err) {
        console.warn('[LanguageContext] Failed to load saved language:', err);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    try {
      setLanguageState(newLang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('[LanguageContext] Failed to save language:', err);
    }
  };

  const t = (key: keyof Translations, params?: Record<string, string | number>): string => {
    const langSet = translations[language] || translations.en;
    if (__DEV__ && language === 'hi' && langSet[key] === undefined) {
      console.warn(`[i18n] Missing Hindi translation for key: "${String(key)}"`);
    }
    let text = langSet[key] !== undefined ? langSet[key] : (translations.en[key] || String(key));
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

/**
 * Reusable Tablet-First Language Switcher Component
 * Shows clean: [ English ] [ हिन्दी ]
 */
export const LanguageSwitcher: React.FC<{ style?: any }> = ({ style }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.tab, language === 'en' && styles.tabActive]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, language === 'en' && styles.tabTextActive]}>
          English
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, language === 'hi' && styles.tabActive]}
        onPress={() => setLanguage('hi')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabText, language === 'hi' && styles.tabTextActive]}>
          हिन्दी
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#0a2540',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabTextActive: {
    color: '#ffffff',
  },
});
