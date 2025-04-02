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
        t.duracao_meses,
        t.ordem_modulo as periodo,
        t.data_inicio,
        r.enrollment as enrollment_id
      FROM turma t
      JOIN register r ON r.turma = t.id
      JOIN enrollment e ON e.id = r.enrollment
      WHERE e.email = $1
      AND t.deleted_at IS NULL
      AND r.is_student = true
      AND r.cancelled = false
      AND r.deleted_at IS NULL
      ORDER BY t.name`,
      [email]
    );

    const turmas = result.rows.map(turma => ({
      id: turma.id,
      name: turma.name,
      course: turma.course,
      enrollment_id: turma.enrollment_id,
      duracao_meses: turma.duracao_meses,
      periodo: turma.periodo?.toString(),
      data_inicio: turma.data_inicio
    }));

    return NextResponse.json({ 
      turmas: turmas
    });
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 