import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TextInput, Button, StyleSheet, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { api, setToken } from './api';

type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await api.signin(email, password);
      await setToken(resp.accessToken);
      // Register device token (Expo push) if possible
      try {
        let expoToken = '';
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus === 'granted') {
            const token = await Notifications.getExpoPushTokenAsync();
            expoToken = token.data;
          }
        }
        if (expoToken) {
          await api.registerDevice(expoToken, '1.0.0');
        }
      } catch (_) {
        // Non-fatal; continue
      }
      navigation.replace('Home');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>ClubApp</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" onChangeText={setEmail} value={email} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
      <Button title={loading ? 'Signing in…' : 'Sign In'} onPress={onSubmit} disabled={loading} />
    </SafeAreaView>
  );
}

function HomeScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cfg = await api.config();
        // we could use cfg.minimumAppVersion here if needed
        const me = await api.me();
        setProfile(me);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <View style={styles.container}><Text style={styles.error}>{error}</Text></View>;
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text>{profile?.email || profile?.phone}</Text>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  error: { color: 'crimson', marginBottom: 12, textAlign: 'center' },
});


