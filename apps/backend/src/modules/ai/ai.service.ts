import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConfig } from './ai-config.entity';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiConfig)
    private configRepo: Repository<AiConfig>,
    private kbService: KnowledgeBaseService,
  ) {}

  async getConfig(companyId: string): Promise<AiConfig | null> {
    return this.configRepo.findOne({ where: { company_id: companyId } });
  }

  async saveConfig(companyId: string, data: Partial<AiConfig>): Promise<AiConfig> {
    let config = await this.configRepo.findOne({ where: { company_id: companyId } });
    if (config) {
      Object.assign(config, data, { updated_at: new Date() });
      return this.configRepo.save(config);
    }
    config = this.configRepo.create({ ...data, company_id: companyId });
    return this.configRepo.save(config);
  }

  async testConnection(companyId: string): Promise<{ ok: boolean; model: string; response: string }> {
    const config = await this.getConfig(companyId);
    if (!config || !config.api_key) {
      throw new BadRequestException('IA não configurada ou API Key ausente');
    }

    const testMessages: ChatMessage[] = [
      { role: 'user', content: 'Say "OK" in one word.' },
    ];

    try {
      const response = await this.callProvider(config, testMessages);
      return { ok: true, model: config.model || 'default', response };
    } catch (err: any) {
      return { ok: false, model: config.model || 'default', response: err.message };
    }
  }

  async generateResponse(
    companyId: string,
    messages: ChatMessage[],
    useKB = true,
  ): Promise<string> {
    const config = await this.getConfig(companyId);
    if (!config || !config.api_key) {
      throw new BadRequestException('IA não configurada ou API Key ausente');
    }

    let systemPrompt = config.system_prompt || 'Você é um assistente de atendimento ao cliente prestativo e profissional.';

    if (useKB && config.use_knowledge_base) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const kbContext = await this.getKBContext(companyId, lastUserMsg.content);
        if (kbContext) {
          systemPrompt += `\n\nArtigos relevantes da base de conhecimento:\n${kbContext}`;
        }
      }
    }

    const finalMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'),
    ];

    return this.callProvider(config, finalMessages);
  }

  async suggestReply(
    companyId: string,
    conversationId: string,
    lastMessages: ChatMessage[],
  ): Promise<string> {
    const config = await this.getConfig(companyId);
    if (!config || !config.api_key) {
      throw new BadRequestException('IA não configurada ou API Key ausente');
    }

    const basePrompt = config.system_prompt || 'Você é um assistente de atendimento ao cliente prestativo e profissional.';
    let systemContent = basePrompt + '\n\nCom base na conversa abaixo, sugira uma resposta profissional e concisa para o atendente. Responda apenas com o texto da sugestão, sem explicações adicionais.';

    if (config.use_knowledge_base) {
      const lastUserMsg = [...lastMessages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        const kbContext = await this.getKBContext(companyId, lastUserMsg.content);
        if (kbContext) {
          systemContent += `\n\nBase de conhecimento:\n${kbContext}`;
        }
      }
    }

    const finalMessages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...lastMessages.filter(m => m.role !== 'system'),
    ];

    return this.callProvider(config, finalMessages);
  }

  async getKBContext(companyId: string, query: string): Promise<string> {
    try {
      const articles = await this.kbService.findAll(companyId, undefined, query);
      const top3 = articles.filter((a: any) => a.published).slice(0, 3);
      if (!top3.length) return '';
      return top3.map((a: any) => `### ${a.title}\n${a.content}`).join('\n\n---\n\n');
    } catch {
      return '';
    }
  }

  private async callProvider(config: AiConfig, messages: ChatMessage[]): Promise<string> {
    const { provider, api_key, model, temperature, max_tokens } = config;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(api_key, model || 'gpt-4o-mini', messages, temperature, max_tokens);
      case 'groq':
        return this.callGroq(api_key, model || 'llama3-8b-8192', messages, temperature, max_tokens);
      case 'gemini':
        return this.callGemini(api_key, model || 'gemini-1.5-flash', messages, temperature, max_tokens);
      case 'anthropic':
        return this.callAnthropic(api_key, model || 'claude-3-haiku-20240307', messages, temperature, max_tokens);
      case 'cohere':
        return this.callCohere(api_key, model || 'command-r', messages, temperature, max_tokens);
      default:
        throw new BadRequestException(`Provider não suportado: ${provider}`);
    }
  }

  private async callOpenAI(apiKey: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async callGroq(apiKey: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });
    if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  private async callGemini(apiKey: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');
    const contents = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const body: any = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
    if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }

  private async callAnthropic(apiKey: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
    const body: any = { model, messages: chatMessages, max_tokens: maxTokens, temperature };
    if (systemMsg) body.system = systemMsg.content;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    return data.content?.[0]?.text ?? '';
  }

  private async callCohere(apiKey: string, model: string, messages: ChatMessage[], temperature: number, maxTokens: number): Promise<string> {
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');
    const lastUser = [...chatMessages].reverse().find(m => m.role === 'user');
    const history = chatMessages
      .filter(m => m !== lastUser)
      .map(m => ({ role: m.role === 'assistant' ? 'CHATBOT' : 'USER', message: m.content }));

    const body: any = { model, message: lastUser?.content ?? '', chat_history: history, temperature, max_tokens: maxTokens };
    if (systemMsg) body.preamble = systemMsg.content;

    const res = await fetch('https://api.cohere.ai/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Cohere error ${res.status}: ${await res.text()}`);
    const data: any = await res.json();
    return data.text ?? '';
  }
}
