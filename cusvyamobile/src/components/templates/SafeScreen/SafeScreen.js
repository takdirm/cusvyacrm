import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { DefaultError } from '@/components/molecules';
import { ErrorBoundary } from '@/components/organisms';
function SafeScreen({ children = undefined, isError = false, onResetError = undefined, style, ...props }) {
    const { layout, navigationTheme, variant } = useTheme();
    return (<SafeAreaView {...props} mode="padding" style={[layout.flex_1, style]}>
      <StatusBar backgroundColor={navigationTheme.colors.background} barStyle={variant === 'dark' ? 'light-content' : 'dark-content'}/>
      <ErrorBoundary onReset={onResetError}>
        {isError ? <DefaultError onReset={onResetError}/> : children}
      </ErrorBoundary>
    </SafeAreaView>);
}
export default SafeScreen;
