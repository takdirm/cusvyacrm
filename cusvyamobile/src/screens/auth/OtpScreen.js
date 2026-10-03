import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verifyPhoneOtp } from '@/services/firebasePhoneAuthService';
import { registerCustomerWithApi } from '@/services/mobileAuthApiService';

function OtpScreen({ navigation, route }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const phoneNumber = route?.params?.phoneNumber ?? '';

  const onVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const { idToken } = await verifyPhoneOtp(otp);
      await registerCustomerWithApi(idToken, phoneNumber);
      navigation.replace('homeTab');
    } catch (verifyError) {
      setError(verifyError.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>OTP sent to {phoneNumber || 'your number'}.</Text>
        <TextInput
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={setOtp}
          placeholder="6 digit OTP"
          style={styles.input}
          value={otp}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={onVerify} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f4f5f7', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 18, color: '#68717d' },
  input: { borderWidth: 1, borderColor: '#d6d9de', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  error: { color: '#bc1a1a', marginTop: 10 },
  button: { marginTop: 16, backgroundColor: '#1c6ef2', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default OtpScreen;
