import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tabs = ['Home', 'Profile', 'Settings'];

function HomeTabScreen() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.title}>Cusvya Mobile Template</Text>
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.contentCard}>
        <Text style={styles.contentTitle}>{activeTab} Tab</Text>
        <Text style={styles.contentText}>
          Static landing area for the mobile template. Replace with customer dashboard and profile features after Firebase and API integration.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f8f9fb', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 10, marginBottom: 20 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabButton: { flex: 1, borderWidth: 1, borderColor: '#d6d9de', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#1c6ef2', borderColor: '#1c6ef2' },
  tabText: { color: '#334155', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  contentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  contentTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  contentText: { fontSize: 14, color: '#5b6573', lineHeight: 20 },
});

export default HomeTabScreen;

