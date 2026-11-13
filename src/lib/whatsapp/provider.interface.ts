export interface CreateInstanceOptions {
  instanceName: string;
  token?: string;
  webhookUrl?: string;
}

export interface InstanceInfo {
  instanceName: string;
  status: 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'failed';
  phoneNumber?: string;
  profileName?: string;
  profilePictureUrl?: string;
  qrcode?: {
    base64: string;
    code: string;
  };
}

export interface SendMessageOptions {
  instanceName: string;
  to: string; // E.164 phone number, e.g. 5511999999999
  text: string;
  quotedMessageId?: string;
}

export interface SendMediaOptions {
  instanceName: string;
  to: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  fileName?: string;
}

export interface MessageSendResult {
  messageId: string;
  status: 'sent' | 'pending' | 'failed';
  timestamp: string;
}

/**
 * WhatsAppProvider interface
 * Follows the Dependency Inversion Principle (SOLID) so the CRM never depends directly
 * on a specific WhatsApp engine or vendor.
 */
export interface WhatsAppProvider {
  readonly providerName: string;

  /**
   * Initializes or verifies an instance in the provider
   */
  createInstance(options: CreateInstanceOptions): Promise<InstanceInfo>;

  /**
   * Retrieves connection state and QR Code if not authenticated
   */
  getConnectionStatus(instanceName: string): Promise<InstanceInfo>;

  /**
   * Fetches fresh QR Code for WhatsApp Web pairing
   */
  getQrCode(instanceName: string): Promise<{ base64: string; code: string }>;

  /**
   * Disconnects / logs out the active session
   */
  disconnect(instanceName: string): Promise<void>;

  /**
   * Reconnects / restarts instance
   */
  reconnect(instanceName: string): Promise<void>;

  /**
   * Sends a standard text message
   */
  sendMessage(options: SendMessageOptions): Promise<MessageSendResult>;

  /**
   * Sends a media file (image, audio, document)
   */
  sendMedia(options: SendMediaOptions): Promise<MessageSendResult>;

  /**
   * Configures webhook endpoint for this instance
   */
  setWebhook(instanceName: string, webhookUrl: string): Promise<boolean>;
}
