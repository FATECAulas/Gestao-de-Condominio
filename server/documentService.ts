import { PDFDocument, PDFPage, rgb } from 'pdf-lib';
import * as db from "./db";

/**
 * Serviço de geração de documentos PDF
 */

/**
 * Gera documento de reserva do salão de festas
 */
export async function generateBallroomReservationDocument(reservationId: number): Promise<Buffer> {
  const reservation = await db.getBallroomReservationById(reservationId);
  if (!reservation) throw new Error('Reserva não encontrada');

  const user = await db.getUserById(reservation.userId);
  if (!user) throw new Error('Usuário não encontrado');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Cabeçalho
  page.drawText('RESERVA DO SALÃO DE FESTAS', {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0.2, 0.4, 0.8),
  });

  page.drawText('Sistema de Gestão Condominial', {
    x: 50,
    y: height - 80,
    size: 12,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Linha divisória
  page.drawLine({
    start: { x: 50, y: height - 100 },
    end: { x: width - 50, y: height - 100 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Conteúdo
  let yPosition = height - 140;
  const lineHeight = 30;

  // Informações da reserva
  page.drawText('INFORMAÇÕES DA RESERVA', {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.4, 0.8),
  });

  yPosition -= lineHeight;
  page.drawText(`Data: ${new Date(reservation.reservationDate).toLocaleDateString('pt-BR')}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  yPosition -= lineHeight;
  page.drawText(`Horário: ${reservation.startTime} às ${reservation.endTime}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  yPosition -= lineHeight;
  page.drawText(`Descrição: ${reservation.description || 'Não especificado'}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  // Informações do responsável
  yPosition -= lineHeight * 1.5;
  page.drawText('RESPONSÁVEL PELA RESERVA', {
    x: 50,
    y: yPosition,
    size: 14,
    color: rgb(0.2, 0.4, 0.8),
  });

  yPosition -= lineHeight;
  page.drawText(`Nome: ${user.name || 'Não informado'}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  yPosition -= lineHeight;
  page.drawText(`Email: ${user.email || 'Não informado'}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  yPosition -= lineHeight;
  page.drawText(`Telefone: ${user.phone || 'Não informado'}`, {
    x: 50,
    y: yPosition,
    size: 11,
  });

  // Rodapé
  page.drawText(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, {
    x: 50,
    y: 30,
    size: 9,
    color: rgb(0.7, 0.7, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Gera relação de utensílios disponíveis na cozinha
 */
export async function generateKitchenUtensilsReport(): Promise<Buffer> {
  const utensils = await db.getAllKitchenUtensils();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // Cabeçalho
  page.drawText('RELAÇÃO DE UTENSÍLIOS - COZINHA DO SALÃO', {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0.2, 0.4, 0.8),
  });

  page.drawText('Sistema de Gestão Condominial', {
    x: 50,
    y: height - 80,
    size: 12,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Linha divisória
  page.drawLine({
    start: { x: 50, y: height - 100 },
    end: { x: width - 50, y: height - 100 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  // Cabeçalho da tabela
  let yPosition = height - 140;
  const colWidths = [250, 80, 150];
  const headers = ['Utensílio', 'Quantidade', 'Estado'];

  headers.forEach((header, index) => {
    const x = 50 + colWidths.slice(0, index).reduce((a, b) => a + b, 0);
    page.drawText(header, {
      x,
      y: yPosition,
      size: 11,
      color: rgb(1, 1, 1),
    });
  });

  // Fundo do cabeçalho
  page.drawRectangle({
    x: 50,
    y: yPosition - 5,
    width: colWidths.reduce((a, b) => a + b),
    height: 20,
    color: rgb(0.2, 0.4, 0.8),
    opacity: 0.3,
  });

  yPosition -= 40;

  // Dados da tabela
  const conditionLabels: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bom',
    fair: 'Regular',
    poor: 'Ruim',
  };

  utensils.forEach((utensil) => {
    page.drawText(utensil.name, {
      x: 50,
      y: yPosition,
      size: 10,
    });

    page.drawText(utensil.quantity.toString(), {
      x: 50 + colWidths[0],
      y: yPosition,
      size: 10,
    });

    page.drawText(conditionLabels[utensil.condition] || utensil.condition, {
      x: 50 + colWidths[0] + colWidths[1],
      y: yPosition,
      size: 10,
    });

    yPosition -= 25;

    if (yPosition < 50) {
      // Adicionar nova página se necessário
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
  });

  // Rodapé
  page.drawText(`Total de itens: ${utensils.length}`, {
    x: 50,
    y: 30,
    size: 10,
    color: rgb(0.2, 0.4, 0.8),
  });

  page.drawText(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, {
    x: 50,
    y: 15,
    size: 9,
    color: rgb(0.7, 0.7, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
