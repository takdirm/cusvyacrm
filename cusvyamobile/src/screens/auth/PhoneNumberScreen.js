import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { requestPhoneOtp } from '@/services/firebasePhoneAuthService';

function PhoneNumberScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await requestPhoneOtp(phoneNumber);
      navigation.navigate('otp', { phoneNumber });
    } catch (requestError) {
      setError(requestError.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Customer Login</Text>
        <Text style={styles.subtitle}>Firebase phone authentication.</Text>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={setPhoneNumber}
          placeholder="+91 9XXXXXXXXX"
          style={styles.input}
          value={phoneNumber}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity onPress={onSendOtp} style={styles.button}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
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

export default PhoneNumberScreen;
