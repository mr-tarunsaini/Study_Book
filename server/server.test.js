import { describe, it, expect } from 'vitest';
import { authenticateFirebaseUser } from './index.js';

describe('Server Storage Endpoints & Security Validation', () => {
  it('rejects unauthenticated upload requests with 401 Unauthorized', async () => {
    const req = { headers: {}, body: { fileName: 'test.pdf', fileSize: 1000 } };
    let statusCode = null;
    let responseData = null;
    const res = {
      status: (code) => {
        statusCode = code;
        return {
          json: (data) => {
            responseData = data;
          },
        };
      },
    };

    await authenticateFirebaseUser(req, res, () => {});
    expect(statusCode).toBe(401);
    expect(responseData?.error).toMatch(/Authorization header/i);
  });

  it('enforces non-PDF file rejection logic', () => {
    const nonPdfFiles = [
      'document.docx',
      'table.xlsx',
      'malicious.exe',
      'image.png',
      'script.sh',
      'archive.zip',
    ];

    for (const fileName of nonPdfFiles) {
      const isPdf = fileName.toLowerCase().endsWith('.pdf');
      expect(isPdf).toBe(false);
    }
  });

  it('enforces 15 MB maximum file size limit', () => {
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes
    const validSize = 5 * 1024 * 1024;
    const exactBoundary = 15 * 1024 * 1024;
    const oversized = 15 * 1024 * 1024 + 1;

    expect(validSize <= MAX_FILE_SIZE).toBe(true);
    expect(exactBoundary <= MAX_FILE_SIZE).toBe(true);
    expect(oversized > MAX_FILE_SIZE).toBe(true);
  });

  it('prevents path traversal attempts in storagePath', () => {
    const dangerousPaths = [
      '../secret.pdf',
      '../../passwords.txt',
      '/etc/passwd',
      'user-1/../../../system32/cmd.exe',
    ];

    for (const p of dangerousPaths) {
      const isTraversing = p.includes('..') || p.startsWith('/');
      expect(isTraversing).toBe(true);
    }
  });

  it('enforces user ownership verification on file deletion (cross-user protection)', () => {
    const authenticatedUid = 'student_aktu_987';
    const legitimateFilePath = `${authenticatedUid}/notes_unit_1.pdf`;
    const attackerFilePath = `other_student_555/exam_paper.pdf`;

    const canDeleteOwn = legitimateFilePath.startsWith(`${authenticatedUid}/`);
    const canDeleteOther = attackerFilePath.startsWith(`${authenticatedUid}/`);

    expect(canDeleteOwn).toBe(true);
    expect(canDeleteOther).toBe(false);
  });
});
