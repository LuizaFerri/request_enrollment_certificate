'use client';

import { useState, useEffect } from 'react';
import { Turma } from '@/lib/types';

interface TurmaSelectorProps {
  email: string;
  onTurmaSelect: (turma: Turma) => void;
  selectedTurmaId: number | null;
}

export default function TurmaSelector({ email, onTurmaSelect, selectedTurmaId }: TurmaSelectorProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<string[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredTurmas = selectedCurso 
    ? turmas.filter(turma => turma.course === selectedCurso)
    : turmas;

  const uniqueTurmas = filteredTurmas.reduce((acc: Turma[], current) => {
    const x = acc.find(item => item.name === current.name);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  useEffect(() => {
    const fetchTurmas = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/get-turmas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao buscar turmas');
        }

        setTurmas(data.turmas);
        
        const uniqueCursos = [...new Set(data.turmas.map((turma: Turma) => turma.course))] as string[];
        setCursos(uniqueCursos);
        
        if (uniqueCursos.length === 1) {
          setSelectedCurso(uniqueCursos[0] as string);
        }
        
        if (data.turmas.length === 1 && !selectedTurmaId) {
          onTurmaSelect(data.turmas[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar turmas');
      } finally {
        setIsLoading(false);
      }
    };

    if (email) {
      fetchTurmas();
    }
  }, [email, onTurmaSelect, selectedTurmaId]);

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const curso = e.target.value;
    setSelectedCurso(curso);
    
    if (selectedTurmaId) {
      onTurmaSelect(null as unknown as Turma);
    }
  };

  const handleTurmaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selectedTurma = turmas.find(turma => turma.id === selectedId);
    if (selectedTurma) {
      onTurmaSelect(selectedTurma);
    }
  };

  if (isLoading) {
    return <div className="section-loading">Carregando turmas...</div>;
  }

  if (error) {
    return <div className="section-error">{error}</div>;
  }

  if (turmas.length === 0) {
    return <div className="section-empty">Nenhuma turma encontrada para este e-mail.</div>;
  }

  if (turmas.length === 1 && selectedTurmaId === turmas[0].id) {
    return (
      <div>
        <div className="form-group">
          <label>Curso:</label>
          <div className="single-turma">{turmas[0].course}</div>
        </div>
        <div className="form-group">
          <label>Turma:</label>
          <div className="single-turma">{turmas[0].name}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="form-group">
        <label htmlFor="curso">Selecione o curso:</label>
        <select 
          id="curso" 
          value={selectedCurso} 
          onChange={handleCursoChange}
          required
        >
          <option value="">-- Selecione um curso --</option>
          {cursos.map(curso => (
            <option key={curso} value={curso}>
              {curso}
            </option>
          ))}
        </select>
      </div>

      {selectedCurso && (
        <div className="form-group">
          <label htmlFor="turma">Selecione a turma:</label>
          <select 
            id="turma" 
            value={selectedTurmaId || ''} 
            onChange={handleTurmaChange}
            required
          >
            <option value="">-- Selecione uma turma --</option>
            {uniqueTurmas.map(turma => (
              <option key={turma.id} value={turma.id}>
                {turma.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
} 