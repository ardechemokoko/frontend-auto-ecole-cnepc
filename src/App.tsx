import { useState } from 'react'
import { Button, Container, Typography, Box } from '@mui/material'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Box className="flex items-center gap-4">
          <DirectionsCarIcon sx={{ fontSize: 60, color: '#50C786' }} />
          <Typography variant="h2" component="h1" className="text-gray-800">
            DGTT Auto-École
          </Typography>
        </Box>
        
        <Typography variant="h5" className="text-gray-600">
          Application de gestion d'auto-école
        </Typography>

        <Box className="flex flex-col items-center gap-4 mt-8">
          <Button
            variant="contained"
            size="large"
            onClick={() => setCount((count) => count + 1)}
            sx={{
              backgroundColor: '#50C786',
              '&:hover': {
                backgroundColor: '#40B676',
              },
            }}
          >
            Compteur: {count}
          </Button>
          
          <Typography className="text-gray-500">
            Modifiez <code className="bg-gray-100 px-2 py-1 rounded">src/App.tsx</code> et sauvegardez pour voir les changements
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}

export default App

