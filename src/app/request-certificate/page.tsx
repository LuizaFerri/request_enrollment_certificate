'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TurmaSelector from '@/components/TurmaSelector';
import { Turma, DocumentStatus, CertificateRequestData } from '@/lib/types';

function RequestCertificateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [studentInfo, setStudentInfo] = useState<{
    id: number;
    name: string;
    fullName: string;
    email: string;
    course: string;
    cpf: string;
    rg: string;
    phone: string;
  } | null>(null);
  
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [docsChecked, setDocsChecked] = useState(false);

  // Campos do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    rg: '',
    cpf: '',
    purpose: '',
    additionalNotes: ''
  });

  const checkDocumentsStatus = useCallback(async () => {
    if (!email || !selectedTurma) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/check-documents-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          enrollment_id: selectedTurma.enrollment_id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar documentos');
      }
      
      setDocumentStatus(data.documentStatus);
      setDocsChecked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar status dos documentos');
    } finally {
      setIsLoading(false);
    }
  }, [email, selectedTurma]);

  useEffect(() => {
    if (!email) {
      router.push('/');
      return;
    }

    const verifyEmail = async () => {
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

        if (!data.isEnrolled) {
          router.push('/');
          return;
        }

        setStudentInfo(data.studentInfo);
        
        setFormData({
          fullName: data.studentInfo.fullName,
          phoneNumber: data.studentInfo.phone,
          rg: data.studentInfo.rg,
          cpf: data.studentInfo.cpf,
          purpose: '',
          additionalNotes: ''
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar informações do aluno');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [email, router]);

  useEffect(() => {
    if (email && selectedTurma && !docsChecked) {
      checkDocumentsStatus();
    }
  }, [email, selectedTurma, docsChecked, checkDocumentsStatus]);

  const handleTurmaSelect = (turma: Turma) => {
    setSelectedTurma(turma);
    setDocsChecked(false);
    setDocumentStatus(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRequestCertificate = async () => {
    if (!selectedTurma) {
      setError('Por favor, selecione uma turma');
      return;
    }

    if (!docsChecked) {
      await checkDocumentsStatus();
      return;
    }

    if (documentStatus && !documentStatus.isApproved) {
      return;
    }

    // Validar campos obrigatórios
    if (!formData.fullName || !formData.phoneNumber || !formData.rg || 
        !formData.cpf || !formData.purpose) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      const requestData: CertificateRequestData = {
        studentId: studentInfo!.id,
        email: email!,
        turmaId: selectedTurma.id,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        rg: formData.rg,
        cpf: formData.cpf,
        purpose: formData.purpose,
        additionalNotes: formData.additionalNotes,
        course: selectedTurma.course,
        turma: selectedTurma.name,
        requestDate: new Date(),
        turmaInfo: {
          periodo: selectedTurma.periodo,
          data_inicio: selectedTurma.data_inicio,
          duracao_meses: selectedTurma.duracao_meses
        }
      };

      const response = await fetch('/api/request-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar certificado');
      }
      
      setRequestSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao solicitar certificado');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDocumentStatusMessage = () => {
    if (!documentStatus) return null;

    if (documentStatus.isApproved) {
      return (
        <div className="document-status-ok">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>Todos os seus documentos foram aprovados! Você pode solicitar a declaração.</p>
        </div>
      );
    }

    const messages = [];

    if (documentStatus.hasRejected) {
      messages.push(
        <div key="rejected" className="document-status-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <div>
            <p>Você possui documentos reprovados. Por favor, regularize no portal do aluno:</p>
            <ul>
              {documentStatus.rejectedDocs.map((doc, i) => <li key={i}>{doc}</li>)}
            </ul>
          </div>
        </div>
      );
    }

    if (documentStatus.hasPending) {
      messages.push(
        <div key="pending" className="document-status-warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <p>Você possui documentos pendentes de análise pela secretaria:</p>
            <ul>
              {documentStatus.pendingDocs.map((doc, i) => <li key={i}>{doc}</li>)}
            </ul>
          </div>
        </div>
      );
    }

    if (documentStatus.missingDocs.length > 0) {
      messages.push(
        <div key="missing" className="document-status-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <p>Você possui documentos pendentes de envio:</p>
            <ul>
              {documentStatus.missingDocs.map((doc, i) => <li key={i}>{doc}</li>)}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="document-status">
        {messages}
      </div>
    );
  };

  if (isLoading && !studentInfo) {
    return (
      <div className="container">
        <div className="card request-card">
          <div className="loading">Carregando informações...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card request-card">
          <div className="error-message">{error}</div>
          <Link href="/" className="back-link">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="container">
        <div className="card request-card">
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2>Solicitação Enviada!</h2>
            <p>Sua declaração de matrícula foi solicitada com sucesso.</p>
            <p>Um e-mail será enviado para <strong>{email}</strong> quando o documento estiver pronto.</p>
            <div className="details">
              <p><strong>Finalidade:</strong> {formData.purpose}</p>
              <p><strong>Curso:</strong> {selectedTurma?.course}</p>
              <p><strong>Turma:</strong> {selectedTurma?.name}</p>
            </div>
          </div>
          <Link href="/" className="button">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card request-card">
        <h1>Solicitar Declaração de Matrícula</h1>
        
        {studentInfo && (
          <div className="info-card">
            <h3>Dados do Aluno</h3>
            <div className="info-row">
              <span className="info-label">Nome:</span>
              <span className="info-value">{studentInfo.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">E-mail:</span>
              <span className="info-value">{email}</span>
            </div>
          </div>
        )}
        
        {email && (
          <div className="turma-selection">
            <h3>Selecione seu curso e turma atual</h3>
            <TurmaSelector 
              email={email} 
              onTurmaSelect={handleTurmaSelect} 
              selectedTurmaId={selectedTurma?.id || null} 
            />
          </div>
        )}
        
        {selectedTurma && renderDocumentStatusMessage()}
        
        {documentStatus && documentStatus.isApproved && (
          <div className="certificate-form">
            <h3>Informações para a Declaração</h3>
            <div className="form-group">
              <label htmlFor="fullName">Nome Completo:</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Telefone:</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rg">RG:</label>
                <input
                  type="text"
                  id="rg"
                  name="rg"
                  value={formData.rg}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cpf">CPF:</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="purpose">Para qual finalidade você está solicitando a declaração?</label>
              <input
                type="text"
                id="purpose"
                name="purpose"
                placeholder="Ex: Comprovação no trabalho, registro profissional, etc."
                value={formData.purpose}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalNotes">Observações adicionais que precisam constar na declaração (opcional):</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                rows={3}
                value={formData.additionalNotes}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>
        )}
        
        <div className="action-section">
          <h2>Confirmar Solicitação</h2>
          <p>Ao clicar no botão abaixo, você está solicitando sua declaração de matrícula para a turma selecionada.</p>
          
          {selectedTurma && (
            <div className="selected-details">
              <p><strong>Curso:</strong> {selectedTurma.course}</p>
              <p><strong>Turma:</strong> {selectedTurma.name}</p>
            </div>
          )}
          
          <button 
            onClick={handleRequestCertificate}
            disabled={
              isLoading || 
              !selectedTurma || 
              (documentStatus ? !documentStatus.isApproved : false) ||
              (!formData.fullName || !formData.phoneNumber || !formData.rg || 
              !formData.cpf || !formData.purpose)
            }
            className="request-button"
          >
            {isLoading ? 'Processando...' : 'Solicitar Declaração'}
          </button>
          
          {documentStatus && !documentStatus.isApproved && (
            <p className="tip-message">
              Você precisa regularizar sua situação documental antes de solicitar a declaração.
            </p>
          )}
          
          {documentStatus && documentStatus.isApproved && (
            !formData.fullName || !formData.phoneNumber || !formData.rg || 
            !formData.cpf || !formData.purpose
          ) && (
            <p className="tip-message">
              Preencha todos os campos obrigatórios para continuar.
            </p>
          )}
        </div>
        
        <Link href="/" className="back-link">Voltar para o início</Link>
      </div>
    </div>
  );
}

export default function RequestCertificate() {
  return (
    <Suspense fallback={<div className="section-loading">Carregando...</div>}>
      <RequestCertificateContent />
    </Suspense>
  );
} 