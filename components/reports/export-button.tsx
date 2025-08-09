import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  data: any[];
  filename: string;
  reportTitle: string;
  elementId?: string;
}

export function ExportButton({ data, filename, reportTitle, elementId }: ExportButtonProps) {
  
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error("Nenhum dado disponível para exportação");
      return;
    }

    try {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Tratar valores que podem conter vírgulas
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success("Arquivo CSV exportado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error("Erro ao exportar arquivo CSV");
    }
  };

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF();
      
      // Título do relatório
      pdf.setFontSize(16);
      pdf.text(reportTitle, 20, 20);
      
      // Data de geração
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);

      // Se há um elemento específico para capturar (gráficos)
      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
        }
      } else {
        // Exportar dados tabulares
        let yPosition = 50;
        
        if (data && data.length > 0) {
          const headers = Object.keys(data[0]);
          
          // Cabeçalhos
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          headers.forEach((header, index) => {
            pdf.text(header, 20 + (index * 35), yPosition);
          });
          
          yPosition += 10;
          pdf.setFont(undefined, 'normal');
          pdf.setFontSize(10);
          
          // Dados (limitado para caber na página)
          data.slice(0, 30).forEach((row, rowIndex) => {
            headers.forEach((header, colIndex) => {
              const value = String(row[header] || '');
              pdf.text(value.substring(0, 15), 20 + (colIndex * 35), yPosition);
            });
            yPosition += 8;
            
            // Nova página se necessário
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
          });
          
          if (data.length > 30) {
            pdf.text(`... e mais ${data.length - 30} registros`, 20, yPosition + 10);
          }
        }
      }

      pdf.save(`${filename}.pdf`);
      toast.success("Arquivo PDF exportado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error("Erro ao exportar arquivo PDF");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}