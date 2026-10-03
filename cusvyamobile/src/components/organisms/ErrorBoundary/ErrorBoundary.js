import { ErrorBoundary as DefaultErrorBoundary } from 'react-error-boundary';
import { DefaultError } from '@/components/molecules';
function ErrorBoundary({ fallback, onError, onReset = undefined, ...props }) {
    const onErrorReport = (error, info) => {
        // use any crash reporting tool here
        return onError?.(error, info);
    };
    return (<DefaultErrorBoundary {...props} fallback={fallback ?? <DefaultError onReset={onReset}/>} onError={onErrorReport}/>);
}
export default ErrorBoundary;
