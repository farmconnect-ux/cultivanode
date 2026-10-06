import type { AgentBookingPermissionCheck } from './types';

export interface AgentBookingValidationResult {
  authorized: boolean;
  error?: 'agent_inactive' | 'missing_field_agent_role' | 'farmer_not_onboarded_by_agent';
}

/**
 * Validates whether a field agent is authorized to create a booking on behalf
 * of a farmer according to MVP W4 rules.
 */
export function validateAgentBookingAuthority(
  check: AgentBookingPermissionCheck
): AgentBookingValidationResult {
  if (!check.agentActive) {
    return { authorized: false, error: 'agent_inactive' };
  }

  const hasAgentRole = check.agentRoles.includes('field_agent');
  if (!hasAgentRole) {
    return { authorized: false, error: 'missing_field_agent_role' };
  }

  // A field agent can only book on behalf of farmers they directly onboarded
  if (check.farmerOnboardedByAgentId !== check.agentProfileId) {
    return { authorized: false, error: 'farmer_not_onboarded_by_agent' };
  }

  return { authorized: true };
}
