export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          permission: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          permission: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          permission?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission"]
          },
        ]
      }
      admin_role_permissions: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          created_by: string | null
          permission: string
        }
        Insert: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          created_by?: string | null
          permission: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          created_by?: string | null
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_role_permissions_permission_fkey"
            columns: ["permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission"]
          },
        ]
      }
      admin_roles: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at: string
          granted_by: string | null
          profile_id: string
        }
        Insert: {
          admin_role: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          granted_by?: string | null
          profile_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"]
          created_at?: string
          granted_by?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_onboarding_codes: {
        Row: {
          agent_id: string
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          revoked_at: string | null
          revoked_by: string | null
          used_at: string | null
        }
        Insert: {
          agent_id: string
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          revoked_at?: string | null
          revoked_by?: string | null
          used_at?: string | null
        }
        Update: {
          agent_id?: string
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          revoked_at?: string | null
          revoked_by?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_onboarding_codes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_onboarding_codes_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          approved_by: string
          channel_code: string
          cooldown_minutes: number
          created_at: string
          crop_stage: string | null
          crop_type: string | null
          hysteresis_delta: number
          id: string
          is_active: boolean
          observation_template: string
          operator: string
          rule_code: string
          severity: Database["public"]["Enums"]["device_alert_severity"]
          soil_type: string | null
          suggested_action: string
          sustained_duration_minutes: number
          threshold_value: number
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          approved_by?: string
          channel_code: string
          cooldown_minutes?: number
          created_at?: string
          crop_stage?: string | null
          crop_type?: string | null
          hysteresis_delta?: number
          id?: string
          is_active?: boolean
          observation_template: string
          operator: string
          rule_code: string
          severity?: Database["public"]["Enums"]["device_alert_severity"]
          soil_type?: string | null
          suggested_action: string
          sustained_duration_minutes?: number
          threshold_value: number
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          approved_by?: string
          channel_code?: string
          cooldown_minutes?: number
          created_at?: string
          crop_stage?: string | null
          crop_type?: string | null
          hysteresis_delta?: number
          id?: string
          is_active?: boolean
          observation_template?: string
          operator?: string
          rule_code?: string
          severity?: Database["public"]["Enums"]["device_alert_severity"]
          soil_type?: string | null
          suggested_action?: string
          sustained_duration_minutes?: number
          threshold_value?: number
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: number
          ip: unknown
          metadata: Json
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: never
          ip?: unknown
          metadata?: Json
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: never
          ip?: unknown
          metadata?: Json
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number_last4: string
          bank_code: string
          bank_name: string
          created_at: string
          created_by: string | null
          failure_reason: string | null
          id: string
          id_hash: string | null
          is_default: boolean
          name_match: number | null
          profile_id: string
          provider: string
          provider_recipient_code: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          account_name: string
          account_number_last4: string
          bank_code: string
          bank_name: string
          created_at?: string
          created_by?: string | null
          failure_reason?: string | null
          id?: string
          id_hash?: string | null
          is_default?: boolean
          name_match?: number | null
          profile_id: string
          provider: string
          provider_recipient_code?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          account_name?: string
          account_number_last4?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          created_by?: string | null
          failure_reason?: string | null
          id?: string
          id_hash?: string | null
          is_default?: boolean
          name_match?: number | null
          profile_id?: string
          provider?: string
          provider_recipient_code?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          actor_id: string | null
          booking_id: string
          created_at: string
          event: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: number
          note: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          actor_id?: string | null
          booking_id: string
          created_at?: string
          event: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          note?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          event?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: never
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_proofs: {
        Row: {
          booking_id: string
          created_at: string
          gps: unknown
          gps_distance_m: number | null
          hectares: number | null
          id: string
          kind: string
          storage_path: string
          taken_at: string
          uploader_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          gps?: unknown
          gps_distance_m?: number | null
          hectares?: number | null
          id?: string
          kind: string
          storage_path: string
          taken_at: string
          uploader_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          gps?: unknown
          gps_distance_m?: number | null
          hectares?: number | null
          id?: string
          kind?: string
          storage_path?: string
          taken_at?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_proofs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_proofs_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancelled_by: string | null
          check_in_distance_m: number | null
          check_in_location: unknown
          checked_in_at: string | null
          closed_reason: string | null
          confirm_by: string | null
          created_at: string
          dispute_category: string | null
          dispute_reason: string | null
          disputed_at: string | null
          disputed_by: string | null
          distance_km: number
          equipment_type: Database["public"]["Enums"]["equipment_type"] | null
          expires_at: string
          farm_id: string | null
          farm_name: string
          farmer_id: string
          farmer_note: string | null
          farmer_paid_at: string | null
          farmer_paid_kobo: number | null
          hectares_done: number | null
          id: string
          job_date: string
          job_lga: string | null
          job_location: unknown
          job_state: string | null
          listing_id: string | null
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          listing_title: string
          organization_id: string | null
          payment_disputed: boolean
          provider_id: string
          provider_paid_at: string | null
          provider_paid_kobo: number | null
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          quantity: number
          rate_kobo: number
          responded_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at: string
          work_submitted_at: string | null
        }
        Insert: {
          cancelled_by?: string | null
          check_in_distance_m?: number | null
          check_in_location?: unknown
          checked_in_at?: string | null
          closed_reason?: string | null
          confirm_by?: string | null
          created_at?: string
          dispute_category?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          distance_km: number
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          expires_at: string
          farm_id?: string | null
          farm_name: string
          farmer_id: string
          farmer_note?: string | null
          farmer_paid_at?: string | null
          farmer_paid_kobo?: number | null
          hectares_done?: number | null
          id?: string
          job_date: string
          job_lga?: string | null
          job_location: unknown
          job_state?: string | null
          listing_id?: string | null
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          listing_title: string
          organization_id?: string | null
          payment_disputed?: boolean
          provider_id: string
          provider_paid_at?: string | null
          provider_paid_kobo?: number | null
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          quantity: number
          rate_kobo: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
          work_submitted_at?: string | null
        }
        Update: {
          cancelled_by?: string | null
          check_in_distance_m?: number | null
          check_in_location?: unknown
          checked_in_at?: string | null
          closed_reason?: string | null
          confirm_by?: string | null
          created_at?: string
          dispute_category?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          disputed_by?: string | null
          distance_km?: number
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          expires_at?: string
          farm_id?: string | null
          farm_name?: string
          farmer_id?: string
          farmer_note?: string | null
          farmer_paid_at?: string | null
          farmer_paid_kobo?: number | null
          hectares_done?: number | null
          id?: string
          job_date?: string
          job_lga?: string | null
          job_location?: unknown
          job_state?: string | null
          listing_id?: string | null
          listing_kind?: Database["public"]["Enums"]["listing_kind"]
          listing_title?: string
          organization_id?: string | null
          payment_disputed?: boolean
          provider_id?: string
          provider_paid_at?: string | null
          provider_paid_kobo?: number | null
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          quantity?: number
          rate_kobo?: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_kobo?: number
          unit?: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
          work_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_disputed_by_fkey"
            columns: ["disputed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_request_responses: {
        Row: {
          created_at: string
          delivery_fee_kobo: number
          estimated_delivery_date: string
          id: string
          offered_grade: string | null
          offered_quantity: number
          request_id: string
          seller_id: string
          seller_notes: string | null
          status: string
          total_quote_kobo: number
          unit_price_kobo: number
          updated_at: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          delivery_fee_kobo?: number
          estimated_delivery_date: string
          id?: string
          offered_grade?: string | null
          offered_quantity: number
          request_id: string
          seller_id: string
          seller_notes?: string | null
          status?: string
          total_quote_kobo: number
          unit_price_kobo: number
          updated_at?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          delivery_fee_kobo?: number
          estimated_delivery_date?: string
          id?: string
          offered_grade?: string | null
          offered_quantity?: number
          request_id?: string
          seller_id?: string
          seller_notes?: string | null
          status?: string
          total_quote_kobo?: number
          unit_price_kobo?: number
          updated_at?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "buyer_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_request_responses_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_requests: {
        Row: {
          buyer_id: string
          buyer_org_id: string | null
          category_id: string
          created_at: string
          deadline_date: string
          delivery_coordinates: unknown
          delivery_location: string
          id: string
          notes: string | null
          request_number: string
          required_quantity: number
          status: string
          target_budget_kobo: number | null
          target_crop_or_commodity: string
          target_grade: string | null
          title: string
          unit: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_org_id?: string | null
          category_id: string
          created_at?: string
          deadline_date: string
          delivery_coordinates?: unknown
          delivery_location: string
          id?: string
          notes?: string | null
          request_number: string
          required_quantity: number
          status?: string
          target_budget_kobo?: number | null
          target_crop_or_commodity: string
          target_grade?: string | null
          title: string
          unit: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_org_id?: string | null
          category_id?: string
          created_at?: string
          deadline_date?: string
          delivery_coordinates?: unknown
          delivery_location?: string
          id?: string
          notes?: string | null
          request_number?: string
          required_quantity?: number
          status?: string
          target_budget_kobo?: number | null
          target_crop_or_commodity?: string
          target_grade?: string | null
          title?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_requests_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_feeds: {
        Row: {
          created_at: string
          profile_id: string
          rotated_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          rotated_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          rotated_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_feeds_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          channel: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          created_by: string | null
          document_version: string
          granted: boolean
          id: string
          profile_id: string
        }
        Insert: {
          channel?: string
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          created_by?: string | null
          document_version: string
          granted: boolean
          id?: string
          profile_id?: string
        }
        Update: {
          channel?: string
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          created_by?: string | null
          document_version?: string
          granted?: boolean
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          handled_at: string | null
          handled_by: string | null
          id: string
          language: Database["public"]["Enums"]["app_language"]
          message: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          message: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          language?: Database["public"]["Enums"]["app_language"]
          message?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_deliveries: {
        Row: {
          accepted: boolean
          contract_id: string
          created_at: string
          delivered_on: string
          grade: string | null
          id: string
          moisture_pct: number | null
          notes: string | null
          quantity_kg: number
          weighbridge_ref: string | null
        }
        Insert: {
          accepted?: boolean
          contract_id: string
          created_at?: string
          delivered_on?: string
          grade?: string | null
          id?: string
          moisture_pct?: number | null
          notes?: string | null
          quantity_kg: number
          weighbridge_ref?: string | null
        }
        Update: {
          accepted?: boolean
          contract_id?: string
          created_at?: string
          delivered_on?: string
          grade?: string | null
          id?: string
          moisture_pct?: number | null
          notes?: string | null
          quantity_kg?: number
          weighbridge_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_deliveries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "offtake_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      cooperative_aggregations: {
        Row: {
          buyer_name: string | null
          closes_on: string | null
          collection_point: string | null
          commodity: string
          created_at: string
          delivered_kg: number
          id: string
          member_count: number
          organization_id: string
          pledged_kg: number
          price_per_kg_kobo: number | null
          status: string
          target_kg: number
        }
        Insert: {
          buyer_name?: string | null
          closes_on?: string | null
          collection_point?: string | null
          commodity: string
          created_at?: string
          delivered_kg?: number
          id?: string
          member_count?: number
          organization_id: string
          pledged_kg?: number
          price_per_kg_kobo?: number | null
          status?: string
          target_kg: number
        }
        Update: {
          buyer_name?: string | null
          closes_on?: string | null
          collection_point?: string | null
          commodity?: string
          created_at?: string
          delivered_kg?: number
          id?: string
          member_count?: number
          organization_id?: string
          pledged_kg?: number
          price_per_kg_kobo?: number | null
          status?: string
          target_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "cooperative_aggregations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_alerts: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          crop_cycle_id: string | null
          farm_id: string
          id: string
          is_dismissed: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          action_url?: string | null
          category: string
          created_at?: string
          crop_cycle_id?: string | null
          farm_id: string
          id?: string
          is_dismissed?: boolean
          message: string
          severity?: string
          title: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          crop_cycle_id?: string | null
          farm_id?: string
          id?: string
          is_dismissed?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_alerts_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_alerts_legacy: {
        Row: {
          action_url: string | null
          category: Database["public"]["Enums"]["crop_alert_category"]
          created_at: string
          cycle_id: string
          id: string
          is_dismissed: boolean
          message: string
          severity: string
          title: string
        }
        Insert: {
          action_url?: string | null
          category: Database["public"]["Enums"]["crop_alert_category"]
          created_at?: string
          cycle_id: string
          id?: string
          is_dismissed?: boolean
          message: string
          severity: string
          title: string
        }
        Update: {
          action_url?: string | null
          category?: Database["public"]["Enums"]["crop_alert_category"]
          created_at?: string
          cycle_id?: string
          id?: string
          is_dismissed?: boolean
          message?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_alerts_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_cycle_operations: {
        Row: {
          actual_cost_kobo: number
          assigned_worker_id: string | null
          booking_id: string | null
          completed_date: string | null
          created_at: string
          crop_cycle_id: string
          evidence_urls: string[]
          id: string
          name: string
          notes: string | null
          operation_type: string
          required_inputs: Json
          required_machinery: string | null
          scheduled_date: string
          stage: string
          status: string
        }
        Insert: {
          actual_cost_kobo?: number
          assigned_worker_id?: string | null
          booking_id?: string | null
          completed_date?: string | null
          created_at?: string
          crop_cycle_id: string
          evidence_urls?: string[]
          id?: string
          name: string
          notes?: string | null
          operation_type: string
          required_inputs?: Json
          required_machinery?: string | null
          scheduled_date: string
          stage: string
          status?: string
        }
        Update: {
          actual_cost_kobo?: number
          assigned_worker_id?: string | null
          booking_id?: string | null
          completed_date?: string | null
          created_at?: string
          crop_cycle_id?: string
          evidence_urls?: string[]
          id?: string
          name?: string
          notes?: string | null
          operation_type?: string
          required_inputs?: Json
          required_machinery?: string | null
          scheduled_date?: string
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycle_operations_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycle_operations_booking_id_fkey1"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycle_operations_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_cycle_operations_legacy: {
        Row: {
          actual_cost_kobo: number
          actual_date: string | null
          booking_id: string | null
          completed_by: string | null
          created_at: string
          cycle_id: string
          id: string
          name: string
          notes: string | null
          relative_end_day: number
          relative_start_day: number
          required_equipment: string | null
          scheduled_end_date: string
          scheduled_start_date: string
          stage: string
          status: Database["public"]["Enums"]["crop_operation_status"]
          updated_at: string
        }
        Insert: {
          actual_cost_kobo?: number
          actual_date?: string | null
          booking_id?: string | null
          completed_by?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          name: string
          notes?: string | null
          relative_end_day: number
          relative_start_day: number
          required_equipment?: string | null
          scheduled_end_date: string
          scheduled_start_date: string
          stage: string
          status?: Database["public"]["Enums"]["crop_operation_status"]
          updated_at?: string
        }
        Update: {
          actual_cost_kobo?: number
          actual_date?: string | null
          booking_id?: string | null
          completed_by?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          name?: string
          notes?: string | null
          relative_end_day?: number
          relative_start_day?: number
          required_equipment?: string | null
          scheduled_end_date?: string
          scheduled_start_date?: string
          stage?: string
          status?: Database["public"]["Enums"]["crop_operation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycle_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycle_operations_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycle_operations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_cycles: {
        Row: {
          actual_area_ha: number | null
          actual_cost_kobo: number
          actual_harvest_date: string | null
          actual_yield_kg: number
          created_at: string
          created_by: string | null
          crop_id: string
          current_stage: string
          estimated_budget_kobo: number
          expected_harvest_date: string
          farm_id: string
          health_score: number
          health_status: string
          id: string
          notes: string | null
          plant_population_per_ha: number | null
          planting_date: string
          plants_alive: number | null
          plants_counted_on: string | null
          plants_planted: number | null
          plot_id: string | null
          season: string
          seed_quantity_kg: number | null
          standard_id: string | null
          status: string
          target_area_ha: number
          target_yield_kg: number
          updated_at: string
          variety_id: string | null
        }
        Insert: {
          actual_area_ha?: number | null
          actual_cost_kobo?: number
          actual_harvest_date?: string | null
          actual_yield_kg?: number
          created_at?: string
          created_by?: string | null
          crop_id: string
          current_stage?: string
          estimated_budget_kobo?: number
          expected_harvest_date: string
          farm_id: string
          health_score?: number
          health_status?: string
          id?: string
          notes?: string | null
          plant_population_per_ha?: number | null
          planting_date: string
          plants_alive?: number | null
          plants_counted_on?: string | null
          plants_planted?: number | null
          plot_id?: string | null
          season: string
          seed_quantity_kg?: number | null
          standard_id?: string | null
          status?: string
          target_area_ha: number
          target_yield_kg?: number
          updated_at?: string
          variety_id?: string | null
        }
        Update: {
          actual_area_ha?: number | null
          actual_cost_kobo?: number
          actual_harvest_date?: string | null
          actual_yield_kg?: number
          created_at?: string
          created_by?: string | null
          crop_id?: string
          current_stage?: string
          estimated_budget_kobo?: number
          expected_harvest_date?: string
          farm_id?: string
          health_score?: number
          health_status?: string
          id?: string
          notes?: string | null
          plant_population_per_ha?: number | null
          planting_date?: string
          plants_alive?: number | null
          plants_counted_on?: string | null
          plants_planted?: number | null
          plot_id?: string | null
          season?: string
          seed_quantity_kg?: number | null
          standard_id?: string | null
          status?: string
          target_area_ha?: number
          target_yield_kg?: number
          updated_at?: string
          variety_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_created_by_fkey1"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_plot_id_fkey1"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "farm_agronomic_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_cycles_legacy: {
        Row: {
          actual_cost_kobo: number
          actual_harvest_date: string | null
          actual_yield_kg: number
          created_at: string
          created_by: string
          crop_id: string
          current_stage: string
          estimated_budget_kobo: number
          expected_harvest_date: string
          health_score: number
          health_status: Database["public"]["Enums"]["crop_health_status"]
          id: string
          planting_date: string
          plot_id: string
          season: string
          status: Database["public"]["Enums"]["crop_cycle_status"]
          target_area_ha: number
          target_yield_kg: number
          updated_at: string
          variety_id: string
        }
        Insert: {
          actual_cost_kobo?: number
          actual_harvest_date?: string | null
          actual_yield_kg?: number
          created_at?: string
          created_by?: string
          crop_id: string
          current_stage?: string
          estimated_budget_kobo?: number
          expected_harvest_date: string
          health_score?: number
          health_status?: Database["public"]["Enums"]["crop_health_status"]
          id?: string
          planting_date: string
          plot_id: string
          season?: string
          status?: Database["public"]["Enums"]["crop_cycle_status"]
          target_area_ha: number
          target_yield_kg: number
          updated_at?: string
          variety_id: string
        }
        Update: {
          actual_cost_kobo?: number
          actual_harvest_date?: string | null
          actual_yield_kg?: number
          created_at?: string
          created_by?: string
          crop_id?: string
          current_stage?: string
          estimated_budget_kobo?: number
          expected_harvest_date?: string
          health_score?: number
          health_status?: Database["public"]["Enums"]["crop_health_status"]
          id?: string
          planting_date?: string
          plot_id?: string
          season?: string
          status?: Database["public"]["Enums"]["crop_cycle_status"]
          target_area_ha?: number
          target_yield_kg?: number
          updated_at?: string
          variety_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_cycles_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_harvests: {
        Row: {
          batch_code: string
          created_at: string
          crop_cycle_id: string
          destination: string
          harvest_date: string
          id: string
          loss_pct: number | null
          moisture_pct: number | null
          notes: string | null
          quality_grade: string | null
          quantity_kg: number
          recorded_by: string | null
          storage_location: string | null
        }
        Insert: {
          batch_code: string
          created_at?: string
          crop_cycle_id: string
          destination?: string
          harvest_date?: string
          id?: string
          loss_pct?: number | null
          moisture_pct?: number | null
          notes?: string | null
          quality_grade?: string | null
          quantity_kg: number
          recorded_by?: string | null
          storage_location?: string | null
        }
        Update: {
          batch_code?: string
          created_at?: string
          crop_cycle_id?: string
          destination?: string
          harvest_date?: string
          id?: string
          loss_pct?: number | null
          moisture_pct?: number | null
          notes?: string | null
          quality_grade?: string | null
          quantity_kg?: number
          recorded_by?: string | null
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_harvests_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_harvests_recorded_by_fkey1"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_harvests_legacy: {
        Row: {
          batch_code: string
          created_at: string
          cycle_id: string
          harvest_date: string
          id: string
          loss_pct: number | null
          moisture_pct: number | null
          notes: string | null
          quality_grade: string
          quantity_kg: number
          recorded_by: string | null
          storage_location: string | null
        }
        Insert: {
          batch_code: string
          created_at?: string
          cycle_id: string
          harvest_date: string
          id?: string
          loss_pct?: number | null
          moisture_pct?: number | null
          notes?: string | null
          quality_grade: string
          quantity_kg: number
          recorded_by?: string | null
          storage_location?: string | null
        }
        Update: {
          batch_code?: string
          created_at?: string
          cycle_id?: string
          harvest_date?: string
          id?: string
          loss_pct?: number | null
          moisture_pct?: number | null
          notes?: string | null
          quality_grade?: string
          quantity_kg?: number
          recorded_by?: string | null
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_harvests_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_harvests_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_input_applications_legacy: {
        Row: {
          active_ingredient: string | null
          applied_by: string | null
          applied_date: string
          area_applied_ha: number
          category: Database["public"]["Enums"]["crop_input_category"]
          chemical_id: string | null
          cost_kobo: number
          created_at: string
          cycle_id: string
          id: string
          operation_id: string | null
          pre_harvest_interval_days: number | null
          product_name: string
          rate_per_ha: number
          re_entry_interval_hours: number | null
          total_quantity: number
          unit: string
        }
        Insert: {
          active_ingredient?: string | null
          applied_by?: string | null
          applied_date: string
          area_applied_ha: number
          category: Database["public"]["Enums"]["crop_input_category"]
          chemical_id?: string | null
          cost_kobo?: number
          created_at?: string
          cycle_id: string
          id?: string
          operation_id?: string | null
          pre_harvest_interval_days?: number | null
          product_name: string
          rate_per_ha: number
          re_entry_interval_hours?: number | null
          total_quantity: number
          unit: string
        }
        Update: {
          active_ingredient?: string | null
          applied_by?: string | null
          applied_date?: string
          area_applied_ha?: number
          category?: Database["public"]["Enums"]["crop_input_category"]
          chemical_id?: string | null
          cost_kobo?: number
          created_at?: string
          cycle_id?: string
          id?: string
          operation_id?: string | null
          pre_harvest_interval_days?: number | null
          product_name?: string
          rate_per_ha?: number
          re_entry_interval_hours?: number | null
          total_quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_input_applications_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_input_applications_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_input_applications_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "crop_cycle_operations_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_measurements_legacy: {
        Row: {
          cycle_id: string
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          cycle_id: string
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          cycle_id?: string
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crop_measurements_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_measurements_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_observations: {
        Row: {
          category: string
          created_by: string | null
          crop_cycle_id: string
          description: string
          id: string
          location: unknown
          observed_at: string
          photo_urls: string[]
          recommended_action: string | null
          resolved: boolean
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          category: string
          created_by?: string | null
          crop_cycle_id: string
          description: string
          id?: string
          location?: unknown
          observed_at?: string
          photo_urls?: string[]
          recommended_action?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          category?: string
          created_by?: string | null
          crop_cycle_id?: string
          description?: string
          id?: string
          location?: unknown
          observed_at?: string
          photo_urls?: string[]
          recommended_action?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_observations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_observations_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_observations_legacy: {
        Row: {
          category: Database["public"]["Enums"]["scouting_category"]
          created_at: string
          cycle_id: string
          description: string
          id: string
          location: unknown
          observer_id: string
          photo_paths: string[] | null
          recommended_action: string | null
          resolved: boolean
          resolved_at: string | null
          severity: Database["public"]["Enums"]["scouting_severity"]
        }
        Insert: {
          category: Database["public"]["Enums"]["scouting_category"]
          created_at?: string
          cycle_id: string
          description: string
          id?: string
          location?: unknown
          observer_id?: string
          photo_paths?: string[] | null
          recommended_action?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity: Database["public"]["Enums"]["scouting_severity"]
        }
        Update: {
          category?: Database["public"]["Enums"]["scouting_category"]
          created_at?: string
          cycle_id?: string
          description?: string
          id?: string
          location?: unknown
          observer_id?: string
          photo_paths?: string[] | null
          recommended_action?: string | null
          resolved?: boolean
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["scouting_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "crop_observations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_observations_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_requests: {
        Row: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          profile_id: string | null
          reason: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["data_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          profile_id?: string | null
          reason?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["data_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["data_request_kind"]
          profile_id?: string | null
          reason?: string | null
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["data_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_requests_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          channel_code: string
          confidence: number
          cooldown_until: string | null
          created_at: string
          device_id: string
          farm_id: string
          id: string
          metadata: Json
          observation: string
          plot_id: string
          resolved_at: string | null
          rule_id: string | null
          severity: Database["public"]["Enums"]["device_alert_severity"]
          source: string
          status: Database["public"]["Enums"]["device_alert_status"]
          suggested_action: string
          sync_to_crop_alert_id: string | null
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channel_code: string
          confidence?: number
          cooldown_until?: string | null
          created_at?: string
          device_id: string
          farm_id: string
          id?: string
          metadata?: Json
          observation: string
          plot_id: string
          resolved_at?: string | null
          rule_id?: string | null
          severity?: Database["public"]["Enums"]["device_alert_severity"]
          source?: string
          status?: Database["public"]["Enums"]["device_alert_status"]
          suggested_action: string
          sync_to_crop_alert_id?: string | null
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          channel_code?: string
          confidence?: number
          cooldown_until?: string | null
          created_at?: string
          device_id?: string
          farm_id?: string
          id?: string
          metadata?: Json
          observation?: string
          plot_id?: string
          resolved_at?: string | null
          rule_id?: string | null
          severity?: Database["public"]["Enums"]["device_alert_severity"]
          source?: string
          status?: Database["public"]["Enums"]["device_alert_status"]
          suggested_action?: string
          sync_to_crop_alert_id?: string | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_alerts_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      device_commands: {
        Row: {
          audit_note: string | null
          command_type: string
          created_at: string
          created_by: string
          device_id: string
          executed_at: string | null
          failsafe_conditions: Json
          id: string
          parameters: Json
          status: string
        }
        Insert: {
          audit_note?: string | null
          command_type: string
          created_at?: string
          created_by: string
          device_id: string
          executed_at?: string | null
          failsafe_conditions?: Json
          id?: string
          parameters?: Json
          status?: string
        }
        Update: {
          audit_note?: string | null
          command_type?: string
          created_at?: string
          created_by?: string
          device_id?: string
          executed_at?: string | null
          failsafe_conditions?: Json
          id?: string
          parameters?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_events: {
        Row: {
          created_at: string
          details: string
          device_id: string
          event_type: Database["public"]["Enums"]["device_event_type"]
          id: string
          installation_id: string | null
          payload: Json
          severity: Database["public"]["Enums"]["device_alert_severity"]
        }
        Insert: {
          created_at?: string
          details: string
          device_id: string
          event_type: Database["public"]["Enums"]["device_event_type"]
          id?: string
          installation_id?: string | null
          payload?: Json
          severity?: Database["public"]["Enums"]["device_alert_severity"]
        }
        Update: {
          created_at?: string
          details?: string
          device_id?: string
          event_type?: Database["public"]["Enums"]["device_event_type"]
          id?: string
          installation_id?: string | null
          payload?: Json
          severity?: Database["public"]["Enums"]["device_alert_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "device_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_events_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "device_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      device_installations: {
        Row: {
          calibrated_at: string | null
          calibration_notes: string | null
          created_at: string
          crop_cycle_id: string | null
          device_id: string
          farm_id: string
          id: string
          installed_by: string | null
          is_active: boolean
          location: unknown
          next_calibration_due: string | null
          photo_url: string | null
          plot_id: string
          power_method: Database["public"]["Enums"]["power_source_type"]
          probe_installation_angle: number | null
          sensor_depth_cm: number | null
          site_survey: Json
          soil_texture: string | null
          updated_at: string
        }
        Insert: {
          calibrated_at?: string | null
          calibration_notes?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          device_id: string
          farm_id: string
          id?: string
          installed_by?: string | null
          is_active?: boolean
          location?: unknown
          next_calibration_due?: string | null
          photo_url?: string | null
          plot_id: string
          power_method?: Database["public"]["Enums"]["power_source_type"]
          probe_installation_angle?: number | null
          sensor_depth_cm?: number | null
          site_survey?: Json
          soil_texture?: string | null
          updated_at?: string
        }
        Update: {
          calibrated_at?: string | null
          calibration_notes?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          device_id?: string
          farm_id?: string
          id?: string
          installed_by?: string | null
          is_active?: boolean
          location?: unknown
          next_calibration_due?: string | null
          photo_url?: string | null
          plot_id?: string
          power_method?: Database["public"]["Enums"]["power_source_type"]
          probe_installation_angle?: number | null
          sensor_depth_cm?: number | null
          site_survey?: Json
          soil_texture?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_installations_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_installations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_installations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_installations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      device_models: {
        Row: {
          connectivity: Database["public"]["Enums"]["device_connectivity_type"]
          created_at: string
          default_firmware: string
          description: string | null
          hardware_revision: string
          id: string
          metadata: Json
          model_code: string
          name: string
          supported_power: Database["public"]["Enums"]["power_source_type"][]
          updated_at: string
          vendor: string
        }
        Insert: {
          connectivity: Database["public"]["Enums"]["device_connectivity_type"]
          created_at?: string
          default_firmware?: string
          description?: string | null
          hardware_revision?: string
          id?: string
          metadata?: Json
          model_code: string
          name: string
          supported_power?: Database["public"]["Enums"]["power_source_type"][]
          updated_at?: string
          vendor?: string
        }
        Update: {
          connectivity?: Database["public"]["Enums"]["device_connectivity_type"]
          created_at?: string
          default_firmware?: string
          description?: string | null
          hardware_revision?: string
          id?: string
          metadata?: Json
          model_code?: string
          name?: string
          supported_power?: Database["public"]["Enums"]["power_source_type"][]
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          assigned_org_id: string | null
          assigned_owner_id: string | null
          auth_token_hash: string | null
          battery_level_pct: number | null
          battery_voltage_mv: number | null
          created_at: string
          encryption_key_ref: string | null
          firmware_version: string
          id: string
          last_seen_at: string | null
          last_telemetry_seq: number
          metadata: Json
          model_id: string
          revoked_at: string | null
          secret_key_hash: string | null
          serial_number: string
          signal_rssi: number | null
          signal_snr: number | null
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
        }
        Insert: {
          assigned_org_id?: string | null
          assigned_owner_id?: string | null
          auth_token_hash?: string | null
          battery_level_pct?: number | null
          battery_voltage_mv?: number | null
          created_at?: string
          encryption_key_ref?: string | null
          firmware_version?: string
          id?: string
          last_seen_at?: string | null
          last_telemetry_seq?: number
          metadata?: Json
          model_id: string
          revoked_at?: string | null
          secret_key_hash?: string | null
          serial_number: string
          signal_rssi?: number | null
          signal_snr?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Update: {
          assigned_org_id?: string | null
          assigned_owner_id?: string | null
          auth_token_hash?: string | null
          battery_level_pct?: number | null
          battery_voltage_mv?: number | null
          created_at?: string
          encryption_key_ref?: string | null
          firmware_version?: string
          id?: string
          last_seen_at?: string | null
          last_telemetry_seq?: number
          metadata?: Json
          model_id?: string
          revoked_at?: string | null
          secret_key_hash?: string | null
          serial_number?: string
          signal_rssi?: number | null
          signal_snr?: number | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_agronomic_standards: {
        Row: {
          agro_zone: string
          created_at: string
          crop_or_livestock_id: string
          description: string | null
          id: string
          is_active: boolean
          parameters: Json
          source_authority: string
          standard_code: string
          title: string
          variety_or_breed: string | null
          version: string
        }
        Insert: {
          agro_zone?: string
          created_at?: string
          crop_or_livestock_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          parameters?: Json
          source_authority?: string
          standard_code: string
          title: string
          variety_or_breed?: string | null
          version?: string
        }
        Update: {
          agro_zone?: string
          created_at?: string
          crop_or_livestock_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parameters?: Json
          source_authority?: string
          standard_code?: string
          title?: string
          variety_or_breed?: string | null
          version?: string
        }
        Relationships: []
      }
      farm_attendance_records: {
        Row: {
          clock_in_at: string
          clock_in_location: unknown
          clock_out_at: string | null
          created_at: string
          daily_pay_kobo: number
          farm_id: string
          hours_worked: number | null
          id: string
          notes: string | null
          overtime_hours: number
          shift_name: string
          status: string
          worker_id: string
        }
        Insert: {
          clock_in_at?: string
          clock_in_location?: unknown
          clock_out_at?: string | null
          created_at?: string
          daily_pay_kobo?: number
          farm_id: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number
          shift_name?: string
          status?: string
          worker_id: string
        }
        Update: {
          clock_in_at?: string
          clock_in_location?: unknown
          clock_out_at?: string | null
          created_at?: string
          daily_pay_kobo?: number
          farm_id?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          overtime_hours?: number
          shift_name?: string
          status?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_attendance_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_attendance_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_attendance_records_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "farm_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_budget_lines: {
        Row: {
          actual_amount_kobo: number
          budget_id: string
          budgeted_amount_kobo: number
          category: string
          cost_type: string
          created_at: string
          id: string
          line_item: string
          notes: string | null
        }
        Insert: {
          actual_amount_kobo?: number
          budget_id: string
          budgeted_amount_kobo?: number
          category: string
          cost_type?: string
          created_at?: string
          id?: string
          line_item: string
          notes?: string | null
        }
        Update: {
          actual_amount_kobo?: number
          budget_id?: string
          budgeted_amount_kobo?: number
          category?: string
          cost_type?: string
          created_at?: string
          id?: string
          line_item?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_budget_lines_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "farm_budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_budgets: {
        Row: {
          created_at: string
          crop_cycle_id: string | null
          enterprise_type: string
          farm_id: string
          fiscal_year: number
          id: string
          notes: string | null
          planned_revenue_kobo: number
          season: string | null
          status: string
          title: string
          total_budget_kobo: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_cycle_id?: string | null
          enterprise_type: string
          farm_id: string
          fiscal_year?: number
          id?: string
          notes?: string | null
          planned_revenue_kobo?: number
          season?: string | null
          status?: string
          title: string
          total_budget_kobo?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_cycle_id?: string | null
          enterprise_type?: string
          farm_id?: string
          fiscal_year?: number
          id?: string
          notes?: string | null
          planned_revenue_kobo?: number
          season?: string | null
          status?: string
          title?: string
          total_budget_kobo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_budgets_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_budgets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_budgets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_equipment_assets: {
        Row: {
          assigned_worker_id: string | null
          category: string
          condition: string
          created_at: string
          equipment_name: string
          farm_id: string
          id: string
          quantity: number
          storage_location: string | null
        }
        Insert: {
          assigned_worker_id?: string | null
          category: string
          condition?: string
          created_at?: string
          equipment_name: string
          farm_id: string
          id?: string
          quantity?: number
          storage_location?: string | null
        }
        Update: {
          assigned_worker_id?: string | null
          category?: string
          condition?: string
          created_at?: string
          equipment_name?: string
          farm_id?: string
          id?: string
          quantity?: number
          storage_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_equipment_assets_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "farm_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_equipment_assets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_equipment_assets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_financial_transactions: {
        Row: {
          amount_kobo: number
          budget_id: string | null
          category: string
          counterparty: string | null
          created_at: string
          crop_cycle_id: string | null
          description: string
          farm_id: string
          id: string
          payment_method: string
          receipt_number: string | null
          recorded_by: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount_kobo: number
          budget_id?: string | null
          category: string
          counterparty?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          description: string
          farm_id: string
          id?: string
          payment_method?: string
          receipt_number?: string | null
          recorded_by?: string | null
          transaction_date?: string
          type: string
        }
        Update: {
          amount_kobo?: number
          budget_id?: string | null
          category?: string
          counterparty?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          description?: string
          farm_id?: string
          id?: string
          payment_method?: string
          receipt_number?: string | null
          recorded_by?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_financial_transactions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "farm_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_financial_transactions_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_financial_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_financial_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_financial_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_general_records: {
        Row: {
          created_at: string
          details: string | null
          document_url: string | null
          farm_id: string
          id: string
          record_type: string
          recorded_date: string
          title: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          document_url?: string | null
          farm_id: string
          id?: string
          record_type: string
          recorded_date?: string
          title: string
        }
        Update: {
          created_at?: string
          details?: string | null
          document_url?: string | null
          farm_id?: string
          id?: string
          record_type?: string
          recorded_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_general_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_general_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_inventory: {
        Row: {
          category: string
          created_at: string
          expiry_date: string | null
          farm_id: string
          id: string
          item_name: string
          location_id: string | null
          lot_number: string | null
          quantity: number
          reorder_threshold: number | null
          reserved_quantity: number
          sku: string | null
          storage_location: string | null
          unit: string
          unit_cost_kobo: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          expiry_date?: string | null
          farm_id: string
          id?: string
          item_name: string
          location_id?: string | null
          lot_number?: string | null
          quantity?: number
          reorder_threshold?: number | null
          reserved_quantity?: number
          sku?: string | null
          storage_location?: string | null
          unit: string
          unit_cost_kobo?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          expiry_date?: string | null
          farm_id?: string
          id?: string
          item_name?: string
          location_id?: string | null
          lot_number?: string | null
          quantity?: number
          reorder_threshold?: number | null
          reserved_quantity?: number
          sku?: string | null
          storage_location?: string | null
          unit?: string
          unit_cost_kobo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "farm_inventory_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_inventory_locations: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          is_active: boolean
          location_name: string
          location_type: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          is_active?: boolean
          location_name: string
          location_type: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          is_active?: boolean
          location_name?: string
          location_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_inventory_locations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_locations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_inventory_transactions: {
        Row: {
          batch_number: string | null
          created_at: string
          crop_cycle_id: string | null
          dest_location_id: string | null
          farm_id: string
          group_id: string | null
          id: string
          inventory_id: string
          notes: string | null
          quantity: number
          recorded_by: string | null
          reference_order_id: string | null
          source_location_id: string | null
          transaction_type: string
          unit_cost_kobo: number | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          dest_location_id?: string | null
          farm_id: string
          group_id?: string | null
          id?: string
          inventory_id: string
          notes?: string | null
          quantity: number
          recorded_by?: string | null
          reference_order_id?: string | null
          source_location_id?: string | null
          transaction_type: string
          unit_cost_kobo?: number | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          dest_location_id?: string | null
          farm_id?: string
          group_id?: string | null
          id?: string
          inventory_id?: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          reference_order_id?: string | null
          source_location_id?: string | null
          transaction_type?: string
          unit_cost_kobo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_inventory_transactions_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_dest_location_id_fkey"
            columns: ["dest_location_id"]
            isOneToOne: false
            referencedRelation: "farm_inventory_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "farm_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_inventory_transactions_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "farm_inventory_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock: {
        Row: {
          animal_type: string
          breed: string
          created_at: string
          farm_id: string
          head_count: number
          health_status: string
          housing_location: string | null
          id: string
          identifier: string
          notes: string | null
          purpose: string
          updated_at: string
        }
        Insert: {
          animal_type: string
          breed: string
          created_at?: string
          farm_id: string
          head_count?: number
          health_status?: string
          housing_location?: string | null
          id?: string
          identifier: string
          notes?: string | null
          purpose?: string
          updated_at?: string
        }
        Update: {
          animal_type?: string
          breed?: string
          created_at?: string
          farm_id?: string
          head_count?: number
          health_status?: string
          housing_location?: string | null
          id?: string
          identifier?: string
          notes?: string | null
          purpose?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock_animals: {
        Row: {
          acquisition_date: string
          acquisition_source: string | null
          birth_date: string | null
          breed: string | null
          created_at: string
          current_weight_kg: number | null
          dam_tag: string | null
          farm_id: string
          group_id: string | null
          health_status: string
          housing_location: string | null
          id: string
          notes: string | null
          rfid_code: string | null
          sex: string
          sire_tag: string | null
          species: string
          tag_number: string
          updated_at: string
        }
        Insert: {
          acquisition_date?: string
          acquisition_source?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          current_weight_kg?: number | null
          dam_tag?: string | null
          farm_id: string
          group_id?: string | null
          health_status?: string
          housing_location?: string | null
          id?: string
          notes?: string | null
          rfid_code?: string | null
          sex: string
          sire_tag?: string | null
          species: string
          tag_number: string
          updated_at?: string
        }
        Update: {
          acquisition_date?: string
          acquisition_source?: string | null
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          current_weight_kg?: number | null
          dam_tag?: string | null
          farm_id?: string
          group_id?: string | null
          health_status?: string
          housing_location?: string | null
          id?: string
          notes?: string | null
          rfid_code?: string | null
          sex?: string
          sire_tag?: string | null
          species?: string
          tag_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_animals_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_animals_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_animals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock_feedings: {
        Row: {
          cost_kobo: number
          created_at: string
          farm_id: string
          feed_type: string
          feeding_date: string
          group_id: string | null
          id: string
          notes: string | null
          quantity_kg: number
        }
        Insert: {
          cost_kobo?: number
          created_at?: string
          farm_id: string
          feed_type: string
          feeding_date?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          quantity_kg: number
        }
        Update: {
          cost_kobo?: number
          created_at?: string
          farm_id?: string
          feed_type?: string
          feeding_date?: string
          group_id?: string | null
          id?: string
          notes?: string | null
          quantity_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_feedings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_feedings_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_feedings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock_groups: {
        Row: {
          age_weeks: number | null
          animal_type: string
          breed: string | null
          created_at: string
          farm_id: string
          group_name: string
          health_status: string
          housing_location: string | null
          id: string
          legacy_livestock_id: string | null
          notes: string | null
          population: number
          purpose: string
          updated_at: string
        }
        Insert: {
          age_weeks?: number | null
          animal_type: string
          breed?: string | null
          created_at?: string
          farm_id: string
          group_name: string
          health_status?: string
          housing_location?: string | null
          id?: string
          legacy_livestock_id?: string | null
          notes?: string | null
          population: number
          purpose?: string
          updated_at?: string
        }
        Update: {
          age_weeks?: number | null
          animal_type?: string
          breed?: string | null
          created_at?: string
          farm_id?: string
          group_name?: string
          health_status?: string
          housing_location?: string | null
          id?: string
          legacy_livestock_id?: string | null
          notes?: string | null
          population?: number
          purpose?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_groups_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_groups_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock_health_events: {
        Row: {
          administered_on: string
          animal_id: string | null
          cost_kobo: number
          created_at: string
          disease_or_condition: string | null
          dosage: string | null
          event_type: string
          farm_id: string
          group_id: string | null
          head_affected: number | null
          id: string
          medication_name: string | null
          notes: string | null
          vet_name: string | null
          withdrawal_end_date: string | null
          withdrawal_period_days: number
        }
        Insert: {
          administered_on?: string
          animal_id?: string | null
          cost_kobo?: number
          created_at?: string
          disease_or_condition?: string | null
          dosage?: string | null
          event_type: string
          farm_id: string
          group_id?: string | null
          head_affected?: number | null
          id?: string
          medication_name?: string | null
          notes?: string | null
          vet_name?: string | null
          withdrawal_end_date?: string | null
          withdrawal_period_days?: number
        }
        Update: {
          administered_on?: string
          animal_id?: string | null
          cost_kobo?: number
          created_at?: string
          disease_or_condition?: string | null
          dosage?: string | null
          event_type?: string
          farm_id?: string
          group_id?: string | null
          head_affected?: number | null
          id?: string
          medication_name?: string | null
          notes?: string | null
          vet_name?: string | null
          withdrawal_end_date?: string | null
          withdrawal_period_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_health_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_health_events_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_health_events_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_health_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_livestock_production_logs: {
        Row: {
          created_at: string
          destination: string
          farm_id: string
          group_id: string | null
          id: string
          log_date: string
          product_type: string
          quality_grade: string | null
          quantity: number
          revenue_kobo: number
          unit: string
        }
        Insert: {
          created_at?: string
          destination?: string
          farm_id: string
          group_id?: string | null
          id?: string
          log_date?: string
          product_type: string
          quality_grade?: string | null
          quantity: number
          revenue_kobo?: number
          unit: string
        }
        Update: {
          created_at?: string
          destination?: string
          farm_id?: string
          group_id?: string | null
          id?: string
          log_date?: string
          product_type?: string
          quality_grade?: string | null
          quantity?: number
          revenue_kobo?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_livestock_production_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_production_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_livestock_production_logs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_machinery_assets: {
        Row: {
          asset_code: string
          category: string
          created_at: string
          current_status: string
          engine_hours: number
          farm_id: string
          fuel_type: string
          hourly_internal_rate_kobo: number
          id: string
          listing_id: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_service_hours: number | null
          purchase_value_kobo: number | null
          registration_number: string | null
          updated_at: string
          year_of_manufacture: number | null
        }
        Insert: {
          asset_code: string
          category: string
          created_at?: string
          current_status?: string
          engine_hours?: number
          farm_id: string
          fuel_type?: string
          hourly_internal_rate_kobo?: number
          id?: string
          listing_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_service_hours?: number | null
          purchase_value_kobo?: number | null
          registration_number?: string | null
          updated_at?: string
          year_of_manufacture?: number | null
        }
        Update: {
          asset_code?: string
          category?: string
          created_at?: string
          current_status?: string
          engine_hours?: number
          farm_id?: string
          fuel_type?: string
          hourly_internal_rate_kobo?: number
          id?: string
          listing_id?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_service_hours?: number | null
          purchase_value_kobo?: number | null
          registration_number?: string | null
          updated_at?: string
          year_of_manufacture?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_machinery_assets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_assets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_assets_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_machinery_maintenance: {
        Row: {
          cost_kobo: number
          created_at: string
          description: string
          engine_hours_at: number | null
          farm_id: string
          id: string
          machinery_id: string
          service_date: string
          service_type: string
          status: string
          vendor: string | null
        }
        Insert: {
          cost_kobo?: number
          created_at?: string
          description: string
          engine_hours_at?: number | null
          farm_id: string
          id?: string
          machinery_id: string
          service_date?: string
          service_type: string
          status?: string
          vendor?: string | null
        }
        Update: {
          cost_kobo?: number
          created_at?: string
          description?: string
          engine_hours_at?: number | null
          farm_id?: string
          id?: string
          machinery_id?: string
          service_date?: string
          service_type?: string
          status?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_machinery_maintenance_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_maintenance_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_maintenance_machinery_id_fkey"
            columns: ["machinery_id"]
            isOneToOne: false
            referencedRelation: "farm_machinery_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_machinery_usage_logs: {
        Row: {
          area_covered_ha: number
          created_at: string
          crop_cycle_id: string | null
          end_time: string
          farm_id: string
          fuel_litres_consumed: number
          hours_operated: number
          id: string
          machinery_id: string
          notes: string | null
          operation_name: string
          operational_cost_kobo: number
          operator_id: string | null
          plot_id: string | null
          start_time: string
        }
        Insert: {
          area_covered_ha?: number
          created_at?: string
          crop_cycle_id?: string | null
          end_time: string
          farm_id: string
          fuel_litres_consumed?: number
          hours_operated: number
          id?: string
          machinery_id: string
          notes?: string | null
          operation_name: string
          operational_cost_kobo?: number
          operator_id?: string | null
          plot_id?: string | null
          start_time: string
        }
        Update: {
          area_covered_ha?: number
          created_at?: string
          crop_cycle_id?: string | null
          end_time?: string
          farm_id?: string
          fuel_litres_consumed?: number
          hours_operated?: number
          id?: string
          machinery_id?: string
          notes?: string | null
          operation_name?: string
          operational_cost_kobo?: number
          operator_id?: string | null
          plot_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_machinery_usage_logs_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_usage_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_usage_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_usage_logs_machinery_id_fkey"
            columns: ["machinery_id"]
            isOneToOne: false
            referencedRelation: "farm_machinery_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_usage_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "farm_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_machinery_usage_logs_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_operational_tasks: {
        Row: {
          actual_duration_hours: number | null
          assigned_worker_id: string | null
          category: string
          completed_date: string | null
          created_at: string
          crop_cycle_id: string | null
          description: string | null
          direct_cost_kobo: number
          due_date: string
          estimated_duration_hours: number | null
          evidence_urls: string[]
          farm_id: string
          id: string
          livestock_group_id: string | null
          notes: string | null
          plot_id: string | null
          priority: string
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_duration_hours?: number | null
          assigned_worker_id?: string | null
          category?: string
          completed_date?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          description?: string | null
          direct_cost_kobo?: number
          due_date?: string
          estimated_duration_hours?: number | null
          evidence_urls?: string[]
          farm_id: string
          id?: string
          livestock_group_id?: string | null
          notes?: string | null
          plot_id?: string | null
          priority?: string
          start_date?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_duration_hours?: number | null
          assigned_worker_id?: string | null
          category?: string
          completed_date?: string | null
          created_at?: string
          crop_cycle_id?: string | null
          description?: string | null
          direct_cost_kobo?: number
          due_date?: string
          estimated_duration_hours?: number | null
          evidence_urls?: string[]
          farm_id?: string
          id?: string
          livestock_group_id?: string | null
          notes?: string | null
          plot_id?: string | null
          priority?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_operational_tasks_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "farm_workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operational_tasks_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operational_tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operational_tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operational_tasks_livestock_group_id_fkey"
            columns: ["livestock_group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operational_tasks_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_operations: {
        Row: {
          action_label: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          crop_area: string | null
          crop_cycle_id: string | null
          farm_id: string
          id: string
          location: string | null
          name: string
          notes: string | null
          plot_id: string | null
          resource: string | null
          resource_icon: string | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["farm_operation_status"]
          subtext: string | null
          timeline: string | null
          timing_note: string | null
          updated_at: string
        }
        Insert: {
          action_label?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_area?: string | null
          crop_cycle_id?: string | null
          farm_id: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          plot_id?: string | null
          resource?: string | null
          resource_icon?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["farm_operation_status"]
          subtext?: string | null
          timeline?: string | null
          timing_note?: string | null
          updated_at?: string
        }
        Update: {
          action_label?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crop_area?: string | null
          crop_cycle_id?: string | null
          farm_id?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          plot_id?: string | null
          resource?: string | null
          resource_icon?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["farm_operation_status"]
          subtext?: string | null
          timeline?: string | null
          timing_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operations_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_operations_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_plan_actual_variances: {
        Row: {
          actual_value: number
          crop_cycle_id: string | null
          entity_type: string
          farm_id: string
          farmer_deviation_reason: string | null
          group_id: string | null
          id: string
          is_farmer_override: boolean
          metric_name: string
          plan_value: number
          recorded_at: string
          standard_id: string | null
          standard_value: number
          unit: string
          variance_plan_vs_actual: number | null
          variance_standard_vs_actual: number | null
        }
        Insert: {
          actual_value: number
          crop_cycle_id?: string | null
          entity_type: string
          farm_id: string
          farmer_deviation_reason?: string | null
          group_id?: string | null
          id?: string
          is_farmer_override?: boolean
          metric_name: string
          plan_value: number
          recorded_at?: string
          standard_id?: string | null
          standard_value: number
          unit: string
          variance_plan_vs_actual?: number | null
          variance_standard_vs_actual?: number | null
        }
        Update: {
          actual_value?: number
          crop_cycle_id?: string | null
          entity_type?: string
          farm_id?: string
          farmer_deviation_reason?: string | null
          group_id?: string | null
          id?: string
          is_farmer_override?: boolean
          metric_name?: string
          plan_value?: number
          recorded_at?: string
          standard_id?: string | null
          standard_value?: number
          unit?: string
          variance_plan_vs_actual?: number | null
          variance_standard_vs_actual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "farm_plan_actual_variances_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_plan_actual_variances_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_plan_actual_variances_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_plan_actual_variances_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "farm_livestock_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_plan_actual_variances_standard_id_fkey"
            columns: ["standard_id"]
            isOneToOne: false
            referencedRelation: "farm_agronomic_standards"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_workers: {
        Row: {
          created_at: string
          daily_wage_kobo: number
          emergency_contact: string | null
          employment_type: string
          farm_id: string
          full_name: string
          id: string
          joined_date: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_wage_kobo?: number
          emergency_contact?: string | null
          employment_type?: string
          farm_id: string
          full_name: string
          id?: string
          joined_date?: string | null
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_wage_kobo?: number
          emergency_contact?: string | null
          employment_type?: string
          farm_id?: string
          full_name?: string
          id?: string
          joined_date?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_workers_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farm_workers_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_zones: {
        Row: {
          boundary: unknown
          created_at: string
          description: string
          name: string
          updated_at: string
          zone: Database["public"]["Enums"]["farm_zone"]
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          description: string
          name: string
          updated_at?: string
          zone: Database["public"]["Enums"]["farm_zone"]
        }
        Update: {
          boundary?: unknown
          created_at?: string
          description?: string
          name?: string
          updated_at?: string
          zone?: Database["public"]["Enums"]["farm_zone"]
        }
        Relationships: []
      }
      farms: {
        Row: {
          accessibility_level: string | null
          address_hint: string | null
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
          created_by: string | null
          farm_code: string | null
          id: string
          irrigation_systems: string[]
          lga: string | null
          location: unknown
          name: string
          onboarded_by: string | null
          organization_id: string | null
          owner_id: string
          ownership_type: string | null
          slope_type: string | null
          soil_information: Json
          source: Database["public"]["Enums"]["record_source"]
          state: string | null
          status: string
          updated_at: string
          water_sources: string[]
          zone: Database["public"]["Enums"]["farm_zone"]
          zone_corrected_at: string | null
          zone_corrected_by: string | null
        }
        Insert: {
          accessibility_level?: string | null
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          farm_code?: string | null
          id?: string
          irrigation_systems?: string[]
          lga?: string | null
          location: unknown
          name: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          ownership_type?: string | null
          slope_type?: string | null
          soil_information?: Json
          source?: Database["public"]["Enums"]["record_source"]
          state?: string | null
          status?: string
          updated_at?: string
          water_sources?: string[]
          zone?: Database["public"]["Enums"]["farm_zone"]
          zone_corrected_at?: string | null
          zone_corrected_by?: string | null
        }
        Update: {
          accessibility_level?: string | null
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          farm_code?: string | null
          id?: string
          irrigation_systems?: string[]
          lga?: string | null
          location?: unknown
          name?: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          ownership_type?: string | null
          slope_type?: string | null
          soil_information?: Json
          source?: Database["public"]["Enums"]["record_source"]
          state?: string | null
          status?: string
          updated_at?: string
          water_sources?: string[]
          zone?: Database["public"]["Enums"]["farm_zone"]
          zone_corrected_at?: string | null
          zone_corrected_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_onboarded_by_fkey"
            columns: ["onboarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_zone_corrected_by_fkey"
            columns: ["zone_corrected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string
          enabled: boolean
          key: string
          states: string[] | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description: string
          enabled?: boolean
          key: string
          states?: string[] | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string
          enabled?: boolean
          key?: string
          states?: string[] | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_applications: {
        Row: {
          amount_awarded_kobo: number | null
          amount_requested_kobo: number
          applicant_id: string
          created_at: string
          farm_id: string | null
          id: string
          programme_id: string
          proposal: string | null
          score: number | null
          status: string
          submitted_at: string | null
        }
        Insert: {
          amount_awarded_kobo?: number | null
          amount_requested_kobo: number
          applicant_id: string
          created_at?: string
          farm_id?: string | null
          id?: string
          programme_id: string
          proposal?: string | null
          score?: number | null
          status?: string
          submitted_at?: string | null
        }
        Update: {
          amount_awarded_kobo?: number | null
          amount_requested_kobo?: number
          applicant_id?: string
          created_at?: string
          farm_id?: string | null
          id?: string
          programme_id?: string
          proposal?: string | null
          score?: number | null
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "grant_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_programmes: {
        Row: {
          closes_on: string
          created_at: string
          description: string | null
          eligibility: string | null
          focus_area: string
          funder: string
          id: string
          max_award_kobo: number
          opens_on: string
          owner_id: string
          states: string[]
          status: string
          title: string
          total_pool_kobo: number | null
        }
        Insert: {
          closes_on: string
          created_at?: string
          description?: string | null
          eligibility?: string | null
          focus_area: string
          funder: string
          id?: string
          max_award_kobo: number
          opens_on: string
          owner_id: string
          states?: string[]
          status?: string
          title: string
          total_pool_kobo?: number | null
        }
        Update: {
          closes_on?: string
          created_at?: string
          description?: string | null
          eligibility?: string | null
          focus_area?: string
          funder?: string
          id?: string
          max_award_kobo?: number
          opens_on?: string
          owner_id?: string
          states?: string[]
          status?: string
          title?: string
          total_pool_kobo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_programmes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          alt_en: string
          alt_yo: string | null
          caption_en: string | null
          caption_yo: string | null
          created_at: string
          created_by: string | null
          id: string
          image_path: string
          link_url: string | null
          position: number
          published: boolean
          title_en: string | null
          title_yo: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt_en: string
          alt_yo?: string | null
          caption_en?: string | null
          caption_yo?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path: string
          link_url?: string | null
          position?: number
          published?: boolean
          title_en?: string | null
          title_yo?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt_en?: string
          alt_yo?: string | null
          caption_en?: string | null
          caption_yo?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string
          link_url?: string | null
          position?: number
          published?: boolean
          title_en?: string | null
          title_yo?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hero_slides_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      id_claims: {
        Row: {
          claimed_at: string
          id_hash: string
          kind: string
          profile_id: string
        }
        Insert: {
          claimed_at?: string
          id_hash: string
          kind: string
          profile_id: string
        }
        Update: {
          claimed_at?: string
          id_hash?: string
          kind?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_programmes: {
        Row: {
          budget_kobo: number
          created_at: string
          end_date: string | null
          focus: string
          id: string
          name: string
          organisation: string
          owner_id: string
          spent_kobo: number
          start_date: string
          states: string[]
          status: string
          target_farmers: number
        }
        Insert: {
          budget_kobo?: number
          created_at?: string
          end_date?: string | null
          focus: string
          id?: string
          name: string
          organisation: string
          owner_id: string
          spent_kobo?: number
          start_date: string
          states?: string[]
          status?: string
          target_farmers?: number
        }
        Update: {
          budget_kobo?: number
          created_at?: string
          end_date?: string | null
          focus?: string
          id?: string
          name?: string
          organisation?: string
          owner_id?: string
          spent_kobo?: number
          start_date?: string
          states?: string[]
          status?: string
          target_farmers?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_programmes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          amount_claimed_kobo: number
          amount_paid_kobo: number
          cause: string
          claim_number: string
          created_at: string
          description: string | null
          holder_id: string
          id: string
          incident_date: string
          policy_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_claimed_kobo: number
          amount_paid_kobo?: number
          cause: string
          claim_number: string
          created_at?: string
          description?: string | null
          holder_id: string
          id?: string
          incident_date: string
          policy_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_claimed_kobo?: number
          amount_paid_kobo?: number
          cause?: string
          claim_number?: string
          created_at?: string
          description?: string | null
          holder_id?: string
          id?: string
          incident_date?: string
          policy_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          cover_type: string
          created_at: string
          crop_or_asset: string | null
          end_date: string
          farm_id: string | null
          holder_id: string
          id: string
          insurer_id: string | null
          insurer_name: string
          policy_number: string
          premium_kobo: number
          product: string
          start_date: string
          status: string
          sum_insured_kobo: number
          trigger_terms: Json
        }
        Insert: {
          cover_type: string
          created_at?: string
          crop_or_asset?: string | null
          end_date: string
          farm_id?: string | null
          holder_id: string
          id?: string
          insurer_id?: string | null
          insurer_name: string
          policy_number: string
          premium_kobo: number
          product: string
          start_date: string
          status?: string
          sum_insured_kobo: number
          trigger_terms?: Json
        }
        Update: {
          cover_type?: string
          created_at?: string
          crop_or_asset?: string | null
          end_date?: string
          farm_id?: string | null
          holder_id?: string
          id?: string
          insurer_id?: string | null
          insurer_name?: string
          policy_number?: string
          premium_kobo?: number
          product?: string
          start_date?: string
          status?: string
          sum_insured_kobo?: number
          trigger_terms?: Json
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          config: Json
          mode: Database["public"]["Enums"]["integration_mode"]
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          mode?: Database["public"]["Enums"]["integration_mode"]
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          mode?: Database["public"]["Enums"]["integration_mode"]
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_provider_fkey"
            columns: ["provider"]
            isOneToOne: true
            referencedRelation: "integration_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "integration_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_code: string | null
          http_status: number | null
          id: number
          kind: Database["public"]["Enums"]["integration_kind"]
          mode: Database["public"]["Enums"]["integration_mode"]
          operation: string
          provider: string
          success: boolean
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          http_status?: number | null
          id?: never
          kind: Database["public"]["Enums"]["integration_kind"]
          mode: Database["public"]["Enums"]["integration_mode"]
          operation: string
          provider: string
          success: boolean
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          http_status?: number | null
          id?: never
          kind?: Database["public"]["Enums"]["integration_kind"]
          mode?: Database["public"]["Enums"]["integration_mode"]
          operation?: string
          provider?: string
          success?: boolean
        }
        Relationships: []
      }
      integration_providers: {
        Row: {
          code: string
          config_fields: Json
          description: string
          docs_url: string | null
          implemented: boolean
          kind: Database["public"]["Enums"]["integration_kind"]
          name: string
          secret_fields: Json
          sort_order: number
          test_only: boolean
        }
        Insert: {
          code: string
          config_fields?: Json
          description: string
          docs_url?: string | null
          implemented?: boolean
          kind: Database["public"]["Enums"]["integration_kind"]
          name: string
          secret_fields?: Json
          sort_order?: number
          test_only?: boolean
        }
        Update: {
          code?: string
          config_fields?: Json
          description?: string
          docs_url?: string | null
          implemented?: boolean
          kind?: Database["public"]["Enums"]["integration_kind"]
          name?: string
          secret_fields?: Json
          sort_order?: number
          test_only?: boolean
        }
        Relationships: []
      }
      integration_secrets: {
        Row: {
          field: string
          hint: string | null
          mode: Database["public"]["Enums"]["integration_mode"]
          provider: string
          updated_at: string
          updated_by: string | null
          vault_secret_id: string
        }
        Insert: {
          field: string
          hint?: string | null
          mode: Database["public"]["Enums"]["integration_mode"]
          provider: string
          updated_at?: string
          updated_by?: string | null
          vault_secret_id: string
        }
        Update: {
          field?: string
          hint?: string | null
          mode?: Database["public"]["Enums"]["integration_mode"]
          provider?: string
          updated_at?: string
          updated_by?: string | null
          vault_secret_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_secrets_provider_fkey"
            columns: ["provider"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "integration_secrets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          active_provider: string
          kind: Database["public"]["Enums"]["integration_kind"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_provider: string
          kind: Database["public"]["Enums"]["integration_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_provider?: string
          kind?: Database["public"]["Enums"]["integration_kind"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_active_provider_kind_fkey"
            columns: ["active_provider", "kind"]
            isOneToOne: false
            referencedRelation: "integration_providers"
            referencedColumns: ["code", "kind"]
          },
          {
            foreignKeyName: "integration_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_commitments: {
        Row: {
          amount_kobo: number
          created_at: string
          id: string
          investor_id: string
          offering_id: string
          returned_kobo: number
          status: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          id?: string
          investor_id: string
          offering_id: string
          returned_kobo?: number
          status?: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          id?: string
          investor_id?: string
          offering_id?: string
          returned_kobo?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_commitments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_commitments_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "investment_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_offerings: {
        Row: {
          closes_on: string
          commodity: string
          created_at: string
          expected_return_pct: number
          id: string
          min_ticket_kobo: number
          raised_kobo: number
          risk_rating: string
          sponsor_id: string
          status: string
          structure: string
          target_raise_kobo: number
          tenor_months: number
          title: string
        }
        Insert: {
          closes_on: string
          commodity: string
          created_at?: string
          expected_return_pct: number
          id?: string
          min_ticket_kobo: number
          raised_kobo?: number
          risk_rating?: string
          sponsor_id: string
          status?: string
          structure: string
          target_raise_kobo: number
          tenor_months: number
          title: string
        }
        Update: {
          closes_on?: string
          commodity?: string
          created_at?: string
          expected_return_pct?: number
          id?: string
          min_ticket_kobo?: number
          raised_kobo?: number
          risk_rating?: string
          sponsor_id?: string
          status?: string
          structure?: string
          target_raise_kobo?: number
          tenor_months?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_offerings_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      irrigation_events: {
        Row: {
          created_at: string
          ended_at: string | null
          energy_kwh: number | null
          farm_id: string
          id: string
          notes: string | null
          started_at: string
          status: string
          trigger: string
          volume_litres: number | null
          zone_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          energy_kwh?: number | null
          farm_id: string
          id?: string
          notes?: string | null
          started_at: string
          status?: string
          trigger?: string
          volume_litres?: number | null
          zone_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          energy_kwh?: number | null
          farm_id?: string
          id?: string
          notes?: string | null
          started_at?: string
          status?: string
          trigger?: string
          volume_litres?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "irrigation_events_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "irrigation_events_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "irrigation_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "irrigation_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      irrigation_zones: {
        Row: {
          area_ha: number | null
          created_at: string
          current_moisture_pct: number | null
          farm_id: string
          flow_rate_lpm: number | null
          id: string
          method: string
          name: string
          plot_id: string | null
          schedule: Json
          status: string
          target_moisture_pct: number | null
          updated_at: string
          water_source: string | null
        }
        Insert: {
          area_ha?: number | null
          created_at?: string
          current_moisture_pct?: number | null
          farm_id: string
          flow_rate_lpm?: number | null
          id?: string
          method: string
          name: string
          plot_id?: string | null
          schedule?: Json
          status?: string
          target_moisture_pct?: number | null
          updated_at?: string
          water_source?: string | null
        }
        Update: {
          area_ha?: number | null
          created_at?: string
          current_moisture_pct?: number | null
          farm_id?: string
          flow_rate_lpm?: number | null
          id?: string
          method?: string
          name?: string
          plot_id?: string | null
          schedule?: Json
          status?: string
          target_moisture_pct?: number | null
          updated_at?: string
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "irrigation_zones_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "irrigation_zones_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "irrigation_zones_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_rates: {
        Row: {
          created_at: string
          created_by: string | null
          listing_id: string
          rate_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          listing_id: string
          rate_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          listing_id?: string
          rate_kobo?: number
          unit?: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_rates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_rates_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"] | null
          id: string
          kind: Database["public"]["Enums"]["listing_kind"]
          location: unknown
          operator_included: boolean
          owner_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          service_radius_km: number
          status: Database["public"]["Enums"]["listing_status"]
          suspended_at: string | null
          suspended_reason: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          id?: string
          kind: Database["public"]["Enums"]["listing_kind"]
          location: unknown
          operator_included?: boolean
          owner_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          service_radius_km?: number
          status?: Database["public"]["Enums"]["listing_status"]
          suspended_at?: string | null
          suspended_reason?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          id?: string
          kind?: Database["public"]["Enums"]["listing_kind"]
          location?: unknown
          operator_included?: boolean
          owner_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          service_radius_km?: number
          status?: Database["public"]["Enums"]["listing_status"]
          suspended_at?: string | null
          suspended_reason?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          amount_kobo: number
          applicant_id: string
          created_at: string
          decided_at: string | null
          disbursed_kobo: number
          farm_id: string | null
          id: string
          interest_rate_pct: number | null
          lender_id: string | null
          lender_name: string
          product: string
          purpose: string
          readiness_score: number | null
          reference: string
          repaid_kobo: number
          status: string
          submitted_at: string | null
          tenor_months: number
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          applicant_id: string
          created_at?: string
          decided_at?: string | null
          disbursed_kobo?: number
          farm_id?: string | null
          id?: string
          interest_rate_pct?: number | null
          lender_id?: string | null
          lender_name: string
          product: string
          purpose: string
          readiness_score?: number | null
          reference: string
          repaid_kobo?: number
          status?: string
          submitted_at?: string | null
          tenor_months: number
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          applicant_id?: string
          created_at?: string
          decided_at?: string | null
          disbursed_kobo?: number
          farm_id?: string | null
          id?: string
          interest_rate_pct?: number | null
          lender_id?: string | null
          lender_name?: string
          product?: string
          purpose?: string
          readiness_score?: number | null
          reference?: string
          repaid_kobo?: number
          status?: string
          submitted_at?: string | null
          tenor_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_applications_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machinery_telemetry: {
        Row: {
          engine_hours: number | null
          engine_rpm: number | null
          engine_temp_c: number | null
          farm_id: string
          fuel_pct: number | null
          heading_deg: number | null
          id: string
          location: unknown
          machinery_id: string
          recorded_at: string
          speed_kmh: number | null
          status: string
        }
        Insert: {
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_temp_c?: number | null
          farm_id: string
          fuel_pct?: number | null
          heading_deg?: number | null
          id?: string
          location?: unknown
          machinery_id: string
          recorded_at?: string
          speed_kmh?: number | null
          status?: string
        }
        Update: {
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_temp_c?: number | null
          farm_id?: string
          fuel_pct?: number | null
          heading_deg?: number | null
          id?: string
          location?: unknown
          machinery_id?: string
          recorded_at?: string
          speed_kmh?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "machinery_telemetry_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_telemetry_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_telemetry_machinery_id_fkey"
            columns: ["machinery_id"]
            isOneToOne: false
            referencedRelation: "farm_machinery_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          commodity: string
          created_at: string
          id: string
          is_demo: boolean
          market: string
          observed_on: string
          price_kobo: number
          source: string
          state: string
          unit: string
        }
        Insert: {
          commodity: string
          created_at?: string
          id?: string
          is_demo?: boolean
          market: string
          observed_on: string
          price_kobo: number
          source?: string
          state: string
          unit: string
        }
        Update: {
          commodity?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          market?: string
          observed_on?: string
          price_kobo?: number
          source?: string
          state?: string
          unit?: string
        }
        Relationships: []
      }
      marketplace_categories: {
        Row: {
          attributes_schema: Json
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          attributes_schema?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          attributes_schema?: Json
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_delivery_proofs: {
        Row: {
          confirmation_otp: string | null
          id: string
          location: unknown
          photo_urls: string[]
          recipient_name: string
          recipient_phone: string | null
          recorded_at: string
          recorded_by: string | null
          shipment_id: string
          signature_url: string | null
        }
        Insert: {
          confirmation_otp?: string | null
          id?: string
          location: unknown
          photo_urls?: string[]
          recipient_name: string
          recipient_phone?: string | null
          recorded_at?: string
          recorded_by?: string | null
          shipment_id: string
          signature_url?: string | null
        }
        Update: {
          confirmation_otp?: string | null
          id?: string
          location?: unknown
          photo_urls?: string[]
          recipient_name?: string
          recipient_phone?: string | null
          recorded_at?: string
          recorded_by?: string | null
          shipment_id?: string
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_proofs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_delivery_proofs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "marketplace_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_disputes: {
        Row: {
          created_at: string
          description: string
          evidence_urls: string[]
          fulfilment_id: string | null
          id: string
          initiator_id: string
          order_id: string
          reason: string
          refund_amount_kobo: number | null
          resolution: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          evidence_urls?: string[]
          fulfilment_id?: string | null
          id?: string
          initiator_id: string
          order_id: string
          reason: string
          refund_amount_kobo?: number | null
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          evidence_urls?: string[]
          fulfilment_id?: string | null
          id?: string
          initiator_id?: string
          order_id?: string
          reason?: string
          refund_amount_kobo?: number | null
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_fulfilment_id_fkey"
            columns: ["fulfilment_id"]
            isOneToOne: false
            referencedRelation: "marketplace_fulfilments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_disputes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_escrows: {
        Row: {
          amount_kobo: number
          auto_release_deadline: string | null
          buyer_id: string
          commission_kobo: number
          created_at: string
          disputed_at: string | null
          fulfilment_id: string | null
          held_at: string
          id: string
          order_id: string
          refunded_at: string | null
          released_at: string | null
          seller_id: string
          seller_net_kobo: number
          settlement_reference: string | null
          status: string
        }
        Insert: {
          amount_kobo: number
          auto_release_deadline?: string | null
          buyer_id: string
          commission_kobo?: number
          created_at?: string
          disputed_at?: string | null
          fulfilment_id?: string | null
          held_at?: string
          id?: string
          order_id: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id: string
          seller_net_kobo: number
          settlement_reference?: string | null
          status?: string
        }
        Update: {
          amount_kobo?: number
          auto_release_deadline?: string | null
          buyer_id?: string
          commission_kobo?: number
          created_at?: string
          disputed_at?: string | null
          fulfilment_id?: string | null
          held_at?: string
          id?: string
          order_id?: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id?: string
          seller_net_kobo?: number
          settlement_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_escrows_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_escrows_fulfilment_id_fkey"
            columns: ["fulfilment_id"]
            isOneToOne: false
            referencedRelation: "marketplace_fulfilments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_escrows_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_escrows_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_fee_rules: {
        Row: {
          category_id: string | null
          commission_bps: number
          created_at: string
          effective_from: string
          effective_until: string | null
          escrow_fee_bps: number
          fixed_fee_kobo: number
          id: string
          is_active: boolean
          max_order_kobo: number | null
          min_order_kobo: number
          seller_type: string | null
        }
        Insert: {
          category_id?: string | null
          commission_bps?: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          escrow_fee_bps?: number
          fixed_fee_kobo?: number
          id?: string
          is_active?: boolean
          max_order_kobo?: number | null
          min_order_kobo?: number
          seller_type?: string | null
        }
        Update: {
          category_id?: string | null
          commission_bps?: number
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          escrow_fee_bps?: number
          fixed_fee_kobo?: number
          id?: string
          is_active?: boolean
          max_order_kobo?: number | null
          min_order_kobo?: number
          seller_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_fee_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_fulfilments: {
        Row: {
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_fee_kobo: number
          delivery_method: string
          dispatched_at: string | null
          fulfilment_number: string
          id: string
          notes: string | null
          order_id: string
          seller_id: string
          status: string
          subtotal_kobo: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee_kobo?: number
          delivery_method?: string
          dispatched_at?: string | null
          fulfilment_number: string
          id?: string
          notes?: string | null
          order_id: string
          seller_id: string
          status?: string
          subtotal_kobo: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_fee_kobo?: number
          delivery_method?: string
          dispatched_at?: string | null
          fulfilment_number?: string
          id?: string
          notes?: string | null
          order_id?: string
          seller_id?: string
          status?: string
          subtotal_kobo?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_fulfilments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_fulfilments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_inventory_lots: {
        Row: {
          allocated_quantity: number
          created_at: string
          expiry_date: string | null
          id: string
          listing_id: string
          lot_number: string
          physical_quantity: number
          reserved_quantity: number
          sold_quantity: number
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          allocated_quantity?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          listing_id: string
          lot_number: string
          physical_quantity: number
          reserved_quantity?: number
          sold_quantity?: number
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          allocated_quantity?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          listing_id?: string
          lot_number?: string
          physical_quantity?: number
          reserved_quantity?: number
          sold_quantity?: number
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_inventory_lots_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_journal_entries: {
        Row: {
          created_at: string
          current_hash: string
          description: string
          id: string
          previous_hash: string
          reference_id: string
          reference_type: string
        }
        Insert: {
          created_at?: string
          current_hash: string
          description: string
          id?: string
          previous_hash: string
          reference_id: string
          reference_type: string
        }
        Update: {
          created_at?: string
          current_hash?: string
          description?: string
          id?: string
          previous_hash?: string
          reference_id?: string
          reference_type?: string
        }
        Relationships: []
      }
      marketplace_journal_postings: {
        Row: {
          account_id: string
          amount_kobo: number
          direction: string
          entry_id: string
          id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          amount_kobo: number
          direction: string
          entry_id: string
          id?: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          amount_kobo?: number
          direction?: string
          entry_id?: string
          id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_journal_postings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "marketplace_ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_journal_postings_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "marketplace_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_ledger_accounts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          available_quantity: number
          base_price_kobo: number
          category_id: string
          created_at: string
          delivery_flat_rate_kobo: number
          delivery_options: string[]
          delivery_radius_km: number
          description: string | null
          id: string
          images: string[]
          is_verified: boolean
          listing_type: string
          location: unknown
          location_address: string | null
          location_lga: string | null
          location_state: string | null
          max_order_quantity: number | null
          metadata: Json
          min_order_quantity: number
          price_model: string
          product_id: string | null
          seller_id: string
          status: string
          title: string
          unit: string
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          available_quantity?: number
          base_price_kobo: number
          category_id: string
          created_at?: string
          delivery_flat_rate_kobo?: number
          delivery_options?: string[]
          delivery_radius_km?: number
          description?: string | null
          id?: string
          images?: string[]
          is_verified?: boolean
          listing_type: string
          location: unknown
          location_address?: string | null
          location_lga?: string | null
          location_state?: string | null
          max_order_quantity?: number | null
          metadata?: Json
          min_order_quantity?: number
          price_model: string
          product_id?: string | null
          seller_id: string
          status?: string
          title: string
          unit: string
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          available_quantity?: number
          base_price_kobo?: number
          category_id?: string
          created_at?: string
          delivery_flat_rate_kobo?: number
          delivery_options?: string[]
          delivery_radius_km?: number
          description?: string | null
          id?: string
          images?: string[]
          is_verified?: boolean
          listing_type?: string
          location?: unknown
          location_address?: string | null
          location_lga?: string | null
          location_state?: string | null
          max_order_quantity?: number | null
          metadata?: Json
          min_order_quantity?: number
          price_model?: string
          product_id?: string | null
          seller_id?: string
          status?: string
          title?: string
          unit?: string
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "marketplace_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_order_items: {
        Row: {
          commission_bps: number
          commission_kobo: number
          created_at: string
          id: string
          listing_id: string
          order_id: string
          quantity: number
          seller_earnings_kobo: number
          seller_id: string
          snapshot_data: Json
          subtotal_kobo: number
          title: string
          unit: string
          unit_price_kobo: number
        }
        Insert: {
          commission_bps?: number
          commission_kobo?: number
          created_at?: string
          id?: string
          listing_id: string
          order_id: string
          quantity: number
          seller_earnings_kobo: number
          seller_id: string
          snapshot_data?: Json
          subtotal_kobo: number
          title: string
          unit: string
          unit_price_kobo: number
        }
        Update: {
          commission_bps?: number
          commission_kobo?: number
          created_at?: string
          id?: string
          listing_id?: string
          order_id?: string
          quantity?: number
          seller_earnings_kobo?: number
          seller_id?: string
          snapshot_data?: Json
          subtotal_kobo?: number
          title?: string
          unit?: string
          unit_price_kobo?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          buyer_org_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          currency: string
          delivery_address: Json
          delivery_fee_kobo: number
          id: string
          idempotency_key: string | null
          items_subtotal_kobo: number
          order_number: string
          order_type: string
          paid_at: string | null
          payment_status: string
          placed_at: string | null
          platform_fee_kobo: number
          status: string
          total_amount_kobo: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          buyer_org_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivery_address?: Json
          delivery_fee_kobo?: number
          id?: string
          idempotency_key?: string | null
          items_subtotal_kobo: number
          order_number: string
          order_type?: string
          paid_at?: string | null
          payment_status?: string
          placed_at?: string | null
          platform_fee_kobo?: number
          status?: string
          total_amount_kobo: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          buyer_org_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivery_address?: Json
          delivery_fee_kobo?: number
          id?: string
          idempotency_key?: string | null
          items_subtotal_kobo?: number
          order_number?: string
          order_type?: string
          paid_at?: string | null
          payment_status?: string
          placed_at?: string | null
          platform_fee_kobo?: number
          status?: string
          total_amount_kobo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_orders_buyer_org_id_fkey"
            columns: ["buyer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_payments: {
        Row: {
          amount_kobo: number
          created_at: string
          currency: string
          gateway_response: Json
          id: string
          idempotency_key: string | null
          order_id: string
          payment_reference: string
          provider: string
          status: string
          verified_at: string | null
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          currency?: string
          gateway_response?: Json
          id?: string
          idempotency_key?: string | null
          order_id: string
          payment_reference: string
          provider: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          currency?: string
          gateway_response?: Json
          id?: string
          idempotency_key?: string | null
          order_id?: string
          payment_reference?: string
          provider?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_produce_provenance: {
        Row: {
          batch_code: string | null
          certifications: string[]
          created_at: string
          crop_cycle_id: string | null
          expected_harvest_date: string | null
          farm_id: string | null
          grade: string | null
          harvest_date: string | null
          harvest_id: string | null
          id: string
          is_organic: boolean
          listing_id: string
          moisture_pct: number | null
          plot_id: string | null
          quality_notes: string | null
        }
        Insert: {
          batch_code?: string | null
          certifications?: string[]
          created_at?: string
          crop_cycle_id?: string | null
          expected_harvest_date?: string | null
          farm_id?: string | null
          grade?: string | null
          harvest_date?: string | null
          harvest_id?: string | null
          id?: string
          is_organic?: boolean
          listing_id: string
          moisture_pct?: number | null
          plot_id?: string | null
          quality_notes?: string | null
        }
        Update: {
          batch_code?: string | null
          certifications?: string[]
          created_at?: string
          crop_cycle_id?: string | null
          expected_harvest_date?: string | null
          farm_id?: string | null
          grade?: string | null
          harvest_date?: string | null
          harvest_id?: string | null
          id?: string
          is_organic?: boolean
          listing_id?: string
          moisture_pct?: number | null
          plot_id?: string | null
          quality_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_produce_provenance_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produce_provenance_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produce_provenance_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produce_provenance_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "crop_harvests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produce_provenance_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_produce_provenance_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category_id: string
          created_at: string
          default_unit: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          standard_attributes: Json
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          default_unit: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          standard_attributes?: Json
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          default_unit?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          standard_attributes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_verified_purchase: boolean
          order_id: string
          order_item_id: string | null
          rating: number
          response: string | null
          reviewer_id: string
          seller_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          order_id: string
          order_item_id?: string | null
          rating: number
          response?: string | null
          reviewer_id: string
          seller_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_purchase?: boolean
          order_id?: string
          order_item_id?: string | null
          rating?: number
          response?: string | null
          reviewer_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "marketplace_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_sellers: {
        Row: {
          business_name: string
          commission_rate_bps: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_demo: boolean
          is_suspended: boolean
          logo_url: string | null
          organization_id: string | null
          payout_bank_account_id: string | null
          profile_id: string
          rating_avg: number
          rating_count: number
          seller_type: string
          suspension_reason: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          business_name: string
          commission_rate_bps?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          is_suspended?: boolean
          logo_url?: string | null
          organization_id?: string | null
          payout_bank_account_id?: string | null
          profile_id: string
          rating_avg?: number
          rating_count?: number
          seller_type: string
          suspension_reason?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          business_name?: string
          commission_rate_bps?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_demo?: boolean
          is_suspended?: boolean
          logo_url?: string | null
          organization_id?: string | null
          payout_bank_account_id?: string | null
          profile_id?: string
          rating_avg?: number
          rating_count?: number
          seller_type?: string
          suspension_reason?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_sellers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sellers_payout_bank_account_id_fkey"
            columns: ["payout_bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_sellers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_settlements: {
        Row: {
          bank_account_id: string | null
          commission_kobo: number
          created_at: string
          escrow_id: string
          gross_amount_kobo: number
          id: string
          net_payout_kobo: number
          payout_reference: string | null
          processed_at: string | null
          seller_id: string
          status: string
        }
        Insert: {
          bank_account_id?: string | null
          commission_kobo?: number
          created_at?: string
          escrow_id: string
          gross_amount_kobo: number
          id?: string
          net_payout_kobo: number
          payout_reference?: string | null
          processed_at?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          bank_account_id?: string | null
          commission_kobo?: number
          created_at?: string
          escrow_id?: string
          gross_amount_kobo?: number
          id?: string
          net_payout_kobo?: number
          payout_reference?: string | null
          processed_at?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_settlements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_settlements_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "marketplace_escrows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_settlements_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "marketplace_sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_shipments: {
        Row: {
          carrier_profile_id: string | null
          carrier_type: string
          created_at: string
          delivery_time: string | null
          dropoff_location: unknown
          fulfilment_id: string
          id: string
          pickup_location: unknown
          pickup_time: string | null
          status: string
          tracking_code: string | null
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          carrier_profile_id?: string | null
          carrier_type: string
          created_at?: string
          delivery_time?: string | null
          dropoff_location: unknown
          fulfilment_id: string
          id?: string
          pickup_location: unknown
          pickup_time?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          carrier_profile_id?: string | null
          carrier_type?: string
          created_at?: string
          delivery_time?: string | null
          dropoff_location?: unknown
          fulfilment_id?: string
          id?: string
          pickup_location?: unknown
          pickup_time?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_shipments_carrier_profile_id_fkey"
            columns: ["carrier_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_shipments_fulfilment_id_fkey"
            columns: ["fulfilment_id"]
            isOneToOne: false
            referencedRelation: "marketplace_fulfilments"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          name: string
          product_id: string
          sku: string | null
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          name: string
          product_id: string
          sku?: string | null
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      message_participants: {
        Row: {
          last_read_at: string | null
          profile_id: string
          thread_id: string
        }
        Insert: {
          last_read_at?: string | null
          profile_id: string
          thread_id: string
        }
        Update: {
          last_read_at?: string | null
          profile_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          subject: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
          subject: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          data: Json
          id: string
          kind: string
          profile_id: string
          read_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind: string
          profile_id: string
          read_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          profile_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offtake_contracts: {
        Row: {
          advance_paid_kobo: number
          buyer_id: string
          buyer_name: string
          commodity: string
          contract_number: string
          contracted_kg: number
          created_at: string
          crop_cycle_id: string | null
          delivered_kg: number
          delivery_end: string
          delivery_point: string | null
          delivery_start: string
          farm_id: string | null
          grade: string | null
          grower_id: string
          id: string
          price_per_kg_kobo: number
          signed_at: string | null
          status: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          advance_paid_kobo?: number
          buyer_id: string
          buyer_name: string
          commodity: string
          contract_number: string
          contracted_kg: number
          created_at?: string
          crop_cycle_id?: string | null
          delivered_kg?: number
          delivery_end: string
          delivery_point?: string | null
          delivery_start: string
          farm_id?: string | null
          grade?: string | null
          grower_id: string
          id?: string
          price_per_kg_kobo: number
          signed_at?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          advance_paid_kobo?: number
          buyer_id?: string
          buyer_name?: string
          commodity?: string
          contract_number?: string
          contracted_kg?: number
          created_at?: string
          crop_cycle_id?: string | null
          delivered_kg?: number
          delivery_end?: string
          delivery_point?: string | null
          delivery_start?: string
          farm_id?: string | null
          grade?: string | null
          grower_id?: string
          id?: string
          price_per_kg_kobo?: number
          signed_at?: string | null
          status?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offtake_contracts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offtake_contracts_crop_cycle_id_fkey"
            columns: ["crop_cycle_id"]
            isOneToOne: false
            referencedRelation: "crop_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offtake_contracts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offtake_contracts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offtake_contracts_grower_id_fkey"
            columns: ["grower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          added_by: string | null
          created_at: string
          member_role: Database["public"]["Enums"]["org_member_role"]
          organization_id: string
          profile_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          member_role: Database["public"]["Enums"]["org_member_role"]
          organization_id: string
          profile_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          member_role?: Database["public"]["Enums"]["org_member_role"]
          organization_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cac_number: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          cac_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          cac_number?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_view_daily: {
        Row: {
          day: string
          path: string
          views: number
        }
        Insert: {
          day: string
          path: string
          views?: number
        }
        Update: {
          day?: string
          path?: string
          views?: number
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          permission: string
        }
        Insert: {
          created_at?: string
          description: string
          permission: string
        }
        Update: {
          created_at?: string
          description?: string
          permission?: string
        }
        Relationships: []
      }
      plots: {
        Row: {
          accessibility: string | null
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
          created_by: string | null
          current_crop: string | null
          drainage: string | null
          farm_id: string
          id: string
          irrigation_type: string | null
          name: string
          notes: string | null
          organic_matter_pct: number | null
          plot_code: string | null
          previous_crop: string | null
          slope_pct: number | null
          soil_ph: number | null
          soil_texture: string | null
          updated_at: string
          water_source: string | null
        }
        Insert: {
          accessibility?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          current_crop?: string | null
          drainage?: string | null
          farm_id: string
          id?: string
          irrigation_type?: string | null
          name: string
          notes?: string | null
          organic_matter_pct?: number | null
          plot_code?: string | null
          previous_crop?: string | null
          slope_pct?: number | null
          soil_ph?: number | null
          soil_texture?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Update: {
          accessibility?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          current_crop?: string | null
          drainage?: string | null
          farm_id?: string
          id?: string
          irrigation_type?: string | null
          name?: string
          notes?: string | null
          organic_matter_pct?: number | null
          plot_code?: string | null
          previous_crop?: string | null
          slope_pct?: number | null
          soil_ph?: number | null
          soil_texture?: string | null
          updated_at?: string
          water_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plots_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_batches: {
        Row: {
          batch_code: string
          completed_at: string | null
          created_at: string
          facility_name: string
          id: string
          input_commodity: string
          input_kg: number
          moisture_pct: number | null
          notes: string | null
          output_kg: number | null
          output_product: string
          owner_id: string
          quality_grade: string | null
          source_farm_id: string | null
          stage: string
          started_at: string
        }
        Insert: {
          batch_code: string
          completed_at?: string | null
          created_at?: string
          facility_name: string
          id?: string
          input_commodity: string
          input_kg: number
          moisture_pct?: number | null
          notes?: string | null
          output_kg?: number | null
          output_product: string
          owner_id: string
          quality_grade?: string | null
          source_farm_id?: string | null
          stage?: string
          started_at?: string
        }
        Update: {
          batch_code?: string
          completed_at?: string | null
          created_at?: string
          facility_name?: string
          id?: string
          input_commodity?: string
          input_kg?: number
          moisture_pct?: number | null
          notes?: string | null
          output_kg?: number | null
          output_product?: string
          owner_id?: string
          quality_grade?: string | null
          source_farm_id?: string | null
          stage?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_batches_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_batches_source_farm_id_fkey"
            columns: ["source_farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_batches_source_farm_id_fkey"
            columns: ["source_farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          email: string | null
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          lga: string | null
          onboarded_at: string | null
          onboarded_by: string | null
          phone: string | null
          preferred_language: Database["public"]["Enums"]["app_language"]
          state: string | null
          suspended_at: string | null
          suspended_by: string | null
          suspended_reason: string | null
          updated_at: string
          verification_tier: number
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean
          lga?: string | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          state?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          updated_at?: string
          verification_tier?: number
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          lga?: string | null
          onboarded_at?: string | null
          onboarded_by?: string | null
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          state?: string | null
          suspended_at?: string | null
          suspended_by?: string | null
          suspended_reason?: string | null
          updated_at?: string
          verification_tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_onboarded_by_fkey"
            columns: ["onboarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      programme_beneficiaries: {
        Row: {
          created_at: string
          enrolled_on: string
          farmer_name: string
          gender: string | null
          id: string
          lga: string | null
          profile_id: string | null
          programme_id: string
          state: string | null
          status: string
          support_type: string
          value_kobo: number
          yield_after_kg_ha: number | null
          yield_before_kg_ha: number | null
        }
        Insert: {
          created_at?: string
          enrolled_on?: string
          farmer_name: string
          gender?: string | null
          id?: string
          lga?: string | null
          profile_id?: string | null
          programme_id: string
          state?: string | null
          status?: string
          support_type: string
          value_kobo?: number
          yield_after_kg_ha?: number | null
          yield_before_kg_ha?: number | null
        }
        Update: {
          created_at?: string
          enrolled_on?: string
          farmer_name?: string
          gender?: string | null
          id?: string
          lga?: string | null
          profile_id?: string | null
          programme_id?: string
          state?: string | null
          status?: string
          support_type?: string
          value_kobo?: number
          yield_after_kg_ha?: number | null
          yield_before_kg_ha?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "programme_beneficiaries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programme_beneficiaries_programme_id_fkey"
            columns: ["programme_id"]
            isOneToOne: false
            referencedRelation: "impact_programmes"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          ratee_id: string
          rater_id: string
          stars: number
          tags: string[]
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id: string
          rater_id: string
          stars: number
          tags?: string[]
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          stars?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_ratee_id_fkey"
            columns: ["ratee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      research_trials: {
        Row: {
          created_at: string
          crop: string
          design: string
          end_date: string | null
          farm_id: string | null
          findings: string | null
          id: string
          institution: string
          owner_id: string
          plot_id: string | null
          replicates: number
          start_date: string
          status: string
          title: string
          treatments: Json
        }
        Insert: {
          created_at?: string
          crop: string
          design: string
          end_date?: string | null
          farm_id?: string | null
          findings?: string | null
          id?: string
          institution: string
          owner_id: string
          plot_id?: string | null
          replicates?: number
          start_date: string
          status?: string
          title: string
          treatments?: Json
        }
        Update: {
          created_at?: string
          crop?: string
          design?: string
          end_date?: string | null
          farm_id?: string | null
          findings?: string | null
          id?: string
          institution?: string
          owner_id?: string
          plot_id?: string | null
          replicates?: number
          start_date?: string
          status?: string
          title?: string
          treatments?: Json
        }
        Relationships: [
          {
            foreignKeyName: "research_trials_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trials_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trials_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_trials_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requests: {
        Row: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          profile_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          profile_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          profile_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          auto_approve: boolean
          available: boolean
          created_at: string
          description: string
          min_verification_tier: number
          requires_documents: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_approve?: boolean
          available?: boolean
          created_at?: string
          description: string
          min_verification_tier?: number
          requires_documents?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_approve?: boolean
          available?: boolean
          created_at?: string
          description?: string
          min_verification_tier?: number
          requires_documents?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_channels: {
        Row: {
          channel_code: string
          device_model_id: string
          display_name: string
          id: string
          is_telemetry: boolean
          max_valid_value: number
          measurement_priority: number
          metadata: Json
          min_valid_value: number
          precision_decimals: number
          unit: string
        }
        Insert: {
          channel_code: string
          device_model_id: string
          display_name: string
          id?: string
          is_telemetry?: boolean
          max_valid_value: number
          measurement_priority?: number
          metadata?: Json
          min_valid_value: number
          precision_decimals?: number
          unit: string
        }
        Update: {
          channel_code?: string
          device_model_id?: string
          display_name?: string
          id?: string
          is_telemetry?: boolean
          max_valid_value?: number
          measurement_priority?: number
          metadata?: Json
          min_valid_value?: number
          precision_decimals?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensor_channels_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_outbox: {
        Row: {
          attempts: number
          booking_id: string | null
          created_at: string
          data: Json
          error_code: string | null
          id: string
          kind: string
          locked_at: string | null
          message_id: string | null
          next_attempt_at: string
          profile_id: string
          provider: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          data?: Json
          error_code?: string | null
          id?: string
          kind: string
          locked_at?: string | null
          message_id?: string | null
          next_attempt_at?: string
          profile_id: string
          provider?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          booking_id?: string | null
          created_at?: string
          data?: Json
          error_code?: string | null
          id?: string
          kind?: string
          locked_at?: string | null
          message_id?: string | null
          next_attempt_at?: string
          profile_id?: string
          provider?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_outbox_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_records: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lab_name: string | null
          nitrogen_pct: number | null
          notes: string | null
          organic_matter_pct: number | null
          ph: number | null
          phosphorus_ppm: number | null
          plot_id: string
          potassium_cmol_kg: number | null
          recommendations: string | null
          soil_type: string | null
          source: Database["public"]["Enums"]["record_source"]
          tested_on: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lab_name?: string | null
          nitrogen_pct?: number | null
          notes?: string | null
          organic_matter_pct?: number | null
          ph?: number | null
          phosphorus_ppm?: number | null
          plot_id: string
          potassium_cmol_kg?: number | null
          recommendations?: string | null
          soil_type?: string | null
          source?: Database["public"]["Enums"]["record_source"]
          tested_on?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lab_name?: string | null
          nitrogen_pct?: number | null
          notes?: string | null
          organic_matter_pct?: number | null
          ph?: number | null
          phosphorus_ppm?: number | null
          plot_id?: string
          potassium_cmol_kg?: number | null
          recommendations?: string | null
          soil_type?: string | null
          source?: Database["public"]["Enums"]["record_source"]
          tested_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soil_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soil_records_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_internal: boolean
          ticket_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          channel: string
          created_at: string
          id: string
          priority: string
          requester_id: string
          resolved_at: string | null
          sla_due_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          channel?: string
          created_at?: string
          id?: string
          priority?: string
          requester_id: string
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          channel?: string
          created_at?: string
          id?: string
          priority?: string
          requester_id?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_readings: {
        Row: {
          calibrated_value: number
          channel_code: string
          created_at: string
          device_id: string
          gateway_metadata: Json
          id: string
          installation_id: string | null
          plot_id: string | null
          quality_flag: Database["public"]["Enums"]["telemetry_quality_flag"]
          raw_value: number
          received_timestamp: string
          sequence_number: number
          source_timestamp: string
          unit: string
        }
        Insert: {
          calibrated_value: number
          channel_code: string
          created_at?: string
          device_id: string
          gateway_metadata?: Json
          id?: string
          installation_id?: string | null
          plot_id?: string | null
          quality_flag?: Database["public"]["Enums"]["telemetry_quality_flag"]
          raw_value: number
          received_timestamp?: string
          sequence_number: number
          source_timestamp: string
          unit: string
        }
        Update: {
          calibrated_value?: number
          channel_code?: string
          created_at?: string
          device_id?: string
          gateway_metadata?: Json
          id?: string
          installation_id?: string | null
          plot_id?: string | null
          quality_flag?: Database["public"]["Enums"]["telemetry_quality_flag"]
          raw_value?: number
          received_timestamp?: string
          sequence_number?: number
          source_timestamp?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_readings_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "device_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_readings_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_rollups: {
        Row: {
          avg_value: number
          bucket_timestamp: string
          channel_code: string
          created_at: string
          device_id: string
          id: string
          last_value: number
          max_value: number
          min_value: number
          period: Database["public"]["Enums"]["rollup_period"]
          plot_id: string | null
          sample_count: number
          valid_count: number
        }
        Insert: {
          avg_value: number
          bucket_timestamp: string
          channel_code: string
          created_at?: string
          device_id: string
          id?: string
          last_value: number
          max_value: number
          min_value: number
          period: Database["public"]["Enums"]["rollup_period"]
          plot_id?: string | null
          sample_count?: number
          valid_count?: number
        }
        Update: {
          avg_value?: number
          bucket_timestamp?: string
          channel_code?: string
          created_at?: string
          device_id?: string
          id?: string
          last_value?: number
          max_value?: number
          min_value?: number
          period?: Database["public"]["Enums"]["rollup_period"]
          plot_id?: string | null
          sample_count?: number
          valid_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_rollups_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_rollups_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          profile_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          request_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          profile_id: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          request_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          profile_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          request_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "role_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_documents: {
        Row: {
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          id: string
          mime_type: string
          profile_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_request_id: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["review_status"]
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          id?: string
          mime_type: string
          profile_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_request_id?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["review_status"]
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_type?: Database["public"]["Enums"]["verification_document_type"]
          id?: string
          mime_type?: string
          profile_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_request_id?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["review_status"]
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_role_request_id_fkey"
            columns: ["role_request_id"]
            isOneToOne: false
            referencedRelation: "role_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string
          failure_reason: string | null
          id: string
          id_hash: string | null
          kind: Database["public"]["Enums"]["verification_kind"]
          masked_value: string | null
          name_match: number | null
          profile_id: string
          provider: string | null
          reference: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          id_hash?: string | null
          kind: Database["public"]["Enums"]["verification_kind"]
          masked_value?: string | null
          name_match?: number | null
          profile_id: string
          provider?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          id?: string
          id_hash?: string | null
          kind?: Database["public"]["Enums"]["verification_kind"]
          masked_value?: string | null
          name_match?: number | null
          profile_id?: string
          provider?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          interest: string | null
          language: Database["public"]["Enums"]["app_language"]
          phone: string | null
          side: Database["public"]["Enums"]["waitlist_side"]
          state: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          interest?: string | null
          language?: Database["public"]["Enums"]["app_language"]
          phone?: string | null
          side: Database["public"]["Enums"]["waitlist_side"]
          state?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          interest?: string | null
          language?: Database["public"]["Enums"]["app_language"]
          phone?: string | null
          side?: Database["public"]["Enums"]["waitlist_side"]
          state?: string | null
        }
        Relationships: []
      }
      weather_cache: {
        Row: {
          fetched_at: string
          payload: Json
          provider: string
        }
        Insert: {
          fetched_at?: string
          payload: Json
          provider: string
        }
        Update: {
          fetched_at?: string
          payload?: Json
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_cache_provider_fkey"
            columns: ["provider"]
            isOneToOne: true
            referencedRelation: "integration_providers"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      current_consents: {
        Row: {
          channel: string | null
          consent_type: Database["public"]["Enums"]["consent_type"] | null
          created_at: string | null
          document_version: string | null
          granted: boolean | null
          profile_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_points: {
        Row: {
          area_ha: number | null
          farm_code: string | null
          has_boundary: boolean | null
          id: string | null
          lat: number | null
          lga: string | null
          lng: number | null
          name: string | null
          organization_id: string | null
          owner_id: string | null
          state: string | null
          status: string | null
          zone: Database["public"]["Enums"]["farm_zone"] | null
        }
        Insert: {
          area_ha?: number | null
          farm_code?: string | null
          has_boundary?: never
          id?: string | null
          lat?: never
          lga?: string | null
          lng?: never
          name?: string | null
          organization_id?: string | null
          owner_id?: string | null
          state?: string | null
          status?: string | null
          zone?: Database["public"]["Enums"]["farm_zone"] | null
        }
        Update: {
          area_ha?: number | null
          farm_code?: string | null
          has_boundary?: never
          id?: string | null
          lat?: never
          lga?: string | null
          lng?: never
          name?: string | null
          organization_id?: string | null
          owner_id?: string | null
          state?: string | null
          status?: string | null
          zone?: Database["public"]["Enums"]["farm_zone"] | null
        }
        Relationships: [
          {
            foreignKeyName: "farms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machinery_telemetry_points: {
        Row: {
          engine_hours: number | null
          engine_rpm: number | null
          engine_temp_c: number | null
          farm_id: string | null
          fuel_pct: number | null
          heading_deg: number | null
          id: string | null
          lat: number | null
          lng: number | null
          machinery_id: string | null
          recorded_at: string | null
          speed_kmh: number | null
          status: string | null
        }
        Insert: {
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_temp_c?: number | null
          farm_id?: string | null
          fuel_pct?: number | null
          heading_deg?: number | null
          id?: string | null
          lat?: never
          lng?: never
          machinery_id?: string | null
          recorded_at?: string | null
          speed_kmh?: number | null
          status?: string | null
        }
        Update: {
          engine_hours?: number | null
          engine_rpm?: number | null
          engine_temp_c?: number | null
          farm_id?: string | null
          fuel_pct?: number | null
          heading_deg?: number | null
          id?: string | null
          lat?: never
          lng?: never
          machinery_id?: string | null
          recorded_at?: string | null
          speed_kmh?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machinery_telemetry_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farm_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_telemetry_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machinery_telemetry_machinery_id_fkey"
            columns: ["machinery_id"]
            isOneToOne: false
            referencedRelation: "farm_machinery_assets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_booking: { Args: { p_booking: string }; Returns: undefined }
      add_dispute_evidence: {
        Args: {
          p_booking: string
          p_lat?: number
          p_lng?: number
          p_path: string
          p_taken_at: string
        }
        Returns: string
      }
      add_org_member: {
        Args: {
          p_org: string
          p_phone: string
          p_role: Database["public"]["Enums"]["org_member_role"]
        }
        Returns: Json
      }
      admin_activate_integration: {
        Args: {
          p_kind: Database["public"]["Enums"]["integration_kind"]
          p_provider: string
        }
        Returns: undefined
      }
      admin_agent_codes: { Args: { p_limit?: number }; Returns: Json }
      admin_analytics: { Args: { p_days?: number }; Returns: Json }
      admin_booking_stats: { Args: never; Returns: Json }
      admin_clear_integration_secret: {
        Args: {
          p_field: string
          p_mode: Database["public"]["Enums"]["integration_mode"]
          p_provider: string
        }
        Returns: undefined
      }
      admin_dashboard: { Args: never; Returns: Json }
      admin_delete_hero_slide: { Args: { p_id: string }; Returns: string }
      admin_force_sign_out: {
        Args: { p_profile: string; p_reason: string }
        Returns: number
      }
      admin_grant_admin_role: {
        Args: {
          p_profile: string
          p_reason: string
          p_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: undefined
      }
      admin_integration_overview: { Args: never; Returns: Json }
      admin_listings: {
        Args: {
          p_limit?: number
          p_query?: string
          p_status?: Database["public"]["Enums"]["listing_status"]
        }
        Returns: Json
      }
      admin_move_hero_slide: {
        Args: { p_id: string; p_up: boolean }
        Returns: undefined
      }
      admin_org_memberships: {
        Args: { p_limit?: number; p_query?: string }
        Returns: Json
      }
      admin_remove_org_member: {
        Args: { p_org: string; p_profile: string; p_reason: string }
        Returns: undefined
      }
      admin_resolve_data_request: {
        Args: {
          p_note: string
          p_request_id: string
          p_status: Database["public"]["Enums"]["data_request_status"]
        }
        Returns: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          profile_id: string | null
          reason: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["data_request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "data_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_revoke_admin_role: {
        Args: {
          p_profile: string
          p_reason: string
          p_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: undefined
      }
      admin_revoke_agent_code: {
        Args: { p_code: string; p_reason: string }
        Returns: undefined
      }
      admin_save_hero_slide: {
        Args: {
          p_alt_en: string
          p_alt_yo: string
          p_caption_en: string
          p_caption_yo: string
          p_id: string
          p_image_path: string
          p_link_url: string
          p_published: boolean
          p_title_en: string
          p_title_yo: string
        }
        Returns: Json
      }
      admin_save_integration_config: {
        Args: {
          p_config: Json
          p_mode: Database["public"]["Enums"]["integration_mode"]
          p_provider: string
        }
        Returns: undefined
      }
      admin_search_users: {
        Args: { p_filter?: string; p_limit?: number; p_query?: string }
        Returns: Json
      }
      admin_set_account_flag: {
        Args: { p_flag: boolean; p_profile: string; p_reason: string }
        Returns: undefined
      }
      admin_set_account_suspension: {
        Args: { p_profile: string; p_reason: string; p_suspend: boolean }
        Returns: Json
      }
      admin_set_contact_handled: {
        Args: { p_handled: boolean; p_message_id: string }
        Returns: undefined
      }
      admin_set_feature_flag: {
        Args: {
          p_enabled: boolean
          p_key: string
          p_reason: string
          p_states: string[]
        }
        Returns: undefined
      }
      admin_set_hero_slide_published: {
        Args: { p_id: string; p_published: boolean }
        Returns: undefined
      }
      admin_set_integration_mode: {
        Args: {
          p_mode: Database["public"]["Enums"]["integration_mode"]
          p_provider: string
        }
        Returns: undefined
      }
      admin_set_integration_secret: {
        Args: {
          p_field: string
          p_mode: Database["public"]["Enums"]["integration_mode"]
          p_provider: string
          p_value: string
        }
        Returns: undefined
      }
      admin_set_listing_status: {
        Args: { p_listing: string; p_reason: string; p_suspend: boolean }
        Returns: undefined
      }
      agent_onboarding_complete: {
        Args: {
          p_agent: string
          p_consents: Json
          p_document_version: string
          p_full_name: string
          p_language: Database["public"]["Enums"]["app_language"]
          p_lga: string
          p_profile: string
          p_roles: Json
          p_state: string
        }
        Returns: Json
      }
      agent_onboarding_start: {
        Args: { p_agent: string; p_code_hash: string; p_phone: string }
        Returns: Json
      }
      agent_onboarding_verify: {
        Args: { p_agent: string; p_code_hash: string; p_phone: string }
        Returns: Json
      }
      approve_role_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          profile_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "role_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      booking_detail: { Args: { p_booking: string }; Returns: Json }
      budget_farm_id: { Args: { p_budget: string }; Returns: string }
      calendar_feed_events: {
        Args: { p_token: string }
        Returns: {
          details: string
          ends_on: string
          farm_name: string
          kind: string
          location: string
          starts_on: string
          status: string
          title: string
          uid: string
          updated_at: string
        }[]
      }
      can_edit_cycle_legacy: { Args: { p_cycle: string }; Returns: boolean }
      can_edit_farm: { Args: { p_farm: string }; Returns: boolean }
      can_manage_farm_iot: { Args: { p_farm_id: string }; Returns: boolean }
      can_view_cycle_legacy: { Args: { p_cycle: string }; Returns: boolean }
      can_view_device: { Args: { p_device_id: string }; Returns: boolean }
      can_view_farm: { Args: { p_farm: string }; Returns: boolean }
      cancel_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      cancel_data_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          profile_id: string | null
          reason: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["data_request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "data_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_role_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          profile_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "role_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_in_booking: {
        Args: { p_booking: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
      claim_sms_outbox: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          data: Json
          id: string
          kind: string
          language: Database["public"]["Enums"]["app_language"]
          phone: string
        }[]
      }
      complete_onboarding: {
        Args: {
          p_account_type: Database["public"]["Enums"]["account_type"]
          p_business_name: string
          p_cac_number: string
          p_channel?: string
          p_consents: Json
          p_document_version: string
          p_full_name: string
          p_language: Database["public"]["Enums"]["app_language"]
          p_lga: string
          p_roles: Json
          p_state: string
        }
        Returns: Json
      }
      confirm_booking: { Args: { p_booking: string }; Returns: undefined }
      correct_farm_zone: {
        Args: {
          p_farm_id: string
          p_reason: string
          p_zone: Database["public"]["Enums"]["farm_zone"]
        }
        Returns: undefined
      }
      crop_cycle_farm_id: { Args: { p_cycle: string }; Returns: string }
      cycle_farm_id_legacy: { Args: { p_cycle: string }; Returns: string }
      decline_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      dispute_booking: {
        Args: { p_booking: string; p_category: string; p_details?: string }
        Returns: undefined
      }
      export_my_data: { Args: never; Returns: Json }
      finish_booking_work: {
        Args: { p_booking: string; p_hectares?: number }
        Returns: undefined
      }
      finish_sms_outbox: {
        Args: {
          p_error: string
          p_id: string
          p_message_id: string
          p_ok: boolean
          p_provider: string
          p_retry: boolean
        }
        Returns: undefined
      }
      get_checkout_payment_credentials: {
        Args: { p_order_id?: string }
        Returns: Json
      }
      has_permission: { Args: { p_permission: string }; Returns: boolean }
      has_role: {
        Args: {
          p_provider_type?: Database["public"]["Enums"]["provider_type"]
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      integration_runtime: {
        Args: {
          p_kind: Database["public"]["Enums"]["integration_kind"]
          p_provider?: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_thread_participant: { Args: { p_thread: string }; Returns: boolean }
      join_waitlist: {
        Args: {
          p_email?: string
          p_full_name: string
          p_interest?: string
          p_language?: Database["public"]["Enums"]["app_language"]
          p_phone?: string
          p_side: Database["public"]["Enums"]["waitlist_side"]
          p_state?: string
        }
        Returns: undefined
      }
      listing_for_booking: {
        Args: { p_farm: string; p_listing: string }
        Returns: Json
      }
      mark_notifications_read: { Args: { p_ids?: string[] }; Returns: number }
      mark_paid: {
        Args: { p_amount_kobo: number; p_booking: string }
        Returns: undefined
      }
      marketplace_open: { Args: never; Returns: boolean }
      my_bookings: { Args: { p_limit?: number }; Returns: Json }
      my_listings: { Args: never; Returns: Json }
      my_permissions: { Args: never; Returns: string[] }
      my_thread_people: {
        Args: never
        Returns: {
          full_name: string
          profile_id: string
          thread_id: string
        }[]
      }
      my_verification_tier: { Args: never; Returns: number }
      nearby_listings: {
        Args: {
          p_equipment_type?: Database["public"]["Enums"]["equipment_type"]
          p_kind?: Database["public"]["Enums"]["listing_kind"]
          p_lat: number
          p_limit?: number
          p_lng: number
          p_provider_type?: Database["public"]["Enums"]["provider_type"]
          p_radius_km?: number
        }
        Returns: {
          description: string
          distance_km: number
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          kind: Database["public"]["Enums"]["listing_kind"]
          listing_id: string
          operator_included: boolean
          owner_id: string
          provider: Json
          provider_type: Database["public"]["Enums"]["provider_type"]
          rates: Json
          service_radius_km: number
          title: string
        }[]
      }
      nearby_listings_for_farm: {
        Args: {
          p_equipment_type?: Database["public"]["Enums"]["equipment_type"]
          p_farm: string
          p_kind?: Database["public"]["Enums"]["listing_kind"]
          p_limit?: number
          p_provider_type?: Database["public"]["Enums"]["provider_type"]
          p_radius_km?: number
        }
        Returns: Json[]
      }
      notify_worker_authorized: { Args: { p_secret: string }; Returns: boolean }
      org_member_directory: {
        Args: { p_org: string }
        Returns: {
          full_name: string
          joined_at: string
          lga: string
          member_role: Database["public"]["Enums"]["org_member_role"]
          profile_id: string
          state: string
        }[]
      }
      org_member_list: {
        Args: { p_org: string }
        Returns: {
          added_at: string
          full_name: string
          member_role: Database["public"]["Enums"]["org_member_role"]
          phone_hint: string
          profile_id: string
        }[]
      }
      org_role: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["org_member_role"]
      }
      plot_farm_id: { Args: { p_plot: string }; Returns: string }
      process_payment_webhook: {
        Args: {
          p_amount_kobo: number
          p_gateway_data?: Json
          p_order_id: string
          p_provider: string
          p_reference: string
        }
        Returns: Json
      }
      process_telemetry_rollups: {
        Args: { p_lookback_interval?: string }
        Returns: undefined
      }
      rate_booking: {
        Args: {
          p_booking: string
          p_comment?: string
          p_stars: number
          p_tags?: string[]
        }
        Returns: undefined
      }
      record_bank_account_verification: {
        Args: {
          p_account_name: string
          p_bank_code: string
          p_bank_name: string
          p_failure?: string
          p_id_hash: string
          p_last4: string
          p_name_match: number
          p_profile: string
          p_provider: string
          p_verified: boolean
        }
        Returns: Json
      }
      record_farm_inventory_movement: {
        Args: {
          p_batch_number?: string
          p_crop_cycle_id?: string
          p_farm_id: string
          p_group_id?: string
          p_inventory_id: string
          p_notes?: string
          p_quantity: number
          p_transaction_type: string
          p_unit_cost_kobo?: number
        }
        Returns: Json
      }
      record_identity_verification: {
        Args: {
          p_failure?: string
          p_id_hash: string
          p_kind: Database["public"]["Enums"]["verification_kind"]
          p_masked: string
          p_name_match: number
          p_profile: string
          p_provider: string
          p_reference: string
          p_verified: boolean
        }
        Returns: Json
      }
      record_marketplace_journal_entry: {
        Args: {
          p_description: string
          p_postings: Json
          p_reference_id: string
          p_reference_type: string
        }
        Returns: string
      }
      regional_agri_stats: {
        Args: never
        Returns: {
          active_cycles: number
          bookings_90d: number
          farmers: number
          farms: number
          hectares: number
          state: string
        }[]
      }
      reject_role_request: {
        Args: { p_note: string; p_request_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          details: Json
          id: string
          profile_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "role_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_fulfilment_escrow: {
        Args: { p_fulfilment_id: string }
        Returns: Json
      }
      release_order_inventory: { Args: { p_order_id: string }; Returns: Json }
      request_account_deletion: {
        Args: { p_reason?: string }
        Returns: {
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          kind: Database["public"]["Enums"]["data_request_kind"]
          profile_id: string | null
          reason: string | null
          resolution_note: string | null
          status: Database["public"]["Enums"]["data_request_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "data_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_booking: {
        Args: {
          p_farm: string
          p_job_date: string
          p_listing: string
          p_note?: string
          p_quantity: number
          p_unit: Database["public"]["Enums"]["pricing_unit"]
        }
        Returns: string
      }
      reserve_inventory_for_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      review_verification_document: {
        Args: {
          p_document_id: string
          p_note?: string
          p_status: Database["public"]["Enums"]["review_status"]
        }
        Returns: {
          created_at: string
          created_by: string | null
          document_type: Database["public"]["Enums"]["verification_document_type"]
          id: string
          mime_type: string
          profile_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role_request_id: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["review_status"]
          storage_path: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "verification_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      role_is_auto_approved: {
        Args: { p_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      run_device_watchdog: {
        Args: { p_stale_threshold_hours?: number }
        Returns: {
          device_serial: string
          new_status: string
          previous_status: string
        }[]
      }
      search_marketplace_listings: {
        Args: {
          p_category_slug?: string
          p_lat?: number
          p_limit?: number
          p_listing_type?: string
          p_lng?: number
          p_offset?: number
          p_query?: string
          p_radius_km?: number
        }
        Returns: {
          available_quantity: number
          base_price_kobo: number
          category_name: string
          category_slug: string
          distance_km: number
          id: string
          images: string[]
          listing_type: string
          location_lga: string
          location_state: string
          seller_id: string
          seller_name: string
          seller_rating: number
          seller_type: string
          title: string
          unit: string
        }[]
      }
      send_contact_message: {
        Args: {
          p_email?: string
          p_full_name: string
          p_language?: Database["public"]["Enums"]["app_language"]
          p_message: string
          p_phone?: string
        }
        Returns: undefined
      }
      submit_proof: {
        Args: {
          p_booking: string
          p_hectares?: number
          p_kind: string
          p_lat?: number
          p_lng?: number
          p_path: string
          p_taken_at: string
        }
        Returns: string
      }
      sync_approved_iot_to_crop_measurements: {
        Args: { p_target_date?: string }
        Returns: number
      }
      track_page_view: { Args: { p_path: string }; Returns: undefined }
      write_audit: {
        Args: {
          p_action: string
          p_entity: string
          p_entity_id: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "individual" | "business"
      admin_role:
        | "super_admin"
        | "verification_officer"
        | "support_disputes"
        | "agronomy_editor"
        | "finance_officer"
      app_language: "en" | "yo" | "pcm"
      app_role:
        | "crop_farmer"
        | "animal_farmer"
        | "machinery_owner"
        | "service_provider"
        | "input_supplier"
        | "buyer_offtaker"
        | "logistics_provider"
        | "field_agent"
        | "institutional_partner"
        | "investor"
        | "customer"
      booking_status:
        | "requested"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
        | "in_progress"
        | "awaiting_confirmation"
        | "confirmed"
        | "disputed"
        | "completed"
      consent_type:
        | "terms_of_use"
        | "privacy_policy"
        | "data_processing"
        | "marketing_messages"
        | "share_with_lenders"
        | "share_with_buyers"
        | "share_with_investors"
        | "share_with_partners"
      crop_alert_category:
        | "weather"
        | "pest_outbreak"
        | "phi_violation"
        | "harvest_window"
        | "operation_overdue"
      crop_cycle_status:
        | "planning"
        | "active"
        | "harvesting"
        | "completed"
        | "abandoned"
      crop_health_status: "excellent" | "good" | "watch" | "critical"
      crop_input_category:
        | "seed"
        | "fertiliser"
        | "herbicide"
        | "insecticide"
        | "fungicide"
        | "irrigation"
        | "other"
      crop_operation_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "blocked"
      data_request_kind: "export" | "deletion"
      data_request_status: "open" | "completed" | "rejected" | "cancelled"
      device_alert_severity: "info" | "warning" | "critical"
      device_alert_status: "open" | "acknowledged" | "resolved" | "suppressed"
      device_connectivity_type:
        | "lorawan"
        | "cellular_nb_iot"
        | "cellular_2g_4g"
        | "ble_direct"
      device_event_type:
        | "offline"
        | "online"
        | "battery_low"
        | "tamper_detected"
        | "signal_loss"
        | "calibration_needed"
        | "firmware_updated"
        | "gateway_failover"
        | "probe_fault"
        | "reboot"
      device_status:
        | "registered"
        | "provisioned"
        | "installed"
        | "assigned"
        | "active"
        | "degraded"
        | "offline"
        | "maintenance"
        | "retired"
      equipment_type:
        | "tractor"
        | "plough"
        | "harrow"
        | "planter"
        | "harvester"
        | "sprayer"
        | "ridger"
        | "tiller"
        | "irrigation_equipment"
        | "transport_equipment"
        | "other"
      farm_operation_status:
        | "planned"
        | "ready_to_execute"
        | "in_progress"
        | "weather_hold"
        | "completed"
        | "cancelled"
      farm_zone: "rainforest" | "derived_savanna" | "other"
      integration_kind: "sms" | "identity" | "weather" | "payment" | "maps"
      integration_mode: "test" | "live"
      listing_kind: "equipment" | "service"
      listing_status: "draft" | "active" | "paused" | "suspended"
      org_member_role:
        | "owner"
        | "farm_manager"
        | "storekeeper"
        | "accountant"
        | "worker"
      power_source_type:
        | "solar_lifepo4"
        | "solar_li_ion"
        | "primary_battery"
        | "mains_grid"
        | "generator_backed"
      pricing_unit: "hour" | "hectare" | "day" | "job"
      provider_type:
        | "farm_hand"
        | "machine_operator"
        | "mechanic"
        | "spraying_service"
        | "agronomist"
        | "extension_agent"
        | "vet"
        | "agro_processor"
      record_source:
        | "self_reported"
        | "agent_verified"
        | "platform_verified"
        | "payment_verified"
      request_status: "pending" | "approved" | "rejected" | "cancelled"
      review_status: "pending" | "accepted" | "rejected"
      rollup_period: "15m" | "1h" | "1d"
      scouting_category:
        | "pest"
        | "disease"
        | "weed"
        | "nutrient_deficiency"
        | "water_stress"
        | "general"
      scouting_severity: "low" | "medium" | "high" | "severe"
      telemetry_quality_flag:
        | "valid"
        | "suspicious"
        | "out_of_range"
        | "hardware_fault"
        | "stale"
        | "replayed"
      verification_document_type:
        | "national_id"
        | "cac_certificate"
        | "proof_of_address"
        | "equipment_ownership"
        | "professional_licence"
        | "photo"
        | "other"
      verification_kind: "phone" | "nin" | "bvn" | "cac" | "document"
      verification_status: "pending" | "verified" | "failed"
      waitlist_side: "buyer" | "seller"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["individual", "business"],
      admin_role: [
        "super_admin",
        "verification_officer",
        "support_disputes",
        "agronomy_editor",
        "finance_officer",
      ],
      app_language: ["en", "yo", "pcm"],
      app_role: [
        "crop_farmer",
        "animal_farmer",
        "machinery_owner",
        "service_provider",
        "input_supplier",
        "buyer_offtaker",
        "logistics_provider",
        "field_agent",
        "institutional_partner",
        "investor",
        "customer",
      ],
      booking_status: [
        "requested",
        "accepted",
        "declined",
        "cancelled",
        "expired",
        "in_progress",
        "awaiting_confirmation",
        "confirmed",
        "disputed",
        "completed",
      ],
      consent_type: [
        "terms_of_use",
        "privacy_policy",
        "data_processing",
        "marketing_messages",
        "share_with_lenders",
        "share_with_buyers",
        "share_with_investors",
        "share_with_partners",
      ],
      crop_alert_category: [
        "weather",
        "pest_outbreak",
        "phi_violation",
        "harvest_window",
        "operation_overdue",
      ],
      crop_cycle_status: [
        "planning",
        "active",
        "harvesting",
        "completed",
        "abandoned",
      ],
      crop_health_status: ["excellent", "good", "watch", "critical"],
      crop_input_category: [
        "seed",
        "fertiliser",
        "herbicide",
        "insecticide",
        "fungicide",
        "irrigation",
        "other",
      ],
      crop_operation_status: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
        "blocked",
      ],
      data_request_kind: ["export", "deletion"],
      data_request_status: ["open", "completed", "rejected", "cancelled"],
      device_alert_severity: ["info", "warning", "critical"],
      device_alert_status: ["open", "acknowledged", "resolved", "suppressed"],
      device_connectivity_type: [
        "lorawan",
        "cellular_nb_iot",
        "cellular_2g_4g",
        "ble_direct",
      ],
      device_event_type: [
        "offline",
        "online",
        "battery_low",
        "tamper_detected",
        "signal_loss",
        "calibration_needed",
        "firmware_updated",
        "gateway_failover",
        "probe_fault",
        "reboot",
      ],
      device_status: [
        "registered",
        "provisioned",
        "installed",
        "assigned",
        "active",
        "degraded",
        "offline",
        "maintenance",
        "retired",
      ],
      equipment_type: [
        "tractor",
        "plough",
        "harrow",
        "planter",
        "harvester",
        "sprayer",
        "ridger",
        "tiller",
        "irrigation_equipment",
        "transport_equipment",
        "other",
      ],
      farm_operation_status: [
        "planned",
        "ready_to_execute",
        "in_progress",
        "weather_hold",
        "completed",
        "cancelled",
      ],
      farm_zone: ["rainforest", "derived_savanna", "other"],
      integration_kind: ["sms", "identity", "weather", "payment", "maps"],
      integration_mode: ["test", "live"],
      listing_kind: ["equipment", "service"],
      listing_status: ["draft", "active", "paused", "suspended"],
      org_member_role: [
        "owner",
        "farm_manager",
        "storekeeper",
        "accountant",
        "worker",
      ],
      power_source_type: [
        "solar_lifepo4",
        "solar_li_ion",
        "primary_battery",
        "mains_grid",
        "generator_backed",
      ],
      pricing_unit: ["hour", "hectare", "day", "job"],
      provider_type: [
        "farm_hand",
        "machine_operator",
        "mechanic",
        "spraying_service",
        "agronomist",
        "extension_agent",
        "vet",
        "agro_processor",
      ],
      record_source: [
        "self_reported",
        "agent_verified",
        "platform_verified",
        "payment_verified",
      ],
      request_status: ["pending", "approved", "rejected", "cancelled"],
      review_status: ["pending", "accepted", "rejected"],
      rollup_period: ["15m", "1h", "1d"],
      scouting_category: [
        "pest",
        "disease",
        "weed",
        "nutrient_deficiency",
        "water_stress",
        "general",
      ],
      scouting_severity: ["low", "medium", "high", "severe"],
      telemetry_quality_flag: [
        "valid",
        "suspicious",
        "out_of_range",
        "hardware_fault",
        "stale",
        "replayed",
      ],
      verification_document_type: [
        "national_id",
        "cac_certificate",
        "proof_of_address",
        "equipment_ownership",
        "professional_licence",
        "photo",
        "other",
      ],
      verification_kind: ["phone", "nin", "bvn", "cac", "document"],
      verification_status: ["pending", "verified", "failed"],
      waitlist_side: ["buyer", "seller"],
    },
  },
} as const
