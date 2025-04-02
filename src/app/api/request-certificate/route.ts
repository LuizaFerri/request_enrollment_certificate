import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CertificateRequestData } from "@/lib/types";
import nodemailer from "nodemailer";

const EMAIL_TO = "luiza@ceconte.com.br";
const EMAIL_USER = "suporte-ti@ceconte.com.br";
const EMAIL_PASSWORD = "rhjs pcks kcxb hwxj";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const requestData: CertificateRequestData = await request.json();
    const {
      studentId,
      email,
      turmaId,
      fullName,
      phoneNumber,
      rg,
      cpf,
      purpose,
      courseModality,
      additionalNotes,
      course,
      turma,
      turmaInfo,
    } = requestData;

    if (!studentId || !email || !turmaId) {
      return NextResponse.json(
        { error: "Dados incompletos para a solicitação" },
        { status: 400 }
      );
    }

    const verifyEnrollment = await query(
      `SELECT 
         r.id
       FROM 
         register r
       JOIN 
         enrollment e ON e.id = r.enrollment
       WHERE 
         r.turma = $1
         AND e.email = $2
         AND r.is_student = true
         AND r.cancelled = false
         AND r.deleted_at IS NULL`,
      [turmaId, email]
    );

    if (verifyEnrollment.rows.length === 0) {
      return NextResponse.json(
        { error: "Aluno não está matriculado na turma selecionada" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO certificate_requests (
         student_id, 
         email, 
         turma_id, 
         full_name,
         phone_number,
         rg,
         cpf,
         purpose,
         course_modality,
         additional_notes,
         request_date, 
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'pending')
       RETURNING id`,
      [
        studentId,
        email,
        turmaId,
        fullName,
        phoneNumber,
        rg,
        cpf,
        purpose,
        courseModality,
        additionalNotes || "",
      ]
    );

    const requestId = result.rows[0].id;

    const enrollmentResult = await query(
      `SELECT e.id 
       FROM enrollment e
       JOIN register r ON r.enrollment = e.id
       WHERE r.turma = $1 AND e.email = $2 LIMIT 1`,
      [turmaId, email]
    );

    const enrollmentId =
      enrollmentResult.rows.length > 0 ? enrollmentResult.rows[0].id : null;

    await sendEmailToSecretary({
      requestId,
      studentId,
      email,
      fullName,
      phoneNumber,
      rg,
      cpf,
      purpose,
      courseModality,
      additionalNotes: additionalNotes || "",
      course,
      turma,
      turmaId,
      enrollmentId,
      fetchAttachments: true,
      turmaInfo,
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: "Solicitação de declaração de matrícula enviada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao solicitar declaração:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

interface EmailData {
  requestId: number;
  studentId: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  rg: string;
  cpf: string;
  purpose: string;
  courseModality: string;
  additionalNotes: string;
  course: string;
  turma: string;
  turmaId: number;
  enrollmentId?: number | null;
  fetchAttachments?: boolean;
  turmaInfo?: {
    periodo?: string;
    data_inicio?: Date;
    duracao_meses?: number;
    ciclo?: {
      data_inicio: Date;
      duracao_meses: number;
      primeira_turma: string;
    };
  };
}

async function sendEmailToSecretary(data: EmailData): Promise<boolean> {
  let documentLinks = "";

  if (data.fetchAttachments && data.enrollmentId) {
    try {
      const documentos = await query(
        `SELECT ds.url, tds.description
         FROM documents_students ds
         JOIN type_documents_students tds ON tds.id = ds.type_id
         WHERE ds.enrollment_id = $1 AND ds.status_id = 1`,
        [data.enrollmentId]
      );

      if (documentos.rows.length > 0) {
        documentLinks = "\nDocumentos do aluno (links):\n";
        documentos.rows.forEach((doc) => {
          if (doc.url) {
            const driveURL = `https://drive.google.com/file/d/${doc.url}/view`;
            documentLinks += `- ${doc.description}: ${driveURL}\n`;
          }
        });
      }
    } catch (err) {
      console.error("Erro ao buscar documentos:", err);
    }
  }

  const emailContent = `
    <h2>Nova solicitação de declaração de matrícula</h2>
    <p>Prezados,</p>
    <p>Solicitamos a emissão de declaração de matrícula para o(a) aluno(a) com os seguintes dados:</p>
    <ul>
      <li><strong>Nome Completo:</strong> ${data.fullName}</li>
      <li><strong>E-mail:</strong> ${data.email}</li>
      <li><strong>Telefone:</strong> ${data.phoneNumber}</li>
      <li><strong>RG:</strong> ${data.rg}</li>
      <li><strong>CPF:</strong> ${data.cpf}</li>
      <li><strong>Curso:</strong> ${data.course}</li>
      <li><strong>Turma:</strong> ${data.turma}</li>
      <li><strong>Período:</strong> ${data.turmaInfo?.periodo}º Semestre</li>
      <li><strong>Duração:</strong> ${data.turmaInfo?.duracao_meses} meses</li>
      <li><strong>Início da Turma:</strong> ${
        data.turmaInfo?.data_inicio
          ? new Date(data.turmaInfo.data_inicio).toLocaleDateString("pt-BR")
          : ""
      }</li>
      <li><strong>Finalidade:</strong> ${data.purpose}</li>
      ${
        data.additionalNotes
          ? `<li><strong>Observações:</strong> ${data.additionalNotes}</li>`
          : ""
      }
    </ul>
    ${
      documentLinks
        ? `
    <p>Links dos documentos do aluno:</p>
    <pre>${documentLinks}</pre>
    `
        : ""
    }
    <p>Atenciosamente,<br>Secretaria Acadêmica CECONTE</p>
  `;

  const emailHTML = emailContent.replace(/\n/g, "<br>");

  try {
    const mailOptions = {
      from: `"Secretaria CECONTE" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: `Solicitação de Declaração de Matrícula - ${data.fullName}`,
      text: emailContent,
      html: emailHTML,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email enviado: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return true;
  }
}
