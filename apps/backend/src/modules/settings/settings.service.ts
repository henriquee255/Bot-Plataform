import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './platform-setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private settingRepo: Repository<PlatformSetting>,
  ) {}

  async getAll(includeSecrets = false): Promise<Record<string, any>> {
    const settings = await this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
    const result: Record<string, any> = {};
    for (const s of settings) {
      if (s.is_secret && !includeSecrets) {
        result[s.key] = s.value ? '••••••••' : '';
      } else {
        result[s.key] = this.parseValue(s.value, s.type);
      }
    }
    return result;
  }

  async getAllGrouped(includeSecrets = false): Promise<Record<string, any[]>> {
    const settings = await this.settingRepo.find({ order: { group: 'ASC', key: 'ASC' } });
    const result: Record<string, any[]> = {};
    for (const s of settings) {
      const group = s.group || 'geral';
      if (!result[group]) result[group] = [];
      result[group].push({
        key: s.key,
        value: s.is_secret && !includeSecrets ? (s.value ? '••••••••' : '') : this.parseValue(s.value, s.type),
        type: s.type,
        description: s.description,
        is_secret: s.is_secret,
      });
    }
    return result;
  }

  async get(key: string): Promise<string | null> {
    const s = await this.settingRepo.findOne({ where: { key } });
    return s?.value ?? null;
  }

  async set(key: string, value: any): Promise<PlatformSetting> {
    let setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingRepo.create({ key, value: String(value) });
    } else {
      setting.value = value === null || value === undefined ? '' : String(value);
    }
    return this.settingRepo.save(setting);
  }

  async bulkUpdate(data: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }

  private parseValue(value: string | null, type: string): any {
    if (value === null || value === undefined) return null;
    switch (type) {
      case 'number': return Number(value);
      case 'boolean': return value === 'true' || value === '1';
      case 'json': try { return JSON.parse(value); } catch { return value; }
      default: return value;
    }
  }

  async seedDefaults(): Promise<void> {
    const count = await this.settingRepo.count();
    if (count > 0) return;

    const defaults: Partial<PlatformSetting>[] = [
      // Identidade
      { key: 'platform_name', value: 'Chat Platform', type: 'string', group: 'identity', description: 'Nome exibido na plataforma' },
      { key: 'platform_tagline', value: 'Atendimento conversacional inteligente', type: 'string', group: 'identity', description: 'Slogan / tagline' },
      { key: 'platform_logo_url', value: '', type: 'string', group: 'identity', description: 'URL do logotipo' },
      { key: 'platform_favicon_url', value: '', type: 'string', group: 'identity', description: 'URL do favicon' },
      { key: 'platform_primary_color', value: '#dc2626', type: 'string', group: 'identity', description: 'Cor primária (hex)' },
      { key: 'platform_support_email', value: 'suporte@chatplatform.com', type: 'string', group: 'identity', description: 'E-mail de suporte ao cliente' },
      { key: 'platform_website_url', value: 'https://chatplatform.com', type: 'string', group: 'identity', description: 'URL do site' },
      // SMTP
      { key: 'smtp_host', value: '', type: 'string', group: 'smtp', description: 'Host do servidor SMTP' },
      { key: 'smtp_port', value: '587', type: 'number', group: 'smtp', description: 'Porta SMTP' },
      { key: 'smtp_user', value: '', type: 'string', group: 'smtp', description: 'Usuário SMTP' },
      { key: 'smtp_pass', value: '', type: 'string', group: 'smtp', description: 'Senha SMTP', is_secret: true },
      { key: 'smtp_from_name', value: 'Chat Platform', type: 'string', group: 'smtp', description: 'Nome do remetente' },
      { key: 'smtp_from_email', value: 'noreply@chatplatform.com', type: 'string', group: 'smtp', description: 'E-mail do remetente' },
      { key: 'smtp_secure', value: 'false', type: 'boolean', group: 'smtp', description: 'Usar TLS (porta 465)' },
      // Registro
      { key: 'allow_public_registration', value: 'true', type: 'boolean', group: 'registration', description: 'Permite registro público de novas empresas' },
      { key: 'require_email_verification', value: 'false', type: 'boolean', group: 'registration', description: 'Exige verificação de e-mail no cadastro' },
      { key: 'default_plan', value: 'free', type: 'string', group: 'registration', description: 'Plano padrão para novos cadastros' },
      { key: 'max_companies', value: '0', type: 'number', group: 'registration', description: 'Limite total de empresas (0 = ilimitado)' },
      // Segurança
      { key: 'jwt_expiry_hours', value: '24', type: 'number', group: 'security', description: 'Expiração do token JWT (horas)' },
      { key: 'max_login_attempts', value: '5', type: 'number', group: 'security', description: 'Tentativas de login antes de bloquear' },
      { key: 'session_timeout_minutes', value: '60', type: 'number', group: 'security', description: 'Timeout de sessão inativa (minutos)' },
      { key: 'force_https', value: 'true', type: 'boolean', group: 'security', description: 'Forçar HTTPS em links gerados' },
      // Manutenção
      { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'maintenance', description: 'Ativar modo manutenção (bloqueia logins)' },
      { key: 'maintenance_message', value: 'O sistema está em manutenção. Voltaremos em breve.', type: 'string', group: 'maintenance', description: 'Mensagem exibida durante manutenção' },
      // Integrações
      { key: 'openai_api_key', value: '', type: 'string', group: 'integrations', description: 'Chave OpenAI para IA conversacional', is_secret: true },
      { key: 'openai_model', value: 'gpt-4o-mini', type: 'string', group: 'integrations', description: 'Modelo OpenAI padrão' },
      { key: 'stripe_public_key', value: '', type: 'string', group: 'integrations', description: 'Chave pública Stripe' },
      { key: 'stripe_secret_key', value: '', type: 'string', group: 'integrations', description: 'Chave secreta Stripe', is_secret: true },
      { key: 'stripe_webhook_secret', value: '', type: 'string', group: 'integrations', description: 'Secret do webhook Stripe', is_secret: true },
      { key: 'google_analytics_id', value: '', type: 'string', group: 'integrations', description: 'ID Google Analytics (GA4)' },
      { key: 'recaptcha_site_key', value: '', type: 'string', group: 'integrations', description: 'Site key reCAPTCHA' },
      { key: 'recaptcha_secret_key', value: '', type: 'string', group: 'integrations', description: 'Secret key reCAPTCHA', is_secret: true },
      // Limites globais
      { key: 'max_file_size_mb', value: '10', type: 'number', group: 'limits', description: 'Tamanho máximo de arquivo em MB' },
      { key: 'max_message_length', value: '5000', type: 'number', group: 'limits', description: 'Comprimento máximo de mensagem' },
      { key: 'rate_limit_per_minute', value: '120', type: 'number', group: 'limits', description: 'Requisições por minuto por IP' },
    ];

    const entities = defaults.map(d => this.settingRepo.create(d));
    await this.settingRepo.save(entities);
  }
}
