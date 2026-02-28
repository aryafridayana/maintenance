import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateCargoLiftPDF(report, signatures) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const data = typeof report.checklist_data === 'string' ? JSON.parse(report.checklist_data) : report.checklist_data;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN SERVICE MAINTENANCE', pageWidth / 2, 20, { align: 'center' });
    doc.text('CARGO LIFT', pageWidth / 2, 27, { align: 'center' });

    // Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoX = pageWidth - 15;
    doc.text('Tgl : ' + new Date(report.completed_at).toLocaleDateString('id-ID'), infoX, 20, { align: 'right' });
    doc.text('Merk : ' + (report.merk || '-'), infoX, 26, { align: 'right' });
    doc.text('Type : ' + (report.model || '-'), infoX, 32, { align: 'right' });

    doc.text('CABANG : ' + (data.cabang || report.cabang || '-'), 15, 38);

    let yPos = 44;

    // Checklist sections
    if (data.sections) {
        const tableData = [];

        data.sections.forEach(section => {
            tableData.push([{
                content: section.num + '. ' + section.name,
                colSpan: 6,
                styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
            }]);

            section.items.forEach(item => {
                tableData.push([
                    '   - ' + item.name,
                    item.condition === 'X' ? 'X' : '',
                    item.condition === 'O' ? 'O' : '',
                    item.condition === '#' ? '#' : '',
                    item.condition === 'V' ? 'V' : '',
                    item.note || ''
                ]);
            });
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Uraian Pekerjaan', 'X', 'O', '#', 'V', 'Keterangan']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontSize: 9, halign: 'center' },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 12, halign: 'center' },
                2: { cellWidth: 12, halign: 'center' },
                3: { cellWidth: 12, halign: 'center' },
                4: { cellWidth: 12, halign: 'center' },
                5: { cellWidth: 'auto' },
            },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 15, right: 15 },
        });

        yPos = doc.lastAutoTable.finalY + 8;
    }

    // Legend
    doc.setFontSize(8);
    doc.text('Note :   X : Rusak    O : Ganti    # : Adjust / Setel    V : Baik', 15, yPos);
    yPos += 8;

    // Remarks
    if (report.remarks) {
        doc.setFontSize(9);
        doc.text('Catatan: ' + report.remarks, 15, yPos);
        yPos += 10;
    }

    // Signatures
    if (yPos + 50 > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        yPos = 20;
    }

    yPos += 10;
    const leftCol = pageWidth / 4;
    const rightCol = (3 * pageWidth) / 4;
    const sigImgW = 50;
    const sigImgH = 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Yang Mengerjakan :', leftCol, yPos, { align: 'center' });
    doc.text('Mengetahui,', rightCol, yPos, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    // Embed teknisi signature (centered on left column)
    if (signatures?.teknisi?.image) {
        try { doc.addImage(signatures.teknisi.image, 'PNG', leftCol - sigImgW / 2, yPos + 3, sigImgW, sigImgH); } catch (e) { }
    }
    // Embed client/manager signature (centered on right column)
    if (signatures?.client?.image) {
        try { doc.addImage(signatures.client.image, 'PNG', rightCol - sigImgW / 2, yPos + 3, sigImgW, sigImgH); } catch (e) { }
    }

    yPos += 24;
    doc.text('________________________', leftCol, yPos, { align: 'center' });
    doc.text('________________________', rightCol, yPos, { align: 'center' });
    yPos += 5;
    doc.setFontSize(9);
    const teknisiLabel = signatures?.teknisi?.name || 'Teknisi';
    const clientLabel = signatures?.client?.name || 'Manager Cabang';
    doc.text(teknisiLabel, leftCol, yPos, { align: 'center' });
    doc.text(clientLabel, rightCol, yPos, { align: 'center' });

    return doc;
}

