import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateElevatorPDF(report, signatures) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const data = typeof report.checklist_data === 'string' ? JSON.parse(report.checklist_data) : report.checklist_data;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MAINTENANCE SERVICE REPORT', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('ELEVATORS', pageWidth / 2, 27, { align: 'center' });

    // Horizontal line
    doc.setDrawColor(180, 180, 180);
    doc.line(15, 30, pageWidth - 15, 30);

    // Info fields - left side
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Name of Building', 15, 37);
    doc.text(': ' + (data.building || report.location || '-'), 55, 37);
    doc.text('Elevator No.', 15, 43);
    doc.text(': ' + (data.elevatorNo || report.lift_name || '-'), 55, 43);
    doc.text('Date Service', 15, 49);
    doc.text(': ' + new Date(report.completed_at).toLocaleDateString('id-ID'), 55, 49);

    // Info fields - right side
    doc.text('Checked By', pageWidth / 2 + 10, 37);
    doc.text(': ' + (data.checkedBy || '________________________'), pageWidth / 2 + 40, 37);

    let yPos = 56;

    // Condition symbol mapping (Unicode -> ASCII safe for PDF)
    const conditionMap = {
        '\u2713': 'OK', '✓': 'OK',
        '\u25B3': 'ADJ', '△': 'ADJ',
        '\u2715': 'REP', '✕': 'REP',
        '\u25CB': 'SVC', '○': 'SVC',
        '/': 'N/A',
    };
    const safeCondition = (c) => conditionMap[c] || c || '-';

    // Build single table with ALL sections
    if (data.sections && data.sections.length > 0) {
        const tableBody = [];

        data.sections.forEach(section => {
            // Section header row
            tableBody.push([{
                content: (section.code || section.num || '') + '.  ' + section.name,
                colSpan: 4,
                styles: {
                    fontStyle: 'bold',
                    fillColor: [230, 235, 245],
                    textColor: [30, 40, 80],
                    fontSize: 9
                }
            }]);

            // Item rows
            section.items.forEach((item, idx) => {
                tableBody.push([
                    String(idx + 1),
                    item.name || '',
                    safeCondition(item.condition),
                    item.note || ''
                ]);
            });
        });

        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Description / Item', 'Status', 'Note']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [50, 80, 150],
                textColor: [255, 255, 255],
                fontSize: 9,
                halign: 'center',
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center', fontSize: 8 },
                1: { cellWidth: 'auto', fontSize: 8 },
                2: { cellWidth: 18, halign: 'center', fontSize: 8, fontStyle: 'bold' },
                3: { cellWidth: 40, fontSize: 8 },
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [200, 200, 200],
                lineWidth: 0.3,
            },
            alternateRowStyles: {
                fillColor: [248, 249, 252]
            },
            margin: { left: 15, right: 15 },
        });

        yPos = doc.lastAutoTable.finalY + 8;
    }

    // Check if we need a new page for footer content
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPos = 20;
    }

    // Working Remarks legend
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Working Remarks :', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');

    const legendData = [
        ['OK = Normal', 'SVC = Serviced, Replaced, Lubricated & Cleaned'],
        ['ADJ = To be Adjusted, Replaced, Lubricated', 'N/A = Not Applicable'],
        ['REP = To be Repaired or Overhauled', ''],
    ];

    autoTable(doc, {
        startY: yPos,
        body: legendData,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: {
            0: { cellWidth: (pageWidth - 30) / 2 },
            1: { cellWidth: (pageWidth - 30) / 2 },
        },
        margin: { left: 15, right: 15 },
    });

    yPos = doc.lastAutoTable.finalY + 5;

    // Temperature & Voltage
    if (report.temperature || report.voltage) {
        doc.setFontSize(9);
        doc.text('Temperature : ' + (report.temperature || '-') + ' C', 15, yPos);
        doc.text('Power Line Voltage : ' + (report.voltage || '-') + ' V', pageWidth / 2, yPos);
        yPos += 8;
    }

    // Mechanics
    if (data.mechanics && data.mechanics.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Mechanics :', 15, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        data.mechanics.forEach((m, i) => {
            doc.text((i + 1) + '. ' + m, 20, yPos);
            yPos += 5;
        });
        yPos += 3;
    }

    // Remarks
    if (report.remarks) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Remarks :', 15, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(report.remarks, 35, yPos, { maxWidth: pageWidth - 50 });
        yPos += 10;
    }

    // Signatures
    if (yPos + 40 > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        yPos = 20;
    }

    const leftCol = pageWidth / 4;
    const rightCol = (3 * pageWidth) / 4;
    const sigImgW = 50;
    const sigImgH = 18;
    const sigY = yPos + 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Yang Mengerjakan', leftCol, sigY, { align: 'center' });
    doc.text('Mengetahui,', rightCol, sigY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    // Embed teknisi signature (centered on left column)
    if (signatures?.teknisi?.image) {
        try { doc.addImage(signatures.teknisi.image, 'PNG', leftCol - sigImgW / 2, sigY + 3, sigImgW, sigImgH); } catch (e) { }
    }
    // Embed client/manager signature (centered on right column)
    if (signatures?.client?.image) {
        try { doc.addImage(signatures.client.image, 'PNG', rightCol - sigImgW / 2, sigY + 3, sigImgW, sigImgH); } catch (e) { }
    }

    doc.line(leftCol - 25, sigY + 24, leftCol + 25, sigY + 24);
    doc.line(rightCol - 25, sigY + 24, rightCol + 25, sigY + 24);

    const teknisiLabel = signatures?.teknisi?.name || '(                              )';
    doc.text(teknisiLabel, leftCol, sigY + 29, { align: 'center' });

    const clientLabel = signatures?.client?.name || (data.checkedBy || '(                              )');
    doc.text(clientLabel, rightCol, sigY + 29, { align: 'center' });

    return doc;
}

