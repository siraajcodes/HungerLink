import { describe, expect, it } from 'vitest';
import {
  canAccessRoute,
  canPerformAction,
  getAllowedScanEvents,
  type AppActionKey,
  type AppRouteKey,
} from '../src/lib/rbac';
import type { UserRole } from '../src/types/database';

const ALL_ROUTES: AppRouteKey[] = [
  'dashboard',
  'donations',
  'requests',
  'safety',
  'matching',
  'routes',
  'mealtrace',
  'fieldIntake',
  'impact',
  'nutriloop',
  'admin',
  'onboarding',
  'notifications',
  'setup',
];

const ALL_ACTIONS: AppActionKey[] = [
  'donation:create',
  'donation:manage',
  'request:create',
  'allocation:respond',
  'safety:inspect',
  'matching:run',
  'matching:approve',
  'route:plan_dispatch',
  'route:update_status',
  'mealtrace:scan_pickup',
  'mealtrace:scan_handover',
  'mealtrace:confirm_portions',
  'field:intake',
  'nutriloop:edit_profile',
  'nutriloop:generate_requests',
  'nutriloop:approve_requests',
  'nutriloop:manage_catalog',
  'admin:verify_org',
  'admin:manage_incidents',
  'org:register',
];

describe('Role-Based Access Control (RBAC) Matrix', () => {
  it('blocks unauthenticated/null roles from every route, action, and scan event', () => {
    for (const route of ALL_ROUTES) {
      expect(canAccessRoute(null, route)).toBe(false);
      expect(canAccessRoute(undefined, route)).toBe(false);
    }
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction(null, action)).toBe(false);
      expect(canPerformAction(undefined, action)).toBe(false);
    }
    expect(getAllowedScanEvents(null)).toEqual([]);
  });

  it('grants ADMINISTRATOR access to all routes, actions, and MealTrace scan events', () => {
    for (const route of ALL_ROUTES) {
      expect(canAccessRoute('ADMINISTRATOR', route)).toBe(true);
    }
    for (const action of ALL_ACTIONS) {
      expect(canPerformAction('ADMINISTRATOR', action)).toBe(true);
    }
    expect(getAllowedScanEvents('ADMINISTRATOR')).toEqual([
      'PICKUP_SCANNED',
      'HANDOVER_SCANNED',
      'PORTIONS_CONFIRMED',
    ]);
  });

  it('limits FOOD_DONOR strictly to donations and read-only visibility elsewhere', () => {
    const role: UserRole = 'FOOD_DONOR';
    expect(canAccessRoute(role, 'donations')).toBe(true);
    expect(canAccessRoute(role, 'nutriloop')).toBe(true);
    expect(canAccessRoute(role, 'requests')).toBe(false);
    expect(canAccessRoute(role, 'matching')).toBe(false);
    expect(canAccessRoute(role, 'fieldIntake')).toBe(false);
    expect(canAccessRoute(role, 'admin')).toBe(false);
    expect(canAccessRoute(role, 'setup')).toBe(false);

    expect(canPerformAction(role, 'donation:create')).toBe(true);
    expect(canPerformAction(role, 'donation:manage')).toBe(true);
    expect(canPerformAction(role, 'request:create')).toBe(false);
    expect(canPerformAction(role, 'safety:inspect')).toBe(false);
    expect(canPerformAction(role, 'matching:run')).toBe(false);
    expect(canPerformAction(role, 'route:plan_dispatch')).toBe(false);
    expect(canPerformAction(role, 'nutriloop:edit_profile')).toBe(false);
    expect(getAllowedScanEvents(role)).toEqual([]);
  });

  it('limits VERIFIED_NGO and COMMUNITY_KITCHEN to requests, shelter nutrition, and handover/portion confirmation', () => {
    for (const role of ['VERIFIED_NGO', 'COMMUNITY_KITCHEN'] as UserRole[]) {
      expect(canAccessRoute(role, 'requests')).toBe(true);
      expect(canAccessRoute(role, 'nutriloop')).toBe(true);
      expect(canAccessRoute(role, 'donations')).toBe(false);
      expect(canAccessRoute(role, 'matching')).toBe(false);
      expect(canAccessRoute(role, 'admin')).toBe(false);

      expect(canPerformAction(role, 'request:create')).toBe(true);
      expect(canPerformAction(role, 'allocation:respond')).toBe(true);
      expect(canPerformAction(role, 'nutriloop:edit_profile')).toBe(true);
      expect(canPerformAction(role, 'nutriloop:generate_requests')).toBe(true);
      expect(canPerformAction(role, 'nutriloop:approve_requests')).toBe(true);
      expect(canPerformAction(role, 'nutriloop:manage_catalog')).toBe(false);
      expect(canPerformAction(role, 'donation:create')).toBe(false);
      expect(canPerformAction(role, 'safety:inspect')).toBe(false);
      expect(canPerformAction(role, 'route:plan_dispatch')).toBe(false);
      expect(getAllowedScanEvents(role)).toEqual(['HANDOVER_SCANNED', 'PORTIONS_CONFIRMED']);
    }
  });

  it('limits DELIVERY_PARTNER to delivery routes and pickup/handover scans only', () => {
    const role: UserRole = 'DELIVERY_PARTNER';
    expect(canAccessRoute(role, 'routes')).toBe(true);
    expect(canAccessRoute(role, 'mealtrace')).toBe(true);
    expect(canAccessRoute(role, 'donations')).toBe(false);
    expect(canAccessRoute(role, 'requests')).toBe(false);
    expect(canAccessRoute(role, 'nutriloop')).toBe(false);
    expect(canAccessRoute(role, 'admin')).toBe(false);

    expect(canPerformAction(role, 'route:update_status')).toBe(true);
    expect(canPerformAction(role, 'route:plan_dispatch')).toBe(false);
    expect(canPerformAction(role, 'mealtrace:confirm_portions')).toBe(false);
    expect(getAllowedScanEvents(role)).toEqual(['PICKUP_SCANNED', 'HANDOVER_SCANNED']);
  });

  it('limits FIELD_WORKER to assisted intake and request creation without org registration or approvals', () => {
    const role: UserRole = 'FIELD_WORKER';
    expect(canAccessRoute(role, 'fieldIntake')).toBe(true);
    expect(canAccessRoute(role, 'requests')).toBe(true);
    expect(canAccessRoute(role, 'donations')).toBe(false);
    expect(canAccessRoute(role, 'matching')).toBe(false);
    expect(canAccessRoute(role, 'routes')).toBe(false);
    expect(canAccessRoute(role, 'admin')).toBe(false);

    expect(canPerformAction(role, 'field:intake')).toBe(true);
    expect(canPerformAction(role, 'request:create')).toBe(true);
    expect(canPerformAction(role, 'allocation:respond')).toBe(false);
    expect(canPerformAction(role, 'org:register')).toBe(false);
    expect(canPerformAction(role, 'nutriloop:edit_profile')).toBe(false);
    expect(getAllowedScanEvents(role)).toEqual([]);
  });
});
