import type { MealTraceEventType, UserRole } from '../types/database';

export type AppRouteKey =
  | 'dashboard'
  | 'donations'
  | 'requests'
  | 'safety'
  | 'matching'
  | 'routes'
  | 'mealtrace'
  | 'fieldIntake'
  | 'impact'
  | 'nutriloop'
  | 'admin'
  | 'onboarding'
  | 'notifications'
  | 'setup';

export type AppActionKey =
  | 'donation:create'
  | 'donation:manage'
  | 'request:create'
  | 'allocation:respond'
  | 'safety:inspect'
  | 'matching:run'
  | 'matching:approve'
  | 'route:plan_dispatch'
  | 'route:update_status'
  | 'mealtrace:scan_pickup'
  | 'mealtrace:scan_handover'
  | 'mealtrace:confirm_portions'
  | 'field:intake'
  | 'nutriloop:edit_profile'
  | 'nutriloop:generate_requests'
  | 'nutriloop:approve_requests'
  | 'nutriloop:manage_catalog'
  | 'admin:verify_org'
  | 'admin:manage_incidents'
  | 'org:register';

export const ROUTE_ROLES: Record<AppRouteKey, UserRole[]> = {
  dashboard: [
    'ADMINISTRATOR',
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'FIELD_WORKER',
  ],
  donations: ['FOOD_DONOR', 'ADMINISTRATOR'],
  requests: ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'FIELD_WORKER', 'ADMINISTRATOR'],
  safety: ['ADMINISTRATOR', 'FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN'],
  matching: ['ADMINISTRATOR'],
  routes: ['DELIVERY_PARTNER', 'ADMINISTRATOR', 'FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN'],
  mealtrace: [
    'ADMINISTRATOR',
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'FIELD_WORKER',
  ],
  fieldIntake: ['FIELD_WORKER', 'ADMINISTRATOR'],
  impact: [
    'ADMINISTRATOR',
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'FIELD_WORKER',
  ],
  nutriloop: ['ADMINISTRATOR', 'FOOD_DONOR', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'FIELD_WORKER'],
  admin: ['ADMINISTRATOR'],
  onboarding: [
    'ADMINISTRATOR',
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'FIELD_WORKER',
  ],
  notifications: [
    'ADMINISTRATOR',
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'FIELD_WORKER',
  ],
  setup: ['ADMINISTRATOR'],
};

export const ACTION_ROLES: Record<AppActionKey, UserRole[]> = {
  'donation:create': ['FOOD_DONOR', 'ADMINISTRATOR'],
  'donation:manage': ['FOOD_DONOR', 'ADMINISTRATOR'],
  'request:create': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'FIELD_WORKER', 'ADMINISTRATOR'],
  'allocation:respond': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'safety:inspect': ['ADMINISTRATOR'],
  'matching:run': ['ADMINISTRATOR'],
  'matching:approve': ['ADMINISTRATOR'],
  'route:plan_dispatch': ['ADMINISTRATOR'],
  'route:update_status': ['DELIVERY_PARTNER', 'ADMINISTRATOR'],
  'mealtrace:scan_pickup': ['DELIVERY_PARTNER', 'ADMINISTRATOR'],
  'mealtrace:scan_handover': ['DELIVERY_PARTNER', 'VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'mealtrace:confirm_portions': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'field:intake': ['FIELD_WORKER', 'ADMINISTRATOR'],
  'nutriloop:edit_profile': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'nutriloop:generate_requests': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'nutriloop:approve_requests': ['VERIFIED_NGO', 'COMMUNITY_KITCHEN', 'ADMINISTRATOR'],
  'nutriloop:manage_catalog': ['ADMINISTRATOR'],
  'admin:verify_org': ['ADMINISTRATOR'],
  'admin:manage_incidents': ['ADMINISTRATOR'],
  'org:register': [
    'FOOD_DONOR',
    'VERIFIED_NGO',
    'COMMUNITY_KITCHEN',
    'DELIVERY_PARTNER',
    'ADMINISTRATOR',
  ],
};

export function canAccessRoute(role: UserRole | undefined | null, route: AppRouteKey): boolean {
  if (!role) return false;
  return ROUTE_ROLES[route].includes(role);
}

export function canPerformAction(role: UserRole | undefined | null, action: AppActionKey): boolean {
  if (!role) return false;
  return ACTION_ROLES[action].includes(role);
}

export type ScannableMealTraceEvent = Extract<
  MealTraceEventType,
  'PICKUP_SCANNED' | 'HANDOVER_SCANNED' | 'PORTIONS_CONFIRMED'
>;

export function getAllowedScanEvents(role: UserRole | undefined | null): ScannableMealTraceEvent[] {
  if (!role) return [];
  const allowed: ScannableMealTraceEvent[] = [];
  if (canPerformAction(role, 'mealtrace:scan_pickup')) allowed.push('PICKUP_SCANNED');
  if (canPerformAction(role, 'mealtrace:scan_handover')) allowed.push('HANDOVER_SCANNED');
  if (canPerformAction(role, 'mealtrace:confirm_portions')) allowed.push('PORTIONS_CONFIRMED');
  return allowed;
}
