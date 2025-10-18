// src/pages/Dashboard.jsx
// Material UI implementation
import { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Checkbox,
  FormControlLabel, Chip, Drawer, List, ListItem, ListItemIcon, 
  ListItemText, Divider, AppBar, Toolbar, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Switch
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

function Dashboard({ user, onLogout }) {

   const [investors, setInvestors] = useState([]);
  
  const [newInvestor, setNewInvestor] = useState({
    name: '',
    stage: '',
    zone: '',
    minInvestment: '',
    maxInvestment: '',
    sector: '',
    email: '',
    phone: '',
    status: 'No contactado',
    contacted: false,
    createdAt: new Date()
  });
  
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('home'); // 'home', 'investors'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const resetInvestorForm = () => {
    setNewInvestor({
      name: '',
      stage: '',
      zone: '',
      minInvestment: '',
      maxInvestment: '',
      sector: '',
      email: '',
      phone: '',
      status: 'No contactado',
      contacted: false,
      createdAt: new Date()
    });
  };
  
  // Cargar inversionistas por usuario desde Firestore
  useEffect(() => {
    if (!user) {
      setInvestors([]);
      return;
    }
    const colRef = collection(db, 'users', user.uid, 'investors');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInvestors(
        docs.map((inv) => ({
          ...inv,
          createdAt: inv?.createdAt?.toDate ? inv.createdAt.toDate() : inv.createdAt ? new Date(inv.createdAt) : new Date()
        }))
      );
    });
    return () => unsub();
  }, [user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvestor({
      ...newInvestor,
      [name]: value
    });
  };
  
  const handleAddInvestor = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { createdAt, ...updatePayload } = newInvestor;
        await updateDoc(doc(db, 'users', user.uid, 'investors', editingId), {
          ...updatePayload,
          minInvestment: newInvestor.minInvestment,
          maxInvestment: newInvestor.maxInvestment,
          contacted: !!newInvestor.contacted
        });
      } else {
        const investorToAdd = {
          ...newInvestor,
          contacted: newInvestor.contacted || false,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'users', user.uid, 'investors'), investorToAdd);
      }
    } catch (error) {
      console.error('Error al guardar inversionista:', error);
    }

    resetInvestorForm();
    setIsDialogOpen(false);
    setEditingId(null);
  };
  
  // Contador de inversionistas activos
  const activeInvestorsCount = investors.length;

  const handleEditInvestor = (investor) => {
    setNewInvestor({
      name: investor.name || '',
      stage: investor.stage || '',
      zone: investor.zone || '',
      minInvestment: investor.minInvestment || '',
      maxInvestment: investor.maxInvestment || '',
      sector: investor.sector || '',
      email: investor.email || '',
      phone: investor.phone || '',
      status: investor.status || 'No contactado',
      contacted: !!investor.contacted,
      createdAt: investor.createdAt || new Date()
    });
    setEditingId(investor.id);
    setIsDialogOpen(true);
  };

  const handleDeleteInvestor = async (id) => {
    try {
      const ok = window.confirm('¿Deseas eliminar este inversionista?');
      if (!ok) return;
      await deleteDoc(doc(db, 'users', user.uid, 'investors', id));
    } catch (err) {
      console.error('Error al eliminar inversionista:', err);
    }
  };
  
  return (
    <div className="dashboard-container">
      {/* Aside de navegación (MUI) */}
      <Box
        sx={{
          width: 200,
          flexShrink: 0,
          backgroundColor: '#f5f5f5',
          borderRight: '1px solid #e0e0e0',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          position: 'fixed',
          left: 0,
          top: 0
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>Flowdeal</Typography>
        </Box>

        <Box sx={{ display: 'none' }} />

        <List sx={{ width: '100%' }}>
          <ListItem 
            button 
            selected={activeView === 'home'}
            onClick={() => setActiveView('home')}
            sx={{ pl: 4 }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ mr: 1, color: 'primary.main' }}>📊</Box>
              <Typography>Dashboard</Typography>
            </Box>
          </ListItem>

          <ListItem 
            button 
            selected={activeView === 'investors'}
            onClick={() => setActiveView('investors')}
            sx={{ pl: 4 }}
          >
            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ mr: 1 }}>👥</Box>
              <Typography>Inversionistas</Typography>
            </Box>
          </ListItem>
        </List>

        <Box sx={{ mt: 'auto', textAlign: 'center', px: 2 }}>
          <Button variant="outlined" color="inherit" onClick={onLogout}>Cerrar Sesión</Button>
        </Box>
      </Box>
      
      {/* Contenido principal */}
      <Box component="main" sx={{ flexGrow: 1, pt: 1.5, px: 3, ml: '200px', maxWidth: 1100 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant={activeView === 'home' ? 'h6' : 'h5'} sx={{ fontWeight: 600 }}>
            {activeView === 'home' ? 'Panel Principal' : 'Gestión de Inversionistas'}
          </Typography>
        </Box>
        
        {/* Vista principal del Dashboard */}
        {activeView === 'home' && (
          <div className="dashboard-summary">
            <div className="summary-card">
              <h3>Total de Inversionistas</h3>
              <div className="card-value">{investors.length}</div>
              <p>Inversionistas registrados</p>
            </div>
            
            <div className="summary-card">
              <h3>Nuevos este mes</h3>
              <div className="card-value">
                {investors.filter(inv => {
                  const now = new Date();
                  return inv.createdAt.getMonth() === now.getMonth() && 
                         inv.createdAt.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p>Inversionistas añadidos recientemente</p>
            </div>
            
            <div className="summary-card">
              <h3>Contactados</h3>
              <div className="card-value">
                {investors.filter(inv => inv.contacted).length} / {investors.length}
              </div>
              <p>Inversionistas contactados vs. total</p>
            </div>
            
            <div className="summary-card">
              <h3>Por estado</h3>
              <div className="status-breakdown">
                <div>
                  <span className="status-label">Interesados:</span>
                  <span className="status-value">{investors.filter(inv => inv.status === 'Interesado').length}</span>
                </div>
                <div>
                  <span className="status-label">En seguimiento:</span>
                  <span className="status-value">{investors.filter(inv => inv.status === 'En seguimiento').length}</span>
                </div>
                <div>
                  <span className="status-label">Cerrados:</span>
                  <span className="status-value">{investors.filter(inv => inv.status === 'Cerrado').length}</span>
                </div>
              </div>
            </div>
            

          </div>
        )}
        
        {/* Vista de Inversionistas */}
        {activeView === 'investors' && (
          <>
            <div className="investors-controls">
              {/* Botón modernizado con MUI */}
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />} 
                onClick={() => { resetInvestorForm(); setEditingId(null); setIsDialogOpen(true); }}
              >
                Agregar Inversionista
              </Button>
            </div>
            
            {/* Formulario modernizado en Dialog MUI */}
            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} fullWidth maxWidth="md">
              <DialogTitle>{editingId ? 'Editar Inversionista' : 'Nuevo Inversionista'}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nombre del Fondo"
                      name="name"
                      value={newInvestor.name}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Nombre del fondo o firma de inversión."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="investor-stage-label">Etapa de Inversión</InputLabel>
                      <Select
                        labelId="investor-stage-label"
                        id="investor-stage"
                        label="Etapa de Inversión"
                        name="stage"
                        value={newInvestor.stage}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="" disabled>Seleccionar...</MenuItem>
                        <MenuItem value="Pre-semilla">Pre-semilla</MenuItem>
                        <MenuItem value="Semilla">Semilla</MenuItem>
                        <MenuItem value="Serie A">Serie A</MenuItem>
                        <MenuItem value="Serie B">Serie B</MenuItem>
                        <MenuItem value="Crecimiento">Crecimiento</MenuItem>
                      </Select>
                      <FormHelperText>Selecciona la etapa típica en la que invierte.</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="investor-zone-label">Zona Geográfica</InputLabel>
                      <Select
                        labelId="investor-zone-label"
                        id="investor-zone"
                        label="Zona Geográfica"
                        name="zone"
                        value={newInvestor.zone}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="" disabled>Seleccionar...</MenuItem>
                        <MenuItem value="Latinoamérica">Latinoamérica</MenuItem>
                        <MenuItem value="Norteamérica">Norteamérica</MenuItem>
                        <MenuItem value="Europa">Europa</MenuItem>
                        <MenuItem value="Asia">Asia</MenuItem>
                        <MenuItem value="África">África</MenuItem>
                        <MenuItem value="Oceanía">Oceanía</MenuItem>
                      </Select>
                      <FormHelperText>Región donde el fondo suele invertir.</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="investor-sector-label">Sector</InputLabel>
                      <Select
                        labelId="investor-sector-label"
                        id="investor-sector"
                        label="Sector"
                        name="sector"
                        value={newInvestor.sector}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="" disabled>Seleccionar...</MenuItem>
                        <MenuItem value="Tecnología">Tecnología</MenuItem>
                        <MenuItem value="Fintech">Fintech</MenuItem>
                        <MenuItem value="Salud">Salud</MenuItem>
                        <MenuItem value="Educación">Educación</MenuItem>
                        <MenuItem value="Comercio">Comercio</MenuItem>
                        <MenuItem value="Sostenibilidad">Sostenibilidad</MenuItem>
                      </Select>
                      <FormHelperText>Industria objetivo del fondo.</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Inversión Mínima ($)"
                      type="number"
                      name="minInvestment"
                      value={newInvestor.minInvestment}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Monto mínimo en USD."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Inversión Máxima ($)"
                      type="number"
                      name="maxInvestment"
                      value={newInvestor.maxInvestment}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Monto máximo en USD."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Correo Electrónico"
                      type="email"
                      name="email"
                      value={newInvestor.email}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Correo de contacto principal."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Teléfono"
                      type="tel"
                      name="phone"
                      value={newInvestor.phone}
                      onChange={handleInputChange}
                      fullWidth
                      required
                      helperText="Teléfono de contacto."
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="investor-status-label">Estado</InputLabel>
                      <Select
                        labelId="investor-status-label"
                        id="investor-status"
                        label="Estado"
                        name="status"
                        value={newInvestor.status}
                        onChange={handleInputChange}
                      >
                        <MenuItem value="No contactado">No contactado</MenuItem>
                        <MenuItem value="Interesado">Interesado</MenuItem>
                        <MenuItem value="En seguimiento">En seguimiento</MenuItem>
                        <MenuItem value="Cerrado">Cerrado</MenuItem>
                      </Select>
                      <FormHelperText>Seguimiento actual del fondo.</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!newInvestor.contacted}
                          onChange={(e) => setNewInvestor({ ...newInvestor, contacted: e.target.checked })}
                        />
                      }
                      label="¿Contactado?"
                    />
                    <Typography variant="caption" color="text.secondary">Marca si ya se contactó al fondo.</Typography>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button variant="contained" color="primary" onClick={handleAddInvestor}>
                  {editingId ? 'Guardar Cambios' : 'Guardar Inversionista'}
                </Button>
              </DialogActions>
            </Dialog>

            
            <div className="investors-table-container">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Lista de Inversionistas ({activeInvestorsCount})</Typography>
              <table className="investors-table">
                <thead>
                  <tr>
                    <th>Nombre del Fondo</th>
                    <th>Etapa de Inversión</th>
                    <th>Zona Geográfica</th>
                    <th>Inversión Mín/Máx</th>
                    <th>Sector</th>
                    <th>Contacto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map(investor => (
                    <tr key={investor.id}>
                      <td>{investor.name}</td>
                      <td>{investor.stage}</td>
                      <td>{investor.zone}</td>
                      <td>${Number(investor.minInvestment).toLocaleString()} - ${Number(investor.maxInvestment).toLocaleString()}</td>
                      <td>{investor.sector}</td>
                      <td>
                        <div>{investor.email}</div>
                        <div>{investor.phone}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${investor.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {investor.status}
                        </span>
                      </td>
                      <td>
                        <IconButton size="small" color="primary" onClick={() => handleEditInvestor(investor)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteInvestor(investor.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Box>
    </div>
  );
}

export default Dashboard;