import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFExportOptions {
  filename?: string;
  quality?: number;
}

export async function exportReportToPDF(
  reportElementId: string,
  overviewElementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `report-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.98,
  } = options;

  try {
    // Get the report and overview elements
    const reportElement = document.getElementById(reportElementId);
    const overviewElement = document.getElementById(overviewElementId);

    if (!reportElement) {
      throw new Error(`Report element with id "${reportElementId}" not found`);
    }

    if (!overviewElement) {
      throw new Error(`Overview element with id "${overviewElementId}" not found`);
    }

    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15; // Increased margin for better spacing
    const contentWidth = pageWidth - 2 * margin;
    const sectionSpacing = 20; // Additional spacing between sections

    // PAGE 1: Main Report Content (Detailed Tables, Breakdowns, etc.)
    const reportCanvas = await html2canvas(reportElement, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
    });

    // Calculate dimensions for report
    const reportImgWidth = contentWidth;
    const reportImgHeight = (reportCanvas.height * contentWidth) / reportCanvas.width;

    // Add report to first page with proper spacing
    pdf.addImage(
      reportCanvas.toDataURL('image/jpeg', quality),
      'JPEG',
      margin,
      margin,
      reportImgWidth,
      reportImgHeight
    );

    // PAGE 2: Overview Section (Metric Cards)
    pdf.addPage();
    
    // Add page title for overview section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Overview', margin, margin + 10);

    // Capture the overview section
    const overviewCanvas = await html2canvas(overviewElement, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
    });

    // Calculate dimensions for overview
    const overviewImgWidth = contentWidth;
    const overviewImgHeight = (overviewCanvas.height * contentWidth) / overviewCanvas.width;

    // Add overview to second page with spacing from title
    const overviewStartY = margin + sectionSpacing;
    pdf.addImage(
      overviewCanvas.toDataURL('image/jpeg', quality),
      'JPEG',
      margin,
      overviewStartY,
      overviewImgWidth,
      overviewImgHeight
    );

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to add report sections to PDF with intelligent page breaking
async function addReportSectionsToPDF(
  pdf: jsPDF,
  reportElement: HTMLElement,
  startY: number,
  pageHeight: number,
  margin: number,
  contentWidth: number,
  quality: number
): Promise<void> {
  let currentY = startY;
  const sectionSpacing = 8; // Reduced spacing between sections
  
  // Define sections to capture separately for better page breaking
  const sections = [
    // Combined header and overview section (title, description, and summary cards)
    { 
      selectors: ['[data-section="reports-header"]', '#report-overview-section'], 
      name: 'Header & Overview' 
    },
    // SLA Performance section
    { 
      selectors: ['[data-section="sla-performance"]'], 
      name: 'SLA Performance' 
    },
    // Breakdown tables section
    { 
      selectors: ['#report-content-section'], 
      name: 'Breakdown Tables' 
    },
    // Staff Performance section (this is the problematic table)
    { 
      selectors: ['[data-section="staff-performance"]'], 
      name: 'Staff Performance' 
    }
  ];
  
  // If specific sections aren't found, fall back to capturing the entire report
  const foundSections = sections.filter(section => {
    return section.selectors.some(selector => {
      const element = reportElement.querySelector(selector) as HTMLElement;
      return element && element.offsetHeight > 0;
    });
  });
  
  if (foundSections.length === 0) {
    // Fallback: capture entire report as one image
    const reportCanvas = await html2canvas(reportElement, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
    });
    
    const reportImgHeight = (reportCanvas.height * contentWidth) / reportCanvas.width;
    
    // Check if report fits on current page
    if (currentY + reportImgHeight > pageHeight - margin - 30) {
      pdf.addPage();
      currentY = margin;
    }
    
    pdf.addImage(
      reportCanvas.toDataURL('image/jpeg', quality),
      'JPEG',
      margin,
      currentY,
      contentWidth,
      reportImgHeight
    );
    return;
  }
  
  // Capture each section separately
  for (const section of foundSections) {
    try {
      // For sections with multiple selectors, find all elements and capture them together
      const elementsToCapture: HTMLElement[] = [];
      
      for (const selector of section.selectors) {
        const element = reportElement.querySelector(selector) as HTMLElement;
        if (element && element.offsetHeight > 0) {
          elementsToCapture.push(element);
        }
      }
      
      if (elementsToCapture.length === 0) continue;
      
      // If multiple elements, create a wrapper to capture them together
      let captureElement: HTMLElement;
      if (elementsToCapture.length === 1) {
        captureElement = elementsToCapture[0];
      } else {
        // Create a temporary wrapper to capture multiple elements together
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '-9999px';
        wrapper.style.width = '1200px';
        wrapper.style.padding = '0';
        wrapper.style.margin = '0';
        
        // Clone and append elements to wrapper with proper spacing
        elementsToCapture.forEach((element, index) => {
          const clone = element.cloneNode(true) as HTMLElement;
          
          // Add spacing between header and overview sections
          if (index > 0 && section.name === 'Header & Overview') {
            clone.style.marginTop = '20px'; // Add 20px gap between title and summary cards
          }
          
          wrapper.appendChild(clone);
        });
        
        document.body.appendChild(wrapper);
        captureElement = wrapper;
      }
      
      const sectionCanvas = await html2canvas(captureElement, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        logging: false,
      });
      
      const sectionImgHeight = (sectionCanvas.height * contentWidth) / sectionCanvas.width;
      
      // Check if section fits on current page
      const availableSpace = pageHeight - currentY - margin;
      const bufferSpace = 40; // Extra buffer for tables
      
      if (sectionImgHeight > availableSpace - bufferSpace) {
        // Section doesn't fit, add new page
        pdf.addPage();
        currentY = margin;
      }
      
      // Add section to PDF
      pdf.addImage(
        sectionCanvas.toDataURL('image/jpeg', quality),
        'JPEG',
        margin,
        currentY,
        contentWidth,
        sectionImgHeight
      );
      
      currentY += sectionImgHeight + sectionSpacing;
      
      // Clean up temporary wrapper if created
      if (elementsToCapture.length > 1 && captureElement.parentNode) {
        document.body.removeChild(captureElement);
      }
      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error capturing section ${section.name}:`, error);
    }
  }
}

export async function exportReportWithDashboardToPDF(
  reportElementId: string,
  options: PDFExportOptions = {},
  userRole?: string
): Promise<void> {
  const {
    filename = `report-with-dashboard-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.98,
  } = options;

  try {
    // Get the report element
    const reportElement = document.getElementById(reportElementId);

    if (!reportElement) {
      throw new Error(`Report element with id "${reportElementId}" not found`);
    }

    // Hide elements that shouldn't appear in the PDF
    const elementsToHide: HTMLElement[] = [];
    
    // Hide elements with pdf-hide-elements class
    const elementsToHideList = reportElement.querySelectorAll('.pdf-hide-elements');
    elementsToHideList.forEach(element => {
      (element as HTMLElement).style.display = 'none';
      elementsToHide.push(element as HTMLElement);
    });

    // Create a new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const sectionSpacing = 4; // Minimal spacing between dashboard and reports

    let currentY = margin; // Track current Y position

    // SECTION 1: Dashboard Overview (First) - Only for non-end users
    if (userRole !== 'END_USER') {
      try {
      // Create a hidden iframe to load the dashboard
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '1200px';
      iframe.style.height = '800px';
      iframe.src = '/dashboard';
      
      document.body.appendChild(iframe);

      // Wait for iframe to load and data to finish loading
      await new Promise((resolve, reject) => {
        iframe.onload = () => {
          // Function to check if loading is complete
          const checkLoadingComplete = () => {
            const doc = iframe.contentDocument;
            if (!doc) return false;
            
            // Check for common loading indicators
            const loadingElements = doc.querySelectorAll(
              '[data-loading="true"], .loading, .mantine-Loader-root, [class*="loading"], [class*="spinner"]'
            );
            
            // Check for loading text
            const loadingText = doc.body?.textContent?.includes('Loading') || 
                               doc.body?.textContent?.includes('loading') ||
                               doc.body?.textContent?.includes('Loading administrative data');
            
            // Check if we have actual content (metric cards, data)
            const hasContent = doc.querySelectorAll('.mantine-Card-root, .mantine-Paper-root, [class*="metric"], [class*="card"]').length > 0;
            
            return loadingElements.length === 0 && !loadingText && hasContent;
          };
          
          // Function to apply styling changes
          const applyStylingChanges = () => {
            const doc = iframe.contentDocument;
            if (!doc) return;
            
            // Hide sidebar in dashboard iframe
            const sidebar = doc.querySelector('nav[data-mantine-component="AppShell.Navbar"], .mantine-AppShell-navbar, [role="navigation"]');
            if (sidebar) {
              (sidebar as HTMLElement).style.display = 'none';
            }
            
            // Also hide the header to get a cleaner dashboard view
            const header = doc.querySelector('header[data-mantine-component="AppShell.Header"], .mantine-AppShell-header');
            if (header) {
              (header as HTMLElement).style.display = 'none';
            }
            
            // Hide refresh buttons in dashboard
            const refreshButtons = doc.querySelectorAll('.pdf-hide-elements');
            refreshButtons?.forEach(button => {
              (button as HTMLElement).style.display = 'none';
            });
            
            // Adjust the main content area to start from the left and remove top spacing
            const mainContent = doc.querySelector('main[data-mantine-component="AppShell.Main"], .mantine-AppShell-main');
            if (mainContent) {
              (mainContent as HTMLElement).style.marginLeft = '0';
              (mainContent as HTMLElement).style.paddingLeft = '0';
              (mainContent as HTMLElement).style.marginTop = '0';
              (mainContent as HTMLElement).style.paddingTop = '0';
            }
            
            // Also adjust any container elements
            const containers = doc.querySelectorAll('.mantine-Container-root');
            containers?.forEach(container => {
              (container as HTMLElement).style.marginLeft = '0';
              (container as HTMLElement).style.paddingLeft = '16px'; // Add some padding for readability
              (container as HTMLElement).style.marginTop = '0';
              (container as HTMLElement).style.paddingTop = '0';
            });
            
            // Remove top spacing from the body and any wrapper elements
            const body = doc.body;
            if (body) {
              body.style.marginTop = '0';
              body.style.paddingTop = '0';
            }
            
            // Remove top spacing from any stack or group elements that might have default spacing
            const stacks = doc.querySelectorAll('.mantine-Stack-root, .mantine-Group-root');
            stacks?.forEach(stack => {
              const element = stack as HTMLElement;
              if (element.style.marginTop === '' || element.style.marginTop === '0px') {
                element.style.marginTop = '0';
              }
              if (element.style.paddingTop === '' || element.style.paddingTop === '0px') {
                element.style.paddingTop = '0';
              }
            });
          };
          
          // Wait for loading to complete with retries
          let attempts = 0;
          const maxAttempts = 20; // 10 seconds total (500ms * 20)
          
          const waitForLoading = () => {
            attempts++;
            
            if (checkLoadingComplete()) {
              applyStylingChanges();
              resolve(undefined);
            } else if (attempts < maxAttempts) {
              setTimeout(waitForLoading, 500); // Check every 500ms
            } else {
              // If still loading after max attempts, apply changes anyway
              applyStylingChanges();
              resolve(undefined);
            }
          };
          
          // Start checking after initial delay
          setTimeout(waitForLoading, 1000);
        };
        iframe.onerror = reject;
      });

      // Capture the iframe content
      const dashboardCanvas = await html2canvas(iframe.contentDocument?.body || iframe, {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        logging: false,
      });

      // Calculate dimensions for dashboard
      const dashboardImgWidth = contentWidth;
      const dashboardImgHeight = (dashboardCanvas.height * contentWidth) / dashboardCanvas.width;

      // Add dashboard section (always on current page)
      pdf.addImage(
        dashboardCanvas.toDataURL('image/jpeg', quality),
        'JPEG',
        margin,
        currentY,
        dashboardImgWidth,
        dashboardImgHeight
      );

      currentY += dashboardImgHeight + sectionSpacing;

      // Remove the iframe
      document.body.removeChild(iframe);
    } catch (iframeError) {
      // If iframe approach fails, add a note
      pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Dashboard content could not be captured automatically.', margin, currentY);
        currentY += 30;
      }
    }

    // SECTION 2: Report Content (Second)
    if (userRole !== 'END_USER') {
      // For non-end users, start reports on a new page after dashboard
      pdf.addPage();
      currentY = margin; // Reset to top of new page
    }
    // For end users, reports start immediately (no dashboard section)
    
    await addReportSectionsToPDF(pdf, reportElement, currentY, pageHeight, margin, contentWidth, quality);

    // Restore hidden elements
    elementsToHide.forEach(element => {
      element.style.display = '';
    });

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating PDF with dashboard:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function exportElementToPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = `export-${new Date().toISOString().split('T')[0]}.pdf`,
    quality = 0.98,
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Capture the element
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      background: '#ffffff',
      logging: false,
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;

    // Calculate image dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(
      canvas.toDataURL('image/jpeg', quality),
      'JPEG',
      margin,
      margin,
      imgWidth,
      imgHeight
    );

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
