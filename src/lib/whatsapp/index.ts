import { WhatsAppProvider } from './provider.interface';
import { EvolutionProvider, EvolutionConfig } from './evolution.provider';

export * from './provider.interface';
export * from './evolution.provider';

/**
 * Factory to obtain the configured WhatsApp provider
 * Defaults to Evolution API v2, easily extendable to Z-API, Cloud API, etc.
 */
export function getWhatsAppProvider(config?: Partial<EvolutionConfig>): WhatsAppProvider {
  const baseUrl = config?.baseUrl || process.env.EVOLUTION_API_URL || 'https://prospeccao-evolution01.pesd8y.easypanel.host';
  const apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY || 'X9mK2vQ7LpR8aNc4HsT1yWf6BgZe3JuD';

  return new EvolutionProvider({
    baseUrl,
    apiKey,
  });
}
