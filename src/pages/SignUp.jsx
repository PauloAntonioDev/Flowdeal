// src/pages/SignUp.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Box, Paper, Stack, Typography, Button, Divider, TextField, Alert } from "@mui/material";
import { MailOutline as MailOutlineIcon, Google as GoogleIcon } from "@mui/icons-material";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowEmailForm(false);
    } catch (error) {
      setError("Error al crear usuario: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError("Error al registrarse con Google: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: 2,
      // Fondo tipo gradient suave acorde al modo oscuro
      background: {
        xs: "radial-gradient(1200px circle at 0% 0%, rgba(29,78,216,.25), transparent 40%), radial-gradient(1200px circle at 100% 100%, rgba(147,51,234,.25), transparent 40%)",
        md: "radial-gradient(1200px circle at 0% 0%, rgba(29,78,216,.25), transparent 40%), radial-gradient(1200px circle at 100% 100%, rgba(147,51,234,.25), transparent 40%)"
      }
    }}>
      <Paper elevation={8} sx={{
        width: 420,
        maxWidth: "100%",
        bgcolor: "background.paper",
        borderRadius: 2,
        p: 3
      }}>
        <Stack spacing={2}>
          <Stack alignItems="center" spacing={0.5}>
            <img src="/vite.svg" alt="logo" width={28} height={28} style={{ opacity: 0.9 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Crear cuenta</Typography>
            <Typography variant="body2" color="text.secondary">Un último paso antes de empezar tu prueba.</Typography>
          </Stack>

          {error && <Alert severity="error" variant="outlined">{error}</Alert>}
          {success && <Alert severity="success" variant="outlined">¡Usuario creado con éxito!</Alert>}

          {!showEmailForm && (
            <Stack spacing={1.5}>
              <Button variant="outlined" fullWidth startIcon={<MailOutlineIcon />} onClick={() => setShowEmailForm(true)}>
                Registrarse con email
              </Button>
              <Button variant="outlined" fullWidth startIcon={<GoogleIcon />} onClick={handleGoogleSignUp} disabled={loading}>
                Registrarse con Google
              </Button>
            </Stack>
          )}

          {showEmailForm && (
            <Box component="form" onSubmit={handleSignUp} noValidate>
              <Stack spacing={1.5}>
                <TextField type="email" label="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
                <TextField type="password" label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                <TextField type="password" label="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" disabled={loading}>Crear cuenta</Button>
                <Button variant="text" onClick={() => setShowEmailForm(false)} sx={{ mt: 0.5 }}>Volver</Button>
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Al continuar aceptas los Términos y la Política de Privacidad.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}