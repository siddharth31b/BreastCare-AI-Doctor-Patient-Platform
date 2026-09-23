import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NewPatientScreen } from '../screens/NewPatientScreen';
import { FacePhotoCaptureScreen } from '../screens/FacePhotoCaptureScreen';
import { PhotoPreviewScreen } from '../screens/PhotoPreviewScreen';
import { AssessmentStartScreen } from '../screens/AssessmentStartScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';
import { AssessmentReviewScreen } from '../screens/AssessmentReviewScreen';
import { SubmissionSuccessScreen } from '../screens/SubmissionSuccessScreen';
import { AssessmentHistoryScreen } from '../screens/AssessmentHistoryScreen';
import { PatientDetailScreen } from '../screens/PatientDetailScreen';
import { PhysicianReviewScreen } from '../screens/PhysicianReviewScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NewPatient" component={NewPatientScreen} />
        <Stack.Screen name="FacePhotoCapture" component={FacePhotoCaptureScreen} />
        <Stack.Screen name="PhotoPreview" component={PhotoPreviewScreen} />
        <Stack.Screen name="AssessmentStart" component={AssessmentStartScreen} />
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
        <Stack.Screen name="AssessmentReview" component={AssessmentReviewScreen} />
        <Stack.Screen name="SubmissionSuccess" component={SubmissionSuccessScreen} />
        <Stack.Screen name="AssessmentHistory" component={AssessmentHistoryScreen} />
        <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
        <Stack.Screen name="PhysicianReview" component={PhysicianReviewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
