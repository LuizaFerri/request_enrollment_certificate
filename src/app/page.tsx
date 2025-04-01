import EmailVerification from "@/components/EmailVerification";

export default function Home() {
  return (
    <main className="main">
      <div className="hero">
        <div className="hero-content">
          <h1>Sistema de Declaração de Matrícula</h1>
          <p>Solicite sua declaração de matrícula de forma rápida e fácil</p>
        </div>
      </div>
      
      <div className="container">
        <div className="verification-container">
          <EmailVerification />
          
          <div className="info-container">
            <div className="info-card">
              <h2>Como funciona</h2>
              <ol className="steps">
                <li>
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Verificação</h3>
                    <p>Digite seu e-mail cadastrado</p>
                  </div>
                </li>
                <li>
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Confirmação</h3>
                    <p>Verifique seus dados</p>
                  </div>
                </li>
                <li>
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Solicitação</h3>
                    <p>Solicite sua declaração</p>
                  </div>
                </li>
                <li>
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Recebimento</h3>
                    <p>Receba o documento por e-mail</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
