import { WhatsAppProvider } from './provider.interface';
import { EvolutionProvider, EvolutionConfig } from './evolution.provider';

export * from './provider.interface';
export * from './evolution.provider';

/**
 * Factory to obtain the configured WhatsApp provider
 * Defaults to Evolution API v2, easily extendable to Z-API, Cloud API, etc.
 */
export function getWhatsAppProvider(config?: Partial<EvolutionConfig>): WhatsAppProvider {
  const baseUrl = config?.baseUrl || process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY || 'global_api_key_rc';

  return new EvolutionProvider({
    baseUrl,
    apiKey,
  });
}
