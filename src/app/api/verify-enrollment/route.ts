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
         p.id, 
         p.first_name, 
         p.last_name,
         p.cpf,
         p.rg,
         e.course
       FROM 
         person p
       JOIN 
         enrollment e ON p.email = e.email
       WHERE 
         p.email = $1
         AND p.excluded = false
         AND e.deleted_at IS NULL
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        isEnrolled: false,
        studentInfo: null 
      });
    }

    const student = result.rows[0];
    
    return NextResponse.json({ 
      isEnrolled: true,
      studentInfo: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        fullName: `${student.first_name} ${student.last_name}`,
        email: email,
        course: student.course,
        cpf: student.cpf || '',
        rg: student.rg || '',
        phone: ''
      }
    });
  } catch (error) {
    console.error('Erro ao verificar matrícula:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 