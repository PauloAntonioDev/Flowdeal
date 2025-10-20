// src/pages/Login.jsx
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Box, Paper, Stack, Typography, Button, Divider, TextField, Alert } from "@mui/material";
import { Google as GoogleIcon } from "@mui/icons-material";

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
    } catch (error) {
      setError("Error al iniciar sesión con Google: " + error.message);
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
      background: {
        xs: "radial-gradient(1200px circle at 0% 0%, rgba(29,78,216,.25), transparent 40%), radial-gradient(1200px circle at 100% 100%, rgba(147,51,234,.25), transparent 40%)",
        md: "radial-gradient(1200px circle at 0% 0%, rgba(29,78,216,.25), transparent 40%), radial-gradient(1200px circle at 100% 100%, rgba(147,51,234,.25), transparent 40%)"
      }
    }}>
      <Paper elevation={8} sx={{ width: 420, maxWidth: "100%", p: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Stack spacing={2}>
          <Stack alignItems="center" spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>GF invest</Typography>
            <Typography variant="body2" color="text.secondary">Iniciar Sesión</Typography>
          </Stack>

          {error && <Alert severity="error" variant="outlined">{error}</Alert>}

          <Box component="form" onSubmit={handleLogin} noValidate>
            <Stack spacing={1.5}>
              <TextField type="email" label="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
              <TextField type="password" label="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>Iniciar Sesión</Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>O inicia sesión con:</Typography>
          <Button variant="outlined" fullWidth startIcon={<GoogleIcon />} onClick={handleGoogleLogin} disabled={loading}>
            Iniciar sesión con Google
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}