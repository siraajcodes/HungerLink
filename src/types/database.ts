export type UserRole =
  | 'FOOD_DONOR'
  | 'VERIFIED_NGO'
  | 'COMMUNITY_KITCHEN'
  | 'DELIVERY_PARTNER'
  | 'ADMINISTRATOR'
  | 'FIELD_WORKER';

export type OrgType =
  | 'FOOD_DONOR'
  | 'VERIFIED_NGO'
  | 'COMMUNITY_KITCHEN'
  | 'DELIVERY_PARTNER';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export type DietaryType =
  | 'VEGETARIAN'
  | 'VEGAN'
  | 'NON_VEGETARIAN'
  | 'EGGETARIAN'
  | 'HALAL'
  | 'JAIN';

export type DietaryPreference = 'ANY' | DietaryType;

export type BatchStatus =
  | 'SUBMITTED'
  | 'PENDING_INSPECTION'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_REJECTED'
  | 'ALLOCATION_PROPOSED'
  | 'ALLOCATED'
  | 'DISPATCHED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type MealRequestStatus =
  | 'OPEN'
  | 'PARTIALLY_ALLOCATED'
  | 'ALLOCATED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export type AllocationStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'DISPATCHED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export type RouteStatus =
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EN_ROUTE_PICKUP'
  | 'PICKED_UP'
  | 'EN_ROUTE_DROPOFF'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopStatus = 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'SKIPPED' | 'FAILED';

export type InspectionStatus = 'PASSED' | 'REJECTED' | 'PENDING_REVIEW';

export type IntakeChannel =
  | 'WEB_PORTAL'
  | 'ANDROID_APP'
  | 'FIELD_ASSISTED_PHONE'
  | 'FIELD_ASSISTED_WALKIN'
  | 'FIELD_ASSISTED_OUTREACH';

export type MealTraceEventType =
  | 'DONATION_SUBMITTED'
  | 'INSPECTION_PASSED'
  | 'INSPECTION_REJECTED'
  | 'QR_GENERATED'
  | 'ALLOCATION_APPROVED'
  | 'PICKUP_SCANNED'
  | 'HANDOVER_SCANNED'
  | 'PORTIONS_CONFIRMED'
  | 'INCIDENT_REPORTED';

export type IncidentType =
  | 'TEMP_DEVIATION'
  | 'PACKAGING_DAMAGE'
  | 'DELIVERY_DELAY'
  | 'QUANTITY_DISCREPANCY'
  | 'ACCESS_ISSUE'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_language: 'en' | 'ta' | 'hi' | 'te';
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  org_type: OrgType;
  address: string;
  location_lat: number;
  location_lng: number;
  contact_person: string;
  contact_phone: string;
  fssai_reg_no: string | null;
  ngo_reg_no: string | null;
  verification_status: VerificationStatus;
  verification_doc_path: string | null;
  verification_reason: string | null;
  daily_capacity: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMember {
  id: string;
  organisation_id: string;
  user_id: string;
  membership_role: 'OWNER' | 'MANAGER' | 'COORDINATOR' | 'STAFF' | 'INSPECTOR' | 'FIELD_AGENT';
  status: 'pending' | 'active' | 'suspended' | 'revoked';
  created_at: string;
}

export interface DonationBatch {
  id: string;
  batch_code: string;
  qr_token: string;
  donor_id: string;
  created_by: string | null;
  food_item: string;
  food_category: string;
  food_composition_id?: string | null;
  dietary_type: DietaryType;
  portions_available: number;
  portions_allocated: number;
  prep_time: string;
  pickup_deadline: string;
  consume_by_time: string;
  temp_celsius: number | null;
  packaging_details: string;
  safety_gate_passed: boolean;
  status: BatchStatus;
  cancellation_reason: string | null;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  donor?: Organisation;
}

export interface MealRequest {
  id: string;
  org_id: string;
  submitted_by: string | null;
  portions_needed: number;
  portions_fulfilled: number;
  dietary_pref: DietaryPreference;
  urgency_score: number;
  wait_started_at: string;
  intake_channel: IntakeChannel;
  required_by: string;
  status: MealRequestStatus;
  idempotency_key: string | null;
  notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  recipient?: Organisation;
}

export interface MatchExplanation {
  L: number;
  U: number;
  Q: number;
  T: number;
  N?: number;
  nutrition_mode?: boolean;
  nutrition_summary?: string;
  nutrition_addressed_gaps?: Array<{ nutrient: string; closurePct: number; addedAmount: number; unit: string }>;
  total_score: number;
  distance_km: number;
  est_transit_minutes: number;
  safety_buffer_minutes: number;
  algorithm_version: string;
  calculated_at: string;
  summary: string;
}

export interface Allocation {
  id: string;
  donation_batch_id: string;
  meal_request_id: string;
  allocated_portions: number;
  match_score: number;
  match_explanation: MatchExplanation;
  approved_by_coordinator: string | null;
  approved_at: string | null;
  status: AllocationStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  batch?: DonationBatch;
  request?: MealRequest;
}

export interface DeliveryRoute {
  id: string;
  delivery_partner_id: string;
  delivery_partner_name?: string;
  route_status: RouteStatus;
  route_polyline: string | null;
  estimated_duration: number;
  estimated_distance: number;
  vehicle_capacity_portions: number;
  shift_payout_reference: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  stops?: DeliveryStop[];
}

export interface DeliveryStop {
  id: string;
  route_id: string;
  allocation_id: string;
  stop_order: number;
  stop_type: 'PICKUP' | 'DROPOFF';
  status: StopStatus;
  arrived_at: string | null;
  completed_at: string | null;
  label?: string;
  address?: string;
  lat?: number;
  lng?: number;
  portions?: number;
  batch_code?: string;
  qr_token?: string;
}

export interface FoodSafetyCheck {
  id: string;
  donation_batch_id: string;
  inspector_id: string;
  inspector_name?: string;
  inspection_status: InspectionStatus;
  recorded_temp: number | null;
  packaging_condition: string;
  inspection_notes: string | null;
  rejection_reason: string | null;
  physical_inspection_confirmed: boolean;
  inspected_at: string;
}

export interface MealTraceEvent {
  id: string;
  donation_batch_id: string;
  event_type: MealTraceEventType;
  actor_id: string | null;
  actor_label?: string;
  recorded_temp: number | null;
  confirmed_portions: number | null;
  event_metadata: Record<string, unknown>;
  created_at: string;
}

export interface ImpactRecord {
  id: string;
  donation_batch_id: string;
  organisation_id: string;
  portions_delivered: number;
  distribution_area: string;
  confirmed_at: string;
  is_demo: boolean;
}

export interface Incident {
  id: string;
  batch_id: string | null;
  reporter_id: string;
  incident_type: IncidentType;
  description: string;
  status: IncidentStatus;
  resolution_notes: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_label?: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OfflineRequestDraft {
  idempotency_key: string;
  org_id: string;
  org_name: string;
  portions_needed: number;
  dietary_pref: DietaryPreference;
  urgency_score: number;
  intake_channel: IntakeChannel;
  required_by: string;
  notes: string;
  created_at_local: string;
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  last_error?: string;
  attempts: number;
}
