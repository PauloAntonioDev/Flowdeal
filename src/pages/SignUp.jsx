// src/pages/SignUp.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }
    
    setLoading(true);
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      // Limpiar el formulario
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Error al crear usuario: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Crear Cuenta</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">¡Usuario creado con éxito!</div>}
      
      <form onSubmit={handleSignUp}>
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
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? "Creando usuario..." : "Crear Cuenta"}
        </button>
      </form>
    </div>
  );
}