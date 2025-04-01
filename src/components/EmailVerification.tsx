'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailVerification() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar o e-mail');
      }

      if (data.isEnrolled) {
        router.push('/request-certificate?email=' + encodeURIComponent(email));
      } else {
        setError('E-mail não encontrado ou não associado a uma matrícula ativa.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro ao verificar o e-mail');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verification-card">
      <h2>Verificação de Aluno</h2>
      <p>Digite seu e-mail cadastrado para verificarmos sua matrícula</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">E-mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu.email@exemplo.com"
            disabled={isLoading}
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="loading-text">
              <span className="loading-dots"></span>
              Verificando
            </span>
          ) : (
            'Verificar'
          )}
        </button>
      </form>
    </div>
  );
} 