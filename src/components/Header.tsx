'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link href="/">
            <h1>Ceconte - Declaração de Matrícula</h1>
          </Link>
        </div>
        
        <nav className="nav">
          <ul>
            <li className={pathname === '/' ? 'active' : ''}>
              <Link href="/">Início</Link>
            </li>
            <li className={pathname.startsWith('/request-certificate') ? 'active' : ''}>
              <Link href="/request-certificate">Solicitar Declaração</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
} 