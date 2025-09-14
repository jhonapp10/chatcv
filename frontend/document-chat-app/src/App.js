import React, { useState, useEffect } from 'react';
import * as marked from 'marked';
// Carga las bibliotecas de React y Material-UI desde un CDN
//const React = window.React;
//const ReactDOM = window.ReactDOM;
// Carga las bibliotecas de React y Material-UI desde un CDN
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Grid,
  styled,
  LinearProgress,
  CardActions,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
const theme = createTheme({
  palette: {
    primary: {
      main: '#5E35B1',
    },
    secondary: {
      main: '#9C27B0',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

// Estilos de los componentes
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: 'auto',
  maxWidth: '90%',
  borderRadius: theme.shape.borderRadius * 2,
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  backgroundColor: '#f5f5f5',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 2,
  padding: '12px 24px',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: '#ffffff',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
}));

const StyledProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
}));

const MessageContainer = styled(Box)(({ theme, isUser }) => ({
  display: 'flex',
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  marginBottom: theme.spacing(2),
}));

const Message = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  maxWidth: '70%',
  wordWrap: 'break-word',
  backgroundColor: isUser ? theme.palette.primary.light : '#e0e0e0',
  color: isUser ? '#fff' : '#000',
}));

// Mapea nombres de habilidades a iconos SVG
const getSkillIcon = (skillName) => {
  const icons = {
    'python': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 15.5H8a1.5 1.5 0 0 1-1.5-1.5V10h4.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5zm5.5-1.5V10h-4.5a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5H16a1.5 1.5 0 0 1 1.5 1.5v4.5z"/></svg>`,
    'javascript': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.321 15.935a.5.5 0 0 1-.555-.224l-.195-.45a.5.5 0 0 1 .8-.432l.142.33a.5.5 0 0 0 .894-.286l-.558-2.61a.5.5 0 0 1 .982-.21l.558 2.61a1.5 1.5 0 0 1-2.658.592zM12.981 12.029a.5.5 0 0 1-.84-.53l.366-1.125a.5.5 0 0 1 .98-.316l-.366 1.125a.5.5 0 0 1-.14.286zM11.5 7h1.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5zm2.5 0h1.5a.5.5 0 0 1 .5.5v2.5a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-2.5a.5.5 0 0 1 .5-.5z"/></svg>`,
    'react': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 2.5a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0v-4zm0 15a.5.5 0 0 1 1 0v4a.5.5 0 0 1-1 0v-4zm-4-4a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1h-4zm12 0a.5.5 0 0 1 0-1h4a.5.5 0 0 1 0 1h-4zM6.5 6.5a.5.5 0 0 1-.354-.854l2.5-2.5a.5.5 0 0 1 .708.708l-2.5 2.5a.5.5 0 0 1-.354-.154zM16.5 16.5a.5.5 0 0 1-.354-.854l2.5-2.5a.5.5 0 0 1 .708.708l-2.5 2.5a.5.5 0 0 1-.354-.154z"/></svg>`,
    'default': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0-4a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1z"/></svg>`,
  };
  return icons[skillName.toLowerCase()] || icons['default'];
};


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


// Componentes de la vista
const HomeView = ({ setView, profileData }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Bienvenido a mi CV Interactivo 
      </Typography>
      <Typography variant="h6" align="center" paragraph>
        Explora mi CV y tambien puedes dialogar con mi chat
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Skills
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mira un resumen de tus habilidades.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
              <StyledButton onClick={() => setView('skills')} variant="contained">
                Ver Habilidades
              </StyledButton>
            </CardActions>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Experiencia Laboral
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detalles de tu trayectoria profesional.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
              <StyledButton onClick={() => setView('experience')} variant="contained">
                Ver Experiencia
              </StyledButton>
            </CardActions>
          </StyledCard>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Haz preguntas para saber mas en el ambito laboral.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'center' }}>
              <StyledButton onClick={() => setView('chat')} variant="contained">
                Ir al Chat
              </StyledButton>
            </CardActions>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

const SkillsView = ({ skills, setView }) => {
  const [filterQuery, setFilterQuery] = useState('');
  // Filtra las habilidades en función del texto de búsqueda
  const filteredSkills = skills.filter(skill =>
    skill.skill.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Skills
      </Typography>
      <StyledButton onClick={() => setView('home')} variant="outlined">
        Volver
      </StyledButton>
      {/* Campo de búsqueda */}
      <TextField
        fullWidth
        variant="outlined"
        label="Buscar habilidad..."
        value={filterQuery}
        onChange={(e) => setFilterQuery(e.target.value)}
        sx={{ mt: 2, mb: 2 }}
      />
      <Box sx={{ mt: 4 }}>
        {filteredSkills.length > 0 ? (
          filteredSkills.map((skill, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
               <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  {/* Icono de la habilidad */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }} dangerouslySetInnerHTML={{ __html: getSkillIcon(skill.skill) }} />
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" gutterBottom>{skill.skill}</Typography>
                  <StyledProgress variant="determinate" value={skill.level} />
                </Grid>
                <Grid item>
                  <Typography variant="body2" color="text.secondary" align="right">{skill.level}%</Typography>
                </Grid>
              </Grid>
            </Paper>
          ))
        ) : (
          <Typography variant="body1" align="center" color="text.secondary">
            No se encontraron habilidades.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ExperienceView = ({ experience, setView }) => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Experiencia Laboral
      </Typography>
      <StyledButton onClick={() => setView('home')} variant="outlined">
        Volver
      </StyledButton>
      <Box sx={{ mt: 4 }}>
        {experience.length > 0 ? (
          experience.map((job, index) => (
            <StyledCard key={index} sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {job.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  {job.company} | {job.period}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {job.description}
                </Typography>
              </CardContent>
            </StyledCard>
          ))
        ) : (
          <Typography variant="body1" align="center" color="text.secondary">
            No se encontró experiencia laboral.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const ChatView = ({ chatMessages, handleChatSubmit, setView }) => {
  const [inputMessage, setInputMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      handleChatSubmit(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom align="center">
        Chat Profesional
      </Typography>
      <StyledButton onClick={() => setView('home')} variant="outlined">
        Volver
      </StyledButton>
      <Box
        sx={{
          mt: 4,
          height: '60vh',
          overflowY: 'auto',
          p: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        {chatMessages.map((msg, index) => (
          <MessageContainer key={index} isUser={msg.sender === 'user'}>
            <Message isUser={msg.sender === 'user'}>
              <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
            </Message>
          </MessageContainer>
        ))}
      </Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Haz una pregunta sobre el cv..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          sx={{ mr: 1 }}
        />
        <Button variant="contained" type="submit" sx={{ minWidth: '120px' }}>
          Enviar
        </Button>
      </Box>
    </Box>
  );
};

// Componente principal de la aplicación
const App = () => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ skills: [], experience: [], projects: [] });
  const [view, setView] = useState('home');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/get_cv_data`);
        if (!response.ok) {
          throw new Error('Error al obtener los datos del CV');
        }
        const data = await response.json();
        setProfileData(data.profile_data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleChatSubmit = async (query) => {
    const userMessage = { sender: 'user', text: query };
    setChatMessages((prevMessages) => [...prevMessages, userMessage]);
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      const botMessage = { sender: 'bot', text: data.response };
      setChatMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (view) {
      case 'home':
        return <HomeView setView={setView} />;
      case 'skills':
        return <SkillsView skills={profileData.skills} setView={setView} />;
      case 'experience':
        return <ExperienceView experience={profileData.experience} setView={setView} />;
      case 'chat':
        return <ChatView chatMessages={chatMessages} handleChatSubmit={handleChatSubmit} setView={setView} />;
      default:
        return <HomeView setView={setView} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container>
        <StyledPaper elevation={3}>
          {renderView()}
        </StyledPaper>
      </Container>
    </ThemeProvider>
  );
};

export default App;
// Renderiza la aplicación en el DOM
/*const rootElement = document.createElement('div');
document.body.appendChild(rootElement);
ReactDOM.render(<App />, rootElement);*/
