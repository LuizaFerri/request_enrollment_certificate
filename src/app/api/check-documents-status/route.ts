import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, enrollment_id } = await request.json();

    if (!email || !enrollment_id) {
      return NextResponse.json(
        { error: 'E-mail e ID de matrícula são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT 
         ds.type_id,
         tds.description as document_name, 
         ds.status_id,
         sds.status_name as status_name
       FROM 
         enrollment e
       LEFT JOIN 
         documents_students ds ON ds.enrollment_id = e.id
       LEFT JOIN 
         type_documents_students tds ON tds.id = ds.type_id
       LEFT JOIN 
         status_documents_students sds ON sds.id = ds.status_id
       WHERE 
         e.id = $1
         AND e.email = $2
         AND e.deleted_at IS NULL`,
      [enrollment_id, email]
    );

    console.log('Documentos do usuário:', result.rows);

    const requiredDocsResult = await query(
      `SELECT 
         id, description as name 
       FROM 
         type_documents_students 
       WHERE 
         id IN (1, 2, 3, 4, 5, 6)`,
      []
    );

    console.log('Documentos requeridos:', requiredDocsResult.rows);

    const requiredDocs = requiredDocsResult.rows;
    const userDocs = result.rows;

    const APPROVED = 1;
    const PENDING = 3;
    const REJECTED = 4;

    const docsStatus = {
      isApproved: true,
      hasPending: false,
      hasRejected: false,
      missingDocs: [] as string[],
      pendingDocs: [] as string[],
      rejectedDocs: [] as string[]
    };

    requiredDocs.forEach(reqDoc => {
      const userDoc = userDocs.find(doc => doc.type_id === reqDoc.id);
      
      console.log(`Verificando documento ${reqDoc.name} (ID: ${reqDoc.id}):`, userDoc);
      
      if (!userDoc) {
        docsStatus.isApproved = false;
        docsStatus.missingDocs.push(reqDoc.name);
        console.log(`Documento faltando: ${reqDoc.name}`);
      } else if (userDoc.status_id === APPROVED) {
        console.log(`Documento aprovado: ${userDoc.document_name}`);
      } else if (userDoc.status_id === PENDING) {
        docsStatus.isApproved = false;
        docsStatus.hasPending = true;
        docsStatus.pendingDocs.push(userDoc.document_name);
        console.log(`Documento pendente: ${userDoc.document_name}`);
      } else if (userDoc.status_id === REJECTED) {
        docsStatus.isApproved = false;
        docsStatus.hasRejected = true;
        docsStatus.rejectedDocs.push(userDoc.document_name);
        console.log(`Documento reprovado: ${userDoc.document_name}`);
      }
    });

    console.log('Status final dos documentos:', docsStatus);

    return NextResponse.json({ 
      canRequest: docsStatus.isApproved,
      documentStatus: docsStatus
    });
  } catch (error) {
    console.error('Erro ao verificar status dos documentos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 