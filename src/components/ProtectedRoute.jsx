import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuthContext();

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to home if not logged in
        return <Navigate to="/" replace />;
    }

    return children;
}
