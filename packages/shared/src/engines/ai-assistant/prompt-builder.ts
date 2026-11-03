import type { FarmerContext, GroundedPrompt } from './types';
import type { AppLanguage } from '../../roles';
import { retrieveGroundedContext } from './grounding';

/**
 * Builds grounded prompts in English, Yorùbá, or Nigerian Pidgin.
 */
export function buildGroundedPrompt(
  query: string,
  context: FarmerContext,
  language: AppLanguage | 'pcm' = 'en'
): GroundedPrompt {
  const snippets = retrieveGroundedContext(context);

  const contextText = snippets
    .map((s, idx) => `[Source ${idx + 1}: ${s.sourceTitle} (v${s.sourceVersion}, status: ${s.status ?? 'draft'})]\n${s.content}`)
    .join('\n\n');

  let systemPrompt = `You are CultivaNode Farm Assistant, an advisory support tool for farmers in Nigeria.
Answer the farmer's question using the reference agronomic context below. Note that this reference material is currently unapproved draft guidance; advise farmers to confirm treatment specifics with a local extension agent or certified agronomist.
Never recommend unapproved or banned chemicals (e.g. Paraquat).
Clearly distinguish verified facts from general advice. If confidence is low, recommend an extension agent.`;

  if (language === 'yo') {
    systemPrompt += `\nFesi ni ede Yoruba to rorun lati ye fun agbe ni South-West Nigeria.`;
  } else if (language === 'pcm') {
    systemPrompt += `\nAnswer in clear Nigerian Pidgin English wey simple for farmer to understand well-well.`;
  }

  const userPrompt = `Farmer Context:
- Crop: ${context.cropId}
- Zone: ${context.zone}
- Current Stage: ${context.stageName ?? 'General'}
- Days after planting: ${context.daysAfterPlanting ?? 'N/A'}

Reference Guidelines (Draft):
${contextText}

Farmer's Question:
"${query}"`;

  return {
    language,
    systemPrompt,
    userPrompt,
    contextSources: snippets,
  };
}
