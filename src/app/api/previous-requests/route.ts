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
      `SELECT 
         cr.id, 
         t.course,
         t.name as turma,
         cr.request_date as requestDate,
         cr.status
       FROM 
         certificate_requests cr
       JOIN 
         turma t ON t.id = cr.turma_id
       JOIN 
         person p ON p.id = cr.student_id
       WHERE 
         p.email = $1
       ORDER BY 
         cr.request_date DESC
       LIMIT 10`,
      [email]
    );

    return NextResponse.json({ 
      requests: result.rows
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações anteriores:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 