import { useState, useEffect } from 'react'
import './App.css'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import { auth } from './firebase'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        setUser(authUser);
        setLoading(false);
      });
      
      return () => unsubscribe();
    });
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };
  
  const toggleForm = () => {
    setShowSignUp(!showSignUp);
  };
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return (
    <div className="app-container">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <div>
          {showSignUp ? (
            <>
              <SignUp />
              <p className="toggle-form">
                ¿Ya tienes una cuenta? <button onClick={toggleForm}>Iniciar Sesión</button>
              </p>
            </>
          ) : (
            <>
              <Login />
              <p className="toggle-form">
                ¿No tienes una cuenta? <button onClick={toggleForm}>Registrarse</button>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App
