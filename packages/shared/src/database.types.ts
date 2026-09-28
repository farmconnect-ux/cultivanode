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
    PostgrestVersion: "14.5"
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
        ]
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
          id?: number
          note?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          event?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: number
          note?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cancelled_by: string | null
          closed_reason: string | null
          created_at: string
          distance_km: number
          equipment_type: Database["public"]["Enums"]["equipment_type"] | null
          expires_at: string
          farm_id: string | null
          farm_name: string
          farmer_id: string
          farmer_note: string | null
          id: string
          job_date: string
          job_lga: string | null
          job_location: unknown
          job_state: string | null
          listing_id: string | null
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          listing_title: string
          organization_id: string | null
          provider_id: string
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          quantity: number
          rate_kobo: number
          responded_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at: string
        }
        Insert: {
          cancelled_by?: string | null
          closed_reason?: string | null
          created_at?: string
          distance_km: number
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          expires_at: string
          farm_id?: string | null
          farm_name: string
          farmer_id: string
          farmer_note?: string | null
          id?: string
          job_date: string
          job_lga?: string | null
          job_location: unknown
          job_state?: string | null
          listing_id?: string | null
          listing_kind: Database["public"]["Enums"]["listing_kind"]
          listing_title: string
          organization_id?: string | null
          provider_id: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          quantity: number
          rate_kobo: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_kobo: number
          unit: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
        }
        Update: {
          cancelled_by?: string | null
          closed_reason?: string | null
          created_at?: string
          distance_km?: number
          equipment_type?: Database["public"]["Enums"]["equipment_type"] | null
          expires_at?: string
          farm_id?: string | null
          farm_name?: string
          farmer_id?: string
          farmer_note?: string | null
          id?: string
          job_date?: string
          job_lga?: string | null
          job_location?: unknown
          job_state?: string | null
          listing_id?: string | null
          listing_kind?: Database["public"]["Enums"]["listing_kind"]
          listing_title?: string
          organization_id?: string | null
          provider_id?: string
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          quantity?: number
          rate_kobo?: number
          responded_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_kobo?: number
          unit?: Database["public"]["Enums"]["pricing_unit"]
          updated_at?: string
        }
        Relationships: []
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
          address_hint: string | null
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
          created_by: string | null
          id: string
          lga: string | null
          location: unknown
          name: string
          onboarded_by: string | null
          organization_id: string | null
          owner_id: string
          source: Database["public"]["Enums"]["record_source"]
          state: string | null
          updated_at: string
          zone: Database["public"]["Enums"]["farm_zone"]
          zone_corrected_at: string | null
          zone_corrected_by: string | null
        }
        Insert: {
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          id?: string
          lga?: string | null
          location: unknown
          name: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          source?: Database["public"]["Enums"]["record_source"]
          state?: string | null
          updated_at?: string
          zone?: Database["public"]["Enums"]["farm_zone"]
          zone_corrected_at?: string | null
          zone_corrected_by?: string | null
        }
        Update: {
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          id?: string
          lga?: string | null
          location?: unknown
          name?: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          source?: Database["public"]["Enums"]["record_source"]
          state?: string | null
          updated_at?: string
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
        Relationships: []
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
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
          created_by: string | null
          farm_id: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          farm_id: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          created_by?: string | null
          farm_id?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
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
            foreignKeyName: "profiles_onboarded_by_fkey"
            columns: ["onboarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: []
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
    }
    Functions: {
      accept_booking: { Args: { p_booking: string }; Returns: undefined }
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
      correct_farm_zone: {
        Args: {
          p_farm_id: string
          p_reason: string
          p_zone: Database["public"]["Enums"]["farm_zone"]
        }
        Returns: undefined
      }
      decline_booking: {
        Args: { p_booking: string; p_reason?: string }
        Returns: undefined
      }
      export_my_data: { Args: never; Returns: Json }
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
      marketplace_open: { Args: never; Returns: boolean }
      my_bookings: { Args: { p_limit?: number }; Returns: Json }
      my_listings: { Args: never; Returns: Json }
      my_permissions: { Args: never; Returns: string[] }
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
      booking_status: "requested" | "accepted" | "declined" | "cancelled" | "expired"
      consent_type:
        | "terms_of_use"
        | "privacy_policy"
        | "data_processing"
        | "marketing_messages"
        | "share_with_lenders"
        | "share_with_buyers"
        | "share_with_investors"
        | "share_with_partners"
      data_request_kind: "export" | "deletion"
      data_request_status: "open" | "completed" | "rejected" | "cancelled"
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
      farm_zone: "rainforest" | "derived_savanna" | "other"
      integration_kind: "sms" | "identity" | "weather"
      integration_mode: "test" | "live"
      listing_kind: "equipment" | "service"
      listing_status: "draft" | "active" | "paused" | "suspended"
      org_member_role:
        | "owner"
        | "farm_manager"
        | "storekeeper"
        | "accountant"
        | "worker"
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
      ],
      booking_status: ["requested", "accepted", "declined", "cancelled", "expired"],
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
      data_request_kind: ["export", "deletion"],
      data_request_status: ["open", "completed", "rejected", "cancelled"],
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
      farm_zone: ["rainforest", "derived_savanna", "other"],
      integration_kind: ["sms", "identity", "weather"],
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
