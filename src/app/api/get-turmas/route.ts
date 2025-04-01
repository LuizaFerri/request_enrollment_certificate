import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT DISTINCT
         t.id, 
         t.name, 
         t.course, 
         r.enrollment as enrollment_id
       FROM 
         turma t
       JOIN 
         register r ON r.turma = t.id
       JOIN 
         enrollment e ON e.id = r.enrollment
       JOIN 
         person p ON p.email = e.email
       WHERE 
         p.email = $1 
         AND p.excluded = false 
         AND r.is_student = true
         AND r.cancelled = false
         AND r.deleted_at IS NULL
         AND e.deleted_at IS NULL 
         AND t.deleted_at IS NULL
         AND (t.name LIKE '%2025%' OR t.course LIKE '%2025%')
       ORDER BY 
         t.course ASC, t.name ASC`,
      [email]
    );

    return NextResponse.json({ 
      turmas: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 