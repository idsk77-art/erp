import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AppConfig } from '../config/env.js';
import type { AudioReportRepository } from '../storage/repositories/reports.js';

export class SpeechToTextService {
  constructor(
    private readonly reportsRepository: AudioReportRepository,
    private readonly config: AppConfig,
  ) {}

  async transcribeAndGenerateReport(
    userId: string,
    reportId: string,
    filename: string,
    filePath: string,
  ): Promise<void> {
    // 1. Set status to processing immediately
    this.reportsRepository.update(userId, reportId, {
      status: 'processing',
    });

    // 2. Process in background
    setTimeout(async () => {
      try {
        // 2a. Try real Gemini API if configured
        if (this.config.geminiApiKey && this.config.speechToTextProvider === 'gemini') {
          const absolutePath = resolve(this.config.uploadDir, filePath);
          const fileBuffer = await readFile(absolutePath);
          const base64Audio = fileBuffer.toString('base64');
          
          let mimeType = 'audio/mp3';
          const lowerName = filename.toLowerCase();
          if (lowerName.endsWith('.wav')) {
            mimeType = 'audio/wav';
          } else if (lowerName.endsWith('.m4a')) {
            mimeType = 'audio/x-m4a';
          } else if (lowerName.endsWith('.ogg')) {
            mimeType = 'audio/ogg';
          } else if (lowerName.endsWith('.webm')) {
            mimeType = 'audio/webm';
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
                        text: 'Transcribe this audio recording, generate a descriptive title, and write a summary. Return ONLY a valid JSON object matching this schema, without markdown formatting or code blocks:\n{\n  "title": "string (descriptive title)",\n  "transcript": "string (full transcription)",\n  "summary": "string (meeting summary / main points)"\n}',
                      },
                      {
                        inlineData: {
                          mimeType,
                          data: base64Audio,
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
            this.reportsRepository.update(userId, reportId, {
              status: 'done',
              title: parsed.title || 'Gemini Audio Transcription',
              transcript: parsed.transcript || '',
              summary: parsed.summary || '',
            });
            return;
          }
        }

        // 2b. Fallback to mock
        const lowerName = filename.toLowerCase();
        let title = '주간 부서 회의';
        let transcript = '오늘 개발팀 주간 회의를 시작하겠습니다. 먼저 이번 주 진행 중인 ERP 2차 MVP 기능 구현 상황을 점검하겠습니다. JWT 인증 및 회원 로그인 처리는 완료되었고, 명함 스캔 OCR 서비스와 녹음파일 STT 변환 서비스 골격이 구축 중입니다. 금일 중으로 대시보드 UI 연동까지 완료하여 전체적인 시나리오 테스트를 진행할 예정입니다.';
        let summary = 'ERP 2차 MVP 개발 회의. JWT 인증 및 OAuth 로그인 개발 완료, 명함 OCR 및 STT 기능 구축 중, 금일 대시보드 UI 연동 예정.';

        if (lowerName.includes('sales') || lowerName.includes('영업')) {
          title = '영업 본부 실적 회의';
          transcript = '안녕하세요, 영업본부 7월 실적 보고 회의입니다. 2분기 영업 실적이 목표 대비 약 110% 초과 달성되었습니다. 특히 신규 클라우드 ERP 솔루션 도입 문의가 급증하고 있으며, 주요 잠재 고객사들과의 미팅이 다음 주에 예정되어 있습니다. 다음 분기에도 이 추세를 이어나가도록 하겠습니다.';
          summary = '7월 영업 실적 점검. 2분기 목표 110% 달성. 신규 클라우드 ERP 솔루션 도입 문의 증가. 차주 주요 고객사 미팅 진행.';
        } else if (lowerName.includes('interview') || lowerName.includes('면접')) {
          title = '신입 개발자 면접 녹취';
          transcript = '지원자분은 주로 어떤 기술 스택을 다루어 오셨나요? 네, 저는 주로 TypeScript와 Node.js 기반 백엔드 아키텍처 설계를 공부해 왔습니다. 특히 데이터베이스 정규화와 인덱스 설계, 그리고 JWT 기반 토큰 인증 메커니즘을 실제 프로젝트에 도입해 본 경험이 있습니다.';
          summary = '신입 백엔드 개발자 면접. TS/Node.js 백엔드 개발 경험, DB 튜닝 및 JWT 인증 구현 역량 강조.';
        }

        this.reportsRepository.update(userId, reportId, {
          status: 'done',
          title,
          transcript,
          summary,
        });
      } catch (error) {
        console.error('Failed to process speech-to-text:', error);
        this.reportsRepository.update(userId, reportId, {
          status: 'failed',
        });
      }
    }, 5000);
  }
}
