import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VirusScanService {
  private readonly logger = new Logger(VirusScanService.name);

  async scanFile(
    fileBuffer: Buffer,
    fileName?: string,
    mimeType?: string
  ): Promise<{
    clean: boolean;
    threats?: string[];
    scanEngine?: string;
    scanTime?: number;
  }> {
    const startTime = Date.now();

    try {
      // Basic file validation
      if (fileBuffer.length === 0) {
        return {
          clean: false,
          threats: ['Empty file'],
          scanEngine: 'basic-validation',
          scanTime: Date.now() - startTime,
        };
      }

      // Check file size limits
      const maxFileSize = 100 * 1024 * 1024; // 100MB
      if (fileBuffer.length > maxFileSize) {
        return {
          clean: false,
          threats: ['File too large'],
          scanEngine: 'size-validation',
          scanTime: Date.now() - startTime,
        };
      }

      // Enhanced file type validation
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
      ];

      if (mimeType && !allowedMimeTypes.includes(mimeType)) {
        return {
          clean: false,
          threats: [`Unsupported file type: ${mimeType}`],
          scanEngine: 'mime-validation',
          scanTime: Date.now() - startTime,
        };
      }

      // Enhanced suspicious pattern detection
      const suspiciousPatterns = [
        // Script execution patterns
        {
          pattern: /eval\s*\(/i,
          threat: 'Suspicious eval() function detected',
        },
        {
          pattern: /exec\s*\(/i,
          threat: 'Suspicious exec() function detected',
        },
        {
          pattern: /system\s*\(/i,
          threat: 'Suspicious system() function detected',
        },
        {
          pattern: /shell_exec\s*\(/i,
          threat: 'Suspicious shell_exec() function detected',
        },
        {
          pattern: /passthru\s*\(/i,
          threat: 'Suspicious passthru() function detected',
        },

        // JavaScript injection patterns
        {
          pattern: /<script[^>]*>.*?<\/script>/i,
          threat: 'JavaScript injection detected',
        },
        { pattern: /javascript:/i, threat: 'JavaScript protocol detected' },
        {
          pattern: /onload\s*=/i,
          threat: 'Suspicious onload attribute detected',
        },
        {
          pattern: /onerror\s*=/i,
          threat: 'Suspicious onerror attribute detected',
        },

        // SQL injection patterns
        {
          pattern: /union\s+select/i,
          threat: 'SQL injection pattern detected',
        },
        { pattern: /drop\s+table/i, threat: 'SQL injection pattern detected' },
        { pattern: /delete\s+from/i, threat: 'SQL injection pattern detected' },

        // File path traversal
        { pattern: /\.\.\//g, threat: 'Directory traversal pattern detected' },
        { pattern: /\.\.\\/g, threat: 'Directory traversal pattern detected' },

        // Base64 encoded content (potential obfuscation)
        {
          pattern: /data:image\/[^;]+;base64,/,
          threat: 'Base64 encoded content detected',
        },
      ];

      // Convert buffer to string for pattern matching (first 10KB for performance)
      const fileContent = fileBuffer.toString(
        'utf8',
        0,
        Math.min(10240, fileBuffer.length)
      );

      const detectedThreats: string[] = [];

      for (const { pattern, threat } of suspiciousPatterns) {
        if (pattern.test(fileContent)) {
          this.logger.warn('Suspicious pattern detected in file', {
            pattern: pattern.source,
            threat,
            fileName,
          });
          detectedThreats.push(threat);
        }
      }

      // Check for executable file signatures
      const executableSignatures = [
        { signature: [0x4d, 0x5a], name: 'PE executable' },
        { signature: [0x7f, 0x45, 0x4c, 0x46], name: 'ELF executable' },
        { signature: [0xfe, 0xed, 0xfa, 0xce], name: 'Mach-O executable' },
      ];

      for (const { signature, name } of executableSignatures) {
        if (this.hasSignature(fileBuffer, signature)) {
          detectedThreats.push(`Executable file detected: ${name}`);
        }
      }

      // Check for macro-enabled documents
      if (fileName && /\.(docm|xlsm|pptm)$/i.test(fileName)) {
        detectedThreats.push('Macro-enabled document detected');
      }

      const scanTime = Date.now() - startTime;

      if (detectedThreats.length > 0) {
        this.logger.warn('File scan failed - threats detected', {
          fileName,
          threats: detectedThreats,
          scanTime,
        });

        return {
          clean: false,
          threats: detectedThreats,
          scanEngine: 'enhanced-heuristic',
          scanTime,
        };
      }

      this.logger.log('File scan completed - clean', {
        fileName,
        scanTime,
        fileSize: fileBuffer.length,
      });

      return {
        clean: true,
        threats: [],
        scanEngine: 'enhanced-heuristic',
        scanTime,
      };
    } catch (error) {
      this.logger.error('Virus scan failed', {
        error: error.message,
        fileName,
        scanTime: Date.now() - startTime,
      });

      // Fail safe - reject file if scan fails
      return {
        clean: false,
        threats: ['Scan failed - file rejected for security'],
        scanEngine: 'error-handler',
        scanTime: Date.now() - startTime,
      };
    }
  }

  private hasSignature(buffer: Buffer, signature: number[]): boolean {
    if (buffer.length < signature.length) return false;

    for (let i = 0; i < signature.length; i++) {
      if (buffer[i] !== signature[i]) return false;
    }
    return true;
  }

  async scanUrl(url: string): Promise<{ clean: boolean; threats?: string[] }> {
    this.logger.log(`Scanning URL for threats: ${url}`, 'VirusScanService');

    // In a real implementation, you would check the URL against threat intelligence feeds
    // such as Google Safe Browsing API, VirusTotal, or similar services

    try {
      // Mock URL scan - in production, integrate with actual threat intelligence
      const mockScanResult = {
        clean: true,
        threats: [],
      };

      // Basic URL validation
      const urlObj = new URL(url);

      // Check for suspicious domains (basic heuristic)
      const suspiciousDomains = ['malware.com', 'virus.net', 'phishing.org'];

      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return { clean: false, threats: ['Suspicious domain detected'] };
      }

      this.logger.log('URL scan completed - clean', 'VirusScanService');
      return mockScanResult;
    } catch (error) {
      this.logger.error('URL scan failed', error);
      return { clean: true, threats: [] };
    }
  }

  async getScanStatus(
    scanId: string
  ): Promise<{ status: string; clean?: boolean; threats?: string[] }> {
    this.logger.log(
      `Getting scan status for ID: ${scanId}`,
      'VirusScanService'
    );

    // In a real implementation, you would check the status of an async scan
    // For now, we'll return a mock status

    return {
      status: 'completed',
      clean: true,
      threats: [],
    };
  }
}
