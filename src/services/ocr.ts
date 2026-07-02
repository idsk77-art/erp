import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AppConfig } from '../config/env.js';
import type { BusinessCardScanResult } from '../domain/contacts.js';

export class BusinessCardOcrService {
  constructor(private readonly config: AppConfig) {}

  async scanBusinessCard(filePath: string, filename: string): Promise<BusinessCardScanResult> {
    // 1. Try real Gemini API if configured
    if (this.config.geminiApiKey && this.config.ocrProvider === 'gemini') {
      try {
        const absolutePath = resolve(this.config.uploadDir, filePath);
        const fileBuffer = await readFile(absolutePath);
        const base64Image = fileBuffer.toString('base64');
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filename.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp';
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.config.geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: 'Extract contact details from this business card image. Return ONLY a valid JSON object matching this schema, without any markdown formatting or code blocks:\n{\n  "name": "string (name of the person)",\n  "companyName": "string (name of the company)",\n  "jobTitle": "string (job title / position)",\n  "phoneNumber": "string (phone number)",\n  "email": "string (email address)"\n}',
                    },
                    {
                      inlineData: {
                        mimeType,
                        data: base64Image,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const cleanJsonText = (raw: string): string => {
            let cleaned = raw.trim();
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              return cleaned.slice(firstBrace, lastBrace + 1);
            }
            cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, '');
            cleaned = cleaned.replace(/\s*```$/, '');
            return cleaned.trim();
          };

          const parsed = JSON.parse(cleanJsonText(text));
          return {
            name: parsed.name || undefined,
            companyName: parsed.companyName || undefined,
            jobTitle: parsed.jobTitle || undefined,
            phoneNumber: parsed.phoneNumber || undefined,
            email: parsed.email || undefined,
            rawText: `[Gemini OCR Extractions]\n${text}`,
          };
        }
      } catch (err) {
        console.error('Failed to query Gemini OCR API, falling back to mock:', err);
      }
    }

    // 2. Fall back to mock OCR
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lowerName = filename.toLowerCase();
    
    let name = '홍길동';
    let companyName = '나노텍';
    let jobTitle = '개발팀장';
    let phoneNumber = '010-1234-5678';
    let email = 'gildong.hong@nanotech.com';

    if (lowerName.includes('john')) {
      name = 'John Doe';
      companyName = 'Google';
      jobTitle = 'Software Engineer';
      phoneNumber = '+1-650-253-0000';
      email = 'johndoe@google.com';
    } else if (lowerName.includes('jane')) {
      name = 'Jane Smith';
      companyName = 'Acme Corp';
      jobTitle = 'Product Manager';
      phoneNumber = '+1-206-555-0199';
      email = 'jane.smith@acme.com';
    } else if (lowerName.includes('이영희') || lowerName.includes('younghee')) {
      name = '이영희';
      companyName = '에이아이 랩';
      jobTitle = '연구원';
      phoneNumber = '010-9876-5432';
      email = 'younghee.lee@ailab.ai';
    }

    const rawText = `
=============================================
BUSINESS CARD SCAN (MOCK)
=============================================
Company: ${companyName}
Name: ${name}
Title: ${jobTitle}
Tel: ${phoneNumber}
Email: ${email}
Address: 서울시 강남구 테헤란로 123
=============================================
    `.trim();

    return {
      name,
      companyName,
      jobTitle,
      phoneNumber,
      email,
      rawText,
    };
  }
}
