// src/pages/Dashboard.jsx
// Material UI implementation
import { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Checkbox,
  FormControlLabel, Chip, Drawer, List, ListSubheader, ListItem, ListItemButton, ListItemIcon, 
  ListItemText, Divider, AppBar, Toolbar, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Switch, ToggleButton, ToggleButtonGroup,
  Avatar, Badge, Snackbar, Alert
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon
} from '@mui/icons-material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

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
  const [activeView, setActiveView] = useState('home'); // 'home', 'investors', 'calendar'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Calendario: vista y fecha de referencia
  const [calendarView, setCalendarView] = useState('agenda'); // 'agenda' | 'semana' | 'mes'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  // Estados para reuniones
  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false);
  const [meetingEditingId, setMeetingEditingId] = useState(null);
  const [newMeeting, setNewMeeting] = useState({ title: '', investorId: '', date: '', time: '', location: '', notes: '' });
  const [meetings, setMeetings] = useState([]);
  const [meetingFilterInvestorId, setMeetingFilterInvestorId] = useState('all');

  // Estados para gestión de tareas
  const [tasks, setTasks] = useState([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskEditingId, setTaskEditingId] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'Pendiente', dueDate: '' });
  const [taskFilterStatus, setTaskFilterStatus] = useState('all');
  const [tasksError, setTasksError] = useState(null);
  const [taskNotice, setTaskNotice] = useState({ open: false, severity: 'info', message: '' });
  const handleTaskNoticeClose = () => setTaskNotice(prev => ({ ...prev, open: false }));

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

  // NUEVO: cargar reuniones desde Firestore
  useEffect(() => {
    if (!user) { setMeetings([]); return; }
    const colRef = collection(db, 'users', user.uid, 'meetings');
    const unsub = onSnapshot(colRef, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMeetings(
        docs.map((m) => ({
          ...m,
          scheduledAt: m?.scheduledAt?.toDate ? m.scheduledAt.toDate() : m.scheduledAt ? new Date(m.scheduledAt) : null
        }))
      );
    });
    return () => unsub();
  }, [user]);

  // Carga de tareas desde Firestore
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setTasksError(null);
      return;
    }
    const colRef = collection(db, 'users', user.uid, 'tasks');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setTasks(docs.map(t => ({
          ...t,
          dueAt: t?.dueAt?.toDate ? t.dueAt.toDate() : (t?.dueAt ? new Date(t.dueAt) : null)
        })));
        setTasksError(null);
      },
      (error) => {
        console.error('Error al leer tareas:', error);
        setTasksError(error);
        setTaskNotice({ open: true, severity: 'error', message: `No se puede conectar a Firestore (${error.code || 'error'})` });
      }
    );
    return () => unsub();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvestor({
      ...newInvestor,
      [name]: value
    });
  };
  
  // NUEVO: handlers de reuniones
  const handleMeetingInputChange = (e) => {
    const { name, value } = e.target;
    setNewMeeting({ ...newMeeting, [name]: value });
  };

  // Abrir edición con formulario prellenado
  const openEditMeeting = (m) => {
    setMeetingEditingId(m.id);
    const d = m.scheduledAt || null;
    setNewMeeting({
      title: m.title || '',
      investorId: m.investorId || '',
      date: d ? d.toISOString().slice(0, 10) : '',
      time: d ? d.toTimeString().slice(0, 5) : '',
      location: m.location || '',
      notes: m.notes || ''
    });
    setIsMeetingDialogOpen(true);
  };

  const handleSaveMeeting = async (e) => {
    e.preventDefault();
    try {
      const dateStr = newMeeting.date; // YYYY-MM-DD
      const timeStr = newMeeting.time; // HH:MM
      const hasSchedule = dateStr && timeStr;
      const scheduledAtTs = hasSchedule ? Timestamp.fromDate(new Date(`${dateStr}T${timeStr}:00`)) : null;
      const payload = {
        title: newMeeting.title,
        investorId: newMeeting.investorId,
        location: newMeeting.location || '',
        notes: newMeeting.notes || '',
        scheduledAt: scheduledAtTs,
        createdAt: serverTimestamp()
      };
      if (meetingEditingId) {
        await updateDoc(doc(db, 'users', user.uid, 'meetings', meetingEditingId), payload);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'meetings'), payload);
      }
      setIsMeetingDialogOpen(false);
      setMeetingEditingId(null);
      setNewMeeting({ title: '', investorId: '', date: '', time: '', location: '', notes: '' });
    } catch (error) {
      console.error('Error al guardar reunión:', error);
    }
  };

  const handleDeleteMeeting = async (id) => {
    try {
      const ok = window.confirm('¿Deseas eliminar esta reunión?');
      if (!ok) return;
      await deleteDoc(doc(db, 'users', user.uid, 'meetings', id));
    } catch (err) {
      console.error('Error al eliminar reunión:', err);
    }
  };

  // Handlers de tareas
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const openEditTask = (task) => {
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'Pendiente',
      dueDate: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : ''
    });
    setTaskEditingId(task.id);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    try {
      const dueDateStr = newTask.dueDate;
      const dueAtTs = dueDateStr ? Timestamp.fromDate(new Date(`${dueDateStr}T00:00:00`)) : null;
      const payload = {
        title: newTask.title,
        description: newTask.description || '',
        status: newTask.status || 'Pendiente',
        dueAt: dueAtTs,
        createdAt: serverTimestamp()
      };
      if (taskEditingId) {
        await updateDoc(doc(db, 'users', user.uid, 'tasks', taskEditingId), payload);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), payload);
      }
      setIsTaskDialogOpen(false);
      setTaskEditingId(null);
      setNewTask({ title: '', description: '', status: 'Pendiente', dueDate: '' });
      setTaskNotice({ open: true, severity: 'success', message: 'Tarea guardada correctamente.' });
    } catch (err) {
      console.error('Error al guardar tarea:', err);
      setTaskNotice({ open: true, severity: 'error', message: `No se pudo guardar la tarea (${err.code || 'error'})` });
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const ok = window.confirm('¿Deseas eliminar esta tarea?');
      if (!ok) return;
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
    }
  };

  // Helpers y navegación del calendario
  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // lunes como inicio
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const addDays = (date, count) => { const d = new Date(date); d.setDate(d.getDate() + count); return d; };
  const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const monthGrid = (date) => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = startOfWeek(first);
    const days = [];
    for (let i = 0; i < 42; i++) { days.push(addDays(start, i)); }
    return days;
  };
  const handleCalendarPrev = () => {
    setCalendarDate(prev => calendarView === 'mes' ? new Date(prev.getFullYear(), prev.getMonth() - 1, 1) : addDays(prev, -7));
  };
  const handleCalendarNext = () => {
    setCalendarDate(prev => calendarView === 'mes' ? new Date(prev.getFullYear(), prev.getMonth() + 1, 1) : addDays(prev, 7));
  };
  const handleCalendarToday = () => { setCalendarDate(new Date()); };
  const getInvestorName = (id) => investors.find(i => i.id === id)?.name || '—';

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

  // Datos para gráficos del dashboard
  const investorStatusOrder = ['No contactado','Interesado','En seguimiento','Cerrado'];
  const investorStatusData = investorStatusOrder.map(s => ({
    name: s,
    value: investors.filter(inv => (inv.status || 'No contactado') === s).length
  }));

  const now = new Date();
  const dailyInvestorsData = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(now);
    dayDate.setDate(now.getDate() - (6 - i));
    const count = investors.filter(inv => {
      const d = inv.createdAt;
      if (!d) return false;
      // Firestore Timestamp -> Date
      const dateObj = d instanceof Timestamp ? d.toDate() : d;
      return dateObj.getFullYear() === dayDate.getFullYear() &&
             dateObj.getMonth() === dayDate.getMonth() &&
             dateObj.getDate() === dayDate.getDate();
    }).length;
    const label = dayDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return { day: label, count };
  });

  const tasksStatusOrder = ['Pendiente','En progreso','Completada'];
  const tasksStatusData = tasksStatusOrder.map(s => ({
    name: s,
    value: tasks.filter(t => (t.status || 'Pendiente') === s).length
  }));
  const pendingTasks = tasks.filter(t => (t.status || 'Pendiente') === 'Pendiente').length;
  const completedTasks = tasks.filter(t => (t.status || 'Pendiente') === 'Completada').length;
  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

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
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      {/* Aside de navegación (MUI) */}
      <Box component="nav" role="navigation" aria-label="Navegación principal"
        sx={{
          width: 260,
          flexShrink: 0,
          bgcolor: 'background.default',
          borderRight: '1px solid #1f2937',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          py: 2,
          position: 'fixed',
          left: 0,
          top: 0,
          color: 'text.primary'
        }}
      >
        {/* Perfil superior */}
          <Box sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Avatar alt={user?.displayName || user?.email || 'Usuario'} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.displayName || user?.email || 'Usuario'}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Overview</Typography>
            </Box>
          </Box>


          {/* Overview */}
          <List sx={{ px: 2 }}>
            <ListSubheader sx={{ bgcolor: 'transparent', color: 'text.secondary', px: 0 }}>Overview</ListSubheader>
            <ListItemButton aria-current={activeView === 'tasks' ? 'page' : undefined} selected={activeView === 'tasks'} onClick={() => setActiveView('tasks')} sx={{ px: 2.5, '& .MuiSvgIcon-root': { color: 'text.secondary' }, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }, '&.Mui-selected .MuiSvgIcon-root': { color: 'primary.contrastText' } }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Badge color="secondary" badgeContent={tasks.filter(t => (t.status || 'Pendiente') !== 'Completada').length}>
                  <AssignmentTurnedInIcon fontSize="small" />
                </Badge>
              </ListItemIcon>
              <ListItemText primary="Tareas" />
            </ListItemButton>
            <ListItemButton aria-current={activeView === 'home' ? 'page' : undefined} selected={activeView === 'home'} onClick={() => setActiveView('home')} sx={{ px: 2.5, '& .MuiSvgIcon-root': { color: 'text.secondary' }, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }, '&.Mui-selected .MuiSvgIcon-root': { color: 'primary.contrastText' } }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton aria-current={activeView === 'investors' ? 'page' : undefined} selected={activeView === 'investors'} onClick={() => setActiveView('investors')} sx={{ px: 2.5, '& .MuiSvgIcon-root': { color: 'text.secondary' }, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }, '&.Mui-selected .MuiSvgIcon-root': { color: 'primary.contrastText' } }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Inversionistas" />
          </ListItemButton>
          <ListItemButton aria-current={activeView === 'calendar' ? 'page' : undefined} selected={activeView === 'calendar'} onClick={() => setActiveView('calendar')} sx={{ px: 2.5, '& .MuiSvgIcon-root': { color: 'text.secondary' }, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText' }, '&.Mui-selected .MuiSvgIcon-root': { color: 'primary.contrastText' } }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <Badge color="secondary" badgeContent={meetings.filter(m => m.scheduledAt && new Date(m.scheduledAt) >= new Date()).length}>
                <CalendarMonthIcon fontSize="small" />
              </Badge>
            </ListItemIcon>
            <ListItemText primary="Calendario" />
          </ListItemButton>
        </List>


        {/* Bottom */}
        <Box sx={{ mt: 'auto', px: 2, py: 2 }}>
          <Button aria-label="Cerrar sesión de la aplicación" variant="outlined" color="inherit" onClick={onLogout} fullWidth>Cerrar Sesión</Button>
        </Box>
      </Box>
      
      {/* Contenido principal */}
      <Box component="main" id="main-content" sx={{ flexGrow: 1, pt: { xs: 1, md: 1.5 }, px: { xs: 1.5, md: 3 }, ml: '260px', maxWidth: { xs: '100%', md: 1100 } }}>
        <Box sx={{ mb: 2 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
            {activeView === 'home' ? 'Panel Principal' : activeView === 'investors' ? 'Gestión de Inversionistas' : activeView === 'calendar' ? 'Calendario de Reuniones' : 'Gestión de Tareas'}
          </Typography>
        </Box>
        
        {/* Vista principal del Dashboard */}
        {activeView === 'home' && (
          <>
          <div className="dashboard-summary">
            <div className="summary-card">
              <h3>Total de Inversionistas</h3>
              <div className="card-value">{investors.length}</div>
              <p>Inversionistas registrados</p>
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

           {/* Gráficos */}
           <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: 2 }}>
             <Grid item xs={12} md={6}>
               <Paper sx={{ p: 2, minHeight: { xs: 130, md: 160 } }}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Inversionistas por estado</Typography>
                 <Box sx={{ width: '100%', height: { xs: 90, sm: 100, md: 130 } }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={investorStatusData}>
                       <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                       <YAxis allowDecimals={false} />
                       <Tooltip />
                       <Legend />
                       <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 </Box>
               </Paper>
             </Grid>
             <Grid item xs={12} md={6}>
               <Paper sx={{ p: 2, minHeight: { xs: 130, md: 160 } }}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Nuevos inversionistas (últimos 7 días)</Typography>
                 <Box sx={{ width: '100%', height: { xs: 90, sm: 100, md: 130 } }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={dailyInvestorsData}>
                       <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                       <YAxis allowDecimals={false} />
                       <Tooltip />
                       <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                     </LineChart>
                   </ResponsiveContainer>
                 </Box>
               </Paper>
             </Grid>
             <Grid item xs={12} md={6}>
               <Paper sx={{ p: 2, minHeight: { xs: 130, md: 160 } }}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Tareas por estado</Typography>
                 <Box sx={{ width: '100%', height: { xs: 90, sm: 100, md: 130 } }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={tasksStatusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                         {tasksStatusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={["#3b82f6","#f59e0b","#10b981"][index % 3]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend />
                     </PieChart>
                   </ResponsiveContainer>
                 </Box>
               </Paper>
             </Grid>
             <Grid item xs={12} md={6}>
               <Paper sx={{ p: 2, minHeight: { xs: 130, md: 160 } }}>
                 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Resumen de tareas</Typography>
                 <Grid container spacing={2}>
                   <Grid item xs={12} md={6}>
                     <Typography variant="body2">Pendientes</Typography>
                     <Typography variant="h5" sx={{ fontWeight: 700 }}>{pendingTasks}</Typography>
                   </Grid>
                   <Grid item xs={12} md={6}>
                     <Typography variant="body2">Completadas</Typography>
                     <Typography variant="h5" sx={{ fontWeight: 700 }}>{completedTasks}</Typography>
                   </Grid>
                   <Grid item xs={12}>
                     <Typography variant="body2" sx={{ mb: 0.5 }}>Progreso</Typography>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Box sx={{ flexGrow: 1 }}>
                         <Box sx={{ height: 10, bgcolor: '#e5e7eb', borderRadius: 5 }}>
                           <Box sx={{ width: `${completionPct}%`, height: '100%', bgcolor: '#10b981', borderRadius: 5 }} />
                         </Box>
                       </Box>
                       <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>{completionPct}%</Typography>
                     </Box>
                   </Grid>
                 </Grid>
               </Paper>
             </Grid>
           </Grid>

           {/* Próximas reuniones */}
           <Box sx={{ mt: { xs: 2, md: 3 } }}>
             <Typography component="h2" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>Próximas reuniones</Typography>

             {/* Resumen Hoy/Semana */}
             <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }} aria-live="polite" aria-atomic="true">
               <Chip size="small" label={`Hoy: ${meetings
                 .filter(m => !!m.scheduledAt && m.scheduledAt.getTime() >= Date.now())
                 .filter(m => sameDay(m.scheduledAt, new Date()))
                 .length}`}
               />
               <Chip size="small" label={`Esta semana: ${meetings
                 .filter(m => !!m.scheduledAt && m.scheduledAt.getTime() >= Date.now())
                 .filter(m => { const ws = startOfWeek(new Date()); const we = addDays(ws, 6); const d = m.scheduledAt; return d >= ws && d <= we; })
                 .length}`}
               />
             </Box>

             {/* Lista agrupada por día */}
             {(() => {
               const upcoming = meetings
                 .filter(m => !!m.scheduledAt && m.scheduledAt.getTime() >= Date.now())
                 .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                 .slice(0, 10);
               if (upcoming.length === 0) {
                 return (
                   <Typography variant="body2" color="text.secondary">
                     No hay reuniones futuras programadas.
                   </Typography>
                 );
               }
               const uniqueDays = Array.from(new Set(upcoming.map(m => m.scheduledAt.toDateString())));
               return uniqueDays.map(dateStr => {
                 const items = upcoming.filter(m => m.scheduledAt.toDateString() === dateStr);
                 return (
                   <Box key={dateStr} sx={{ mb: 1.5 }}>
                     <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                       {new Date(dateStr).toLocaleDateString()}
                     </Typography>
                     {items.map((m) => (
                       <Paper key={m.id} sx={{ p: 1.2, mb: 1 }}>
                         <Grid container alignItems="center" spacing={1}>
                           <Grid item xs={12} md={4}>
                             <Typography variant="body2">
                               {m.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </Typography>
                           </Grid>
                           <Grid item xs={12} md={4}>
                             <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.title}</Typography>
                             <Typography variant="caption" color="text.secondary">
                               {investors.find(i => i.id === m.investorId)?.name || '—'}
                             </Typography>
                           </Grid>
                           <Grid item xs={12} md={3}>
                             <Typography variant="body2" color="text.secondary">{m.location || '—'}</Typography>
                           </Grid>
                           <Grid item xs={12} md={1} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                             <Button size="small" variant="outlined" onClick={() => openEditMeeting(m)}>Ver/Editar</Button>
                           </Grid>
                         </Grid>
                       </Paper>
                     ))}
                   </Box>
                 );
               });
             })()}

             <Box sx={{ mt: 1 }}>
               <Button size="small" onClick={() => setActiveView('calendar')}>Ir al Calendario</Button>
             </Box>
           </Box>

           </>
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

        {/* NUEVO: Vista de Tareas */}
        {activeView === 'tasks' && (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setTaskEditingId(null); setNewTask({ title: '', description: '', status: 'Pendiente', dueDate: '' }); setIsTaskDialogOpen(true); }}>Nueva tarea</Button>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="task-filter-label">Filtrar por estado</InputLabel>
                  <Select labelId="task-filter-label" label="Filtrar por estado" value={taskFilterStatus} onChange={(e) => setTaskFilterStatus(e.target.value)}>
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                    <MenuItem value="En progreso">En progreso</MenuItem>
                    <MenuItem value="Completada">Completada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {tasksError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                No se pudo cargar las tareas. Revisa configuración de Firebase.
              </Alert>
            )}

            <TableContainer component={Paper}>
              <Table size="small" aria-label="Tabla de tareas">
                <TableHead>
                  <TableRow>
                    <TableCell component="th" scope="col">Título</TableCell>
                    <TableCell component="th" scope="col">Estado</TableCell>
                    <TableCell component="th" scope="col">Fecha límite</TableCell>
                    <TableCell component="th" scope="col">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks
                    .filter(t => taskFilterStatus === 'all' || (t.status || 'Pendiente') === taskFilterStatus)
                    .sort((a, b) => {
                      const aTime = a.dueAt ? a.dueAt.getTime() : 0;
                      const bTime = b.dueAt ? b.dueAt.getTime() : 0;
                      return aTime - bTime;
                    })
                    .map(t => (
                      <TableRow key={t.id}>
                        <TableCell>{t.title}</TableCell>
                        <TableCell>{t.status || 'Pendiente'}</TableCell>
                        <TableCell>{t.dueAt ? t.dueAt.toLocaleDateString() : '—'}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary" onClick={() => openEditTask(t)}><EditIcon /></IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteTask(t.id)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Dialog open={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)}>
              <DialogTitle>{taskEditingId ? 'Editar tarea' : 'Nueva tarea'}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12}>
                    <TextField label="Título" name="title" value={newTask.title} onChange={handleTaskInputChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Descripción" name="description" value={newTask.description} onChange={handleTaskInputChange} fullWidth multiline minRows={3} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="task-status-label">Estado</InputLabel>
                      <Select labelId="task-status-label" label="Estado" name="status" value={newTask.status} onChange={handleTaskInputChange}>
                        <MenuItem value="Pendiente">Pendiente</MenuItem>
                        <MenuItem value="En progreso">En progreso</MenuItem>
                        <MenuItem value="Completada">Completada</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Fecha límite" type="date" name="dueDate" value={newTask.dueDate} onChange={handleTaskInputChange} fullWidth InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsTaskDialogOpen(false)}>Cancelar</Button>
                <Button variant="contained" onClick={handleSaveTask}>Guardar</Button>
              </DialogActions>
            </Dialog>
            <Snackbar open={taskNotice.open} autoHideDuration={4000} onClose={handleTaskNoticeClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
              <Alert onClose={handleTaskNoticeClose} severity={taskNotice.severity} sx={{ width: '100%' }}>
                {taskNotice.message}
              </Alert>
            </Snackbar>
          </>
        )}

        {/* NUEVO: Vista de Calendario */}
        {activeView === 'calendar' && (
          <>
            {/* Controles de vista y navegación */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <ToggleButtonGroup
                  color="primary"
                  exclusive
                  value={calendarView}
                  onChange={(_, val) => { if (val) setCalendarView(val); }}
                  size="small"
                >
                  <ToggleButton value="agenda">Agenda</ToggleButton>
                  <ToggleButton value="semana">Semana</ToggleButton>
                  <ToggleButton value="mes">Mes</ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Button variant="outlined" size="small" sx={{ mr: 1 }} startIcon={<ChevronLeftIcon />} onClick={handleCalendarPrev}>Anterior</Button>
                <Button variant="outlined" size="small" sx={{ mr: 1 }} startIcon={<TodayIcon />} onClick={handleCalendarToday}>Hoy</Button>
                <Button variant="outlined" size="small" startIcon={<ChevronRightIcon />} onClick={handleCalendarNext}>Siguiente</Button>
              </Grid>
            </Grid>

            {/* Filtro y acción */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="filter-investor-label">Filtrar por inversionista</InputLabel>
                  <Select
                    labelId="filter-investor-label"
                    label="Filtrar por inversionista"
                    value={meetingFilterInvestorId}
                    onChange={(e) => setMeetingFilterInvestorId(e.target.value)}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    {investors.map(inv => (
                      <MenuItem key={inv.id} value={inv.id}>{inv.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={'auto'}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setIsMeetingDialogOpen(true); setMeetingEditingId(null); setNewMeeting({ title: '', investorId: '', date: '', time: '', location: '', notes: '' }); }}>
                  Programar reunión
                </Button>
              </Grid>
            </Grid>

            <Dialog open={isMeetingDialogOpen} onClose={() => setIsMeetingDialogOpen(false)} fullWidth maxWidth="md">
              <DialogTitle>{meetingEditingId ? 'Editar reunión' : 'Nueva reunión'}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Título" name="title" value={newMeeting.title} onChange={handleMeetingInputChange} fullWidth required />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel id="meeting-investor-label">Inversionista</InputLabel>
                      <Select
                        labelId="meeting-investor-label"
                        id="meeting-investor"
                        label="Inversionista"
                        name="investorId"
                        value={newMeeting.investorId}
                        onChange={handleMeetingInputChange}
                      >
                        {investors.map(inv => (
                          <MenuItem key={inv.id} value={inv.id}>{inv.name}</MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>Selecciona el inversionista de la reunión</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Fecha" type="date" name="date" value={newMeeting.date} onChange={handleMeetingInputChange} fullWidth required InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Hora" type="time" name="time" value={newMeeting.time} onChange={handleMeetingInputChange} fullWidth required InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Lugar/Enlace" name="location" value={newMeeting.location} onChange={handleMeetingInputChange} fullWidth />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField multiline minRows={3} label="Notas" name="notes" value={newMeeting.notes} onChange={handleMeetingInputChange} fullWidth />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIsMeetingDialogOpen(false)}>Cancelar</Button>
                <Button variant="contained" onClick={handleSaveMeeting}>Guardar</Button>
              </DialogActions>
            </Dialog>

            {calendarView === 'agenda' && meetings
              .filter(m => meetingFilterInvestorId === 'all' || m.investorId === meetingFilterInvestorId)
              .length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No hay reuniones programadas. Usa “Programar reunión”.
                </Typography>
              )}
            {calendarView === 'agenda' && (
              <TableContainer component={Paper}>
              <Table size="small" aria-label="Agenda de reuniones">
                <TableHead>
                  <TableRow>
                    <TableCell component="th" scope="col">Fecha</TableCell>
                    <TableCell component="th" scope="col">Hora</TableCell>
                    <TableCell component="th" scope="col">Título</TableCell>
                    <TableCell component="th" scope="col">Inversionista</TableCell>
                    <TableCell component="th" scope="col">Lugar</TableCell>
                    <TableCell component="th" scope="col">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meetings
                    .filter(m => meetingFilterInvestorId === 'all' || m.investorId === meetingFilterInvestorId)
                    .sort((a, b) => (a.scheduledAt ? a.scheduledAt.getTime() : 0) - (b.scheduledAt ? b.scheduledAt.getTime() : 0))
                    .map(m => {
                      const d = m.scheduledAt || null;
                      const investorName = investors.find(i => i.id === m.investorId)?.name || '—';
                      return (
                        <TableRow key={m.id}>
                          <TableCell>{d ? d.toLocaleDateString() : '—'}</TableCell>
                          <TableCell>{d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</TableCell>
                          <TableCell>{m.title}</TableCell>
                          <TableCell>{investorName}</TableCell>
                          <TableCell>{m.location || '—'}</TableCell>
                          <TableCell>
                            <IconButton size="small" color="primary" onClick={() => openEditMeeting(m)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteMeeting(m.id)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>)}

            {calendarView === 'mes' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((dow) => (
                    <Box key={dow} sx={{ px: 1, py: 0.5, color: 'text.secondary', fontSize: 13 }}>{dow}</Box>
                  ))}
                  {monthGrid(calendarDate).map((day) => {
                    const isCurrentMonth = day.getMonth() === calendarDate.getMonth();
                    const dayMeetings = meetings
                      .filter(m => m.scheduledAt && sameDay(m.scheduledAt, day) && (meetingFilterInvestorId === 'all' || m.investorId === meetingFilterInvestorId))
                      .sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0));
                    return (
                      <Box key={day.toISOString()} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, minHeight: 100, p: 1, backgroundColor: isCurrentMonth ? 'background.paper' : '#fafafa' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{day.getDate()}</Typography>
                        {dayMeetings.map((m) => (
                          <Chip
                            key={m.id}
                            size="small"
                            sx={{ mt: 0.5, maxWidth: '100%' }}
                            label={`${m.scheduledAt ? m.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} ${m.title}`}
                            onClick={() => openEditMeeting(m)}
                          />
                        ))}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {calendarView === 'semana' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Semana de {startOfWeek(calendarDate).toLocaleDateString()}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const day = addDays(startOfWeek(calendarDate), i);
                    const dayMeetings = meetings
                      .filter(m => m.scheduledAt && sameDay(m.scheduledAt, day) && (meetingFilterInvestorId === 'all' || m.investorId === meetingFilterInvestorId))
                      .sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0));
                    return (
                      <Box key={day.toISOString()} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, minHeight: 140, p: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                        </Typography>
                        {dayMeetings.map((m) => (
                          <Chip
                            key={m.id}
                            size="small"
                            sx={{ mt: 0.5, maxWidth: '100%' }}
                            label={`${m.scheduledAt ? m.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} ${m.title}`}
                            onClick={() => openEditMeeting(m)}
                          />
                        ))}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
            
          </>
        )}
      </Box>
    </div>
  );
}

export default Dashboard;