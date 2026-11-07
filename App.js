import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ROLES } from './src/entities/Usuario';
import Navigation from './src/navigation';

function AppContent() {
  const { user, loading, error } = useAuth();
  const fundoClaro = loading || error || (user && user.role !== ROLES.ADMIN);
  return (
    <>
      <StatusBar style={fundoClaro ? 'dark' : 'light'} />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
