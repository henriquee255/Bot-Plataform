import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ContactSession } from './contact-session.entity';

@Injectable()
export class ContactSessionsService {
  constructor(
    @InjectRepository(ContactSession) private repo: Repository<ContactSession>,
  ) { }

  async createSession(
    companyId: string,
    data: {
      domain?: string;
      lastUrl?: string;
      referrer?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<ContactSession> {
    let locationData = {};
    if (data.ipAddress && data.ipAddress !== '127.0.0.1' && data.ipAddress !== '::1') {
      try {
        const res = await fetch(`http://ip-api.com/json/${data.ipAddress}`);
        const geo = await res.json();
        if (geo.status === 'success') {
          locationData = {
            city: geo.city,
            region: geo.regionName,
            country: geo.country,
            isp: geo.isp,
          };
        }
      } catch (e) {
        console.error('[Geo] Lookup failed:', e);
      }
    }

    const session = this.repo.create({
      company_id: companyId,
      session_token: uuidv4(),
      domain: data.domain,
      last_url: data.lastUrl,
      referrer: data.referrer,
      user_agent: data.userAgent,
      ip_address: data.ipAddress,
      metadata: locationData,
    });

    // Add a check to see if we should add metadata column to session or if we store in Contact
    return this.repo.save(session);
  }

  async findByToken(token: string): Promise<ContactSession | null> {
    return this.repo.findOne({ where: { session_token: token } });
  }

  async linkContact(sessionId: string, contactId: string): Promise<void> {
    await this.repo.update(sessionId, { contact_id: contactId });
  }

  async updateUrl(sessionId: string, url: string): Promise<void> {
    await this.repo.update(sessionId, { last_url: url });
  }
}
