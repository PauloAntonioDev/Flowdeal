// src/pages/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirigir al usuario después del inicio de sesión exitoso
      // Esto se manejará en App.jsx con un contexto de autenticación
    } catch (error) {
      setError("Error al iniciar sesión: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      await signInWithPopup(auth, googleProvider);
      // La redirección se manejará en App.jsx
    } catch (error) {
      setError("Error al iniciar sesión con Google: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </button>
      </form>
      
      <div className="social-login">
        <p>O inicia sesión con:</p>
        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="google-button"
        >
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
}