import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { HomeTabScreen, OtpScreen, PhoneNumberScreen } from '@/screens';

const Stack = createStackNavigator();

function ApplicationNavigator() {
  const { navigationTheme, variant } = useTheme();

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator key={variant} initialRouteName="phoneNumber" screenOptions={{ headerShown: false }}>
          <Stack.Screen component={PhoneNumberScreen} name="phoneNumber" />
          <Stack.Screen component={OtpScreen} name="otp" />
          <Stack.Screen component={HomeTabScreen} name="homeTab" />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;

