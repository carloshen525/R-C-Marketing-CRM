import {
  WhatsAppProvider,
  CreateInstanceOptions,
  InstanceInfo,
  SendMessageOptions,
  SendMediaOptions,
  MessageSendResult,
} from './provider.interface';

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
}

export class EvolutionProvider implements WhatsAppProvider {
  readonly providerName = 'Evolution API v2';
  private baseUrl: string;
  private apiKey: string;

  constructor(config: EvolutionConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
  }

  async createInstance(options: CreateInstanceOptions): Promise<InstanceInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          instanceName: options.instanceName,
          token: options.token || this.apiKey,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      const data = await response.json();

      if (options.webhookUrl) {
        await this.setWebhook(options.instanceName, options.webhookUrl);
      }

      return {
        instanceName: options.instanceName,
        status: data?.instance?.status === 'open' ? 'connected' : 'qrcode',
        qrcode: data?.qrcode
          ? {
              base64: data.qrcode.base64,
              code: data.qrcode.code,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[EvolutionProvider] createInstance error:', error);
      return {
        instanceName: options.instanceName,
        status: 'failed',
      };
    }
  }

  async getConnectionStatus(instanceName: string): Promise<InstanceInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        return { instanceName, status: 'disconnected' };
      }

      const data = await response.json();
      const state = data?.instance?.state || data?.state;

      let status: InstanceInfo['status'] = 'disconnected';
      if (state === 'open') status = 'connected';
      else if (state === 'connecting') status = 'connecting';
      else if (state === 'close') status = 'disconnected';

      return {
        instanceName,
        status,
        phoneNumber: data?.instance?.phoneNumber,
        profileName: data?.instance?.profileName,
        profilePictureUrl: data?.instance?.profilePictureUrl,
      };
    } catch (error) {
      console.error('[EvolutionProvider] getConnectionStatus error:', error);
      return { instanceName, status: 'failed' };
    }
  }

  async getQrCode(instanceName: string): Promise<{ base64: string; code: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: this.headers,
      });

      const data = await response.json();
      return {
        base64: data?.base64 || data?.qrcode?.base64 || '',
        code: data?.code || data?.qrcode?.code || '',
      };
    } catch (error) {
      console.error('[EvolutionProvider] getQrCode error:', error);
      throw new Error('Falha ao obter QR Code da Evolution API');
    }
  }

  async disconnect(instanceName: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: this.headers,
      });
    } catch (error) {
      console.error('[EvolutionProvider] disconnect error:', error);
    }
  }

  async reconnect(instanceName: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/instance/restart/${instanceName}`, {
        method: 'POST',
        headers: this.headers,
      });
    } catch (error) {
      console.error('[EvolutionProvider] reconnect error:', error);
    }
  }

  async sendMessage(options: SendMessageOptions): Promise<MessageSendResult> {
    // Normalizes destination phone
    const cleanNumber = options.to.replace(/\D/g, '');

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${options.instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          number: cleanNumber,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: true,
          },
          textMessage: {
            text: options.text,
          },
        }),
      });

      const data = await response.json();

      return {
        messageId: data?.key?.id || `msg_${Date.now()}`,
        status: response.ok ? 'sent' : 'failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[EvolutionProvider] sendMessage error:', error);
      throw error;
    }
  }

  async sendMedia(options: SendMediaOptions): Promise<MessageSendResult> {
    const cleanNumber = options.to.replace(/\D/g, '');

    try {
      const response = await fetch(`${this.baseUrl}/message/sendMedia/${options.instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          number: cleanNumber,
          mediaMessage: {
            mediatype: options.mediaType,
            caption: options.caption,
            media: options.mediaUrl,
            fileName: options.fileName,
          },
        }),
      });

      const data = await response.json();

      return {
        messageId: data?.key?.id || `msg_${Date.now()}`,
        status: response.ok ? 'sent' : 'failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[EvolutionProvider] sendMedia error:', error);
      throw error;
    }
  }

  async setWebhook(instanceName: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            byEvents: false,
            base64: false,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'QRCODE_UPDATED',
            ],
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[EvolutionProvider] setWebhook error:', error);
      return false;
    }
  }
}
