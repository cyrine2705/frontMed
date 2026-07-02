import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PrescriptionDetailsResponse,
  PrescriptionDoctorMetadata,
  PrescriptionPatientMetadata,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {
  private readonly pageWidth = 210;
  private readonly pageHeight = 297;
  private readonly marginX = 16;
  private readonly primaryColor: [number, number, number] = [130, 145, 58];
  private readonly softColor: [number, number, number] = [234, 238, 214];
  private readonly textColor: [number, number, number] = [35, 35, 35];
  private readonly mutedColor: [number, number, number] = [90, 90, 90];

  downloadPrescriptionPdf(prescription: PrescriptionDetailsResponse): void {
    const document = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    this.drawBackground(document);
    this.drawHeader(document, prescription.doctor, prescription.createdAt);
    this.drawPatientPanel(document, prescription.patient, prescription.id);
    this.drawPrescriptionBody(document, prescription);
    this.drawFooter(document, prescription.doctor);

    document.save(this.buildFileName(prescription));
  }

  private drawBackground(document: jsPDF): void {
    document.setFillColor(...this.softColor);
    document.ellipse(58, 4, 88, 28, 'F');

    document.setDrawColor(...this.primaryColor);
    document.setLineWidth(0.7);
    document.line(8, 8, this.pageWidth - 8, 8);
    document.line(8, this.pageHeight - 8, this.pageWidth - 8, this.pageHeight - 8);
  }

  private drawHeader(
    document: jsPDF,
    doctor: PrescriptionDoctorMetadata | undefined,
    createdAt: string
  ): void {
    const doctorName = doctor
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
      : 'Attending physician';

    document.setTextColor(...this.primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(12);
    document.text(doctorName, this.marginX, 16);

    document.setTextColor(...this.textColor);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8.5);

    const lines = [
      doctor?.specialty,
      doctor?.medicalLicenseNumber ? `Medical license: ${doctor.medicalLicenseNumber}` : undefined,
      doctor?.clinicAddress,
      doctor?.phoneNumber ? `Phone: ${doctor.phoneNumber}` : undefined,
      doctor?.email,
    ].filter((value): value is string => Boolean(value?.trim()));

    let lineY = 21;
    lines.forEach((line) => {
      document.text(line, this.marginX, lineY);
      lineY += 4.2;
    });

    document.setFont('helvetica', 'bold');
    document.setFontSize(9.5);
    document.text(
      `Tunis, on ${this.formatLongDate(createdAt)}`,
      this.pageWidth - this.marginX,
      28,
      { align: 'right' }
    );
  }

  private drawPatientPanel(
    document: jsPDF,
    patient: PrescriptionPatientMetadata | undefined,
    prescriptionId: string
  ): void {
    const panelTop = 42;
    const panelHeight = 30;

    document.setFillColor(248, 250, 244);
    document.roundedRect(this.marginX, panelTop, this.pageWidth - this.marginX * 2, panelHeight, 4, 4, 'F');

    document.setTextColor(...this.primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(10);
    document.text('Patient information', this.marginX + 4, panelTop + 6.5);

    document.setTextColor(...this.textColor);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8.5);

    const patientName = patient
      ? `${patient.firstName} ${patient.lastName}`
      : 'Not available';

    const leftColumn = [
      `Name: ${patientName}`,
      `Birth date: ${patient?.birthDate ? this.formatLongDate(patient.birthDate) : 'Not provided'}`,
      `Blood type: ${patient?.bloodType ?? 'Not provided'}`,
    ];

    const rightColumn = [
      `Email: ${patient?.email ?? 'Not provided'}`,
      `Patient ID: ${patient?.functionalId ?? patient?.id ?? 'Not provided'}`,
      `Social security number: ${patient?.socialSecurityNumber ?? 'Not provided'}`,
      `Prescription ID: ${prescriptionId}`,
    ];

    let leftY = panelTop + 12;
    leftColumn.forEach((line) => {
      document.text(line, this.marginX + 4, leftY);
      leftY += 5.2;
    });

    let rightY = panelTop + 12;
    rightColumn.forEach((line) => {
      document.text(line, this.marginX + 88, rightY);
      rightY += 5.2;
    });
  }

  private drawPrescriptionBody(document: jsPDF, prescription: PrescriptionDetailsResponse): void {
    document.setTextColor(...this.primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(11);
    document.text('Prescription', this.marginX, 86);

    autoTable(document, {
      startY: 92,
      margin: { left: this.marginX, right: this.marginX },
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        textColor: this.textColor,
        cellPadding: 3.2,
        lineColor: [215, 220, 205],
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: this.primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      head: [['Medication', 'Dosage', 'Duration']],
      body: prescription.prescriptionLines.map((line) => [
        line.medicationName || line.medicationId,
        line.dosage,
        line.duration,
      ]),
    });

    const finalTableY = (document as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 120;
    const notesTop = finalTableY + 10;

    document.setTextColor(...this.primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(10);
    document.text('Doctor notes', this.marginX, notesTop);

    document.setTextColor(...this.textColor);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);

    const notes = prescription.doctorNotes?.trim() || 'No additional clinical notes.';
    const wrappedNotes = document.splitTextToSize(notes, this.pageWidth - this.marginX * 2);
    document.text(wrappedNotes, this.marginX, notesTop + 6);
  }

  private drawFooter(document: jsPDF, doctor: PrescriptionDoctorMetadata | undefined): void {
    const footerY = this.pageHeight - 12;
    const footerParts = [
      doctor?.clinicAddress,
      doctor?.phoneNumber,
      doctor?.email,
    ].filter((value): value is string => Boolean(value?.trim()));

    document.setTextColor(...this.primaryColor);
    document.setFont('helvetica', 'bold');
    document.setFontSize(8.5);
    document.text('|', this.marginX, footerY);

    document.setTextColor(...this.mutedColor);
    document.setFont('helvetica', 'normal');
    document.setFontSize(7.5);
    document.text(footerParts.join('    |    ') || 'Medical prescription generated by MedFront', this.marginX + 4, footerY);
  }

  private buildFileName(prescription: PrescriptionDetailsResponse): string {
    const patientName = prescription.patient
      ? `${prescription.patient.firstName}-${prescription.patient.lastName}`
      : prescription.patientId;

    return `prescription-${patientName}-${this.formatCompactDate(prescription.createdAt)}.pdf`
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  private formatLongDate(value?: string): string {
    if (!value) {
      return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  private formatCompactDate(value?: string): string {
    if (!value) {
      return 'document';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'document';
    }

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
