import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Chip, 
  TextField, 
  Box,
  Button,
  IconButton
} from '@mui/material';
import { Search, Visibility, Edit, Delete } from '@mui/icons-material';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'incomplete' | 'complete' | 'validated';
  documentsCount: number;
  createdAt: string;
}

const StudentsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const students: Student[] = [
    { 
      id: '1', 
      firstName: 'Jean', 
      lastName: 'Dupont', 
      email: 'jean.dupont@email.com', 
      phone: '0123456789',
      status: 'complete', 
      documentsCount: 4,
      createdAt: '2024-01-01' 
    },
    { 
      id: '2', 
      firstName: 'Marie', 
      lastName: 'Martin', 
      email: 'marie.martin@email.com', 
      phone: '0987654321',
      status: 'incomplete', 
      documentsCount: 2,
      createdAt: '2024-01-02' 
    },
  ];

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'success';
      case 'complete': return 'info';
      case 'incomplete': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validé';
      case 'complete': return 'Complet';
      case 'incomplete': return 'Incomplet';
      default: return 'Inconnu';
    }
  };

  const handleViewStudent = (studentId: string) => {
    console.log('Voir élève:', studentId);
  };

  const handleEditStudent = (studentId: string) => {
    console.log('Modifier élève:', studentId);
  };

  const handleDeleteStudent = (studentId: string) => {
    console.log('Supprimer élève:', studentId);
  };

  return (
    <Box>
      <Box className="mb-4 flex gap-4 items-center">
        <TextField
          label="Rechercher un élève"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search className="mr-2" />
          }}
          className="flex-1"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.firstName} {student.lastName}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(student.status)}
                    color={getStatusColor(student.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${student.documentsCount}/4`}
                    color={student.documentsCount === 4 ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{student.createdAt}</TableCell>
                <TableCell>
                  <Box className="flex gap-1">
                    <IconButton
                      size="small"
                      onClick={() => handleViewStudent(student.id)}
                      title="Voir détails"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEditStudent(student.id)}
                      title="Modifier"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteStudent(student.id)}
                      title="Supprimer"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentsTable;
