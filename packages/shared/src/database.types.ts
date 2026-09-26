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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: never
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
      farms: {
        Row: {
          address_hint: string | null
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
          id: string
          lga: string | null
          location: unknown
          name: string
          onboarded_by: string | null
          organization_id: string | null
          owner_id: string
          state: string | null
          updated_at: string
          zone: Database["public"]["Enums"]["farm_zone"]
        }
        Insert: {
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          id?: string
          lga?: string | null
          location: unknown
          name: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          state?: string | null
          updated_at?: string
          zone?: Database["public"]["Enums"]["farm_zone"]
        }
        Update: {
          address_hint?: string | null
          area_ha?: number | null
          area_is_measured?: boolean
          boundary?: unknown
          created_at?: string
          id?: string
          lga?: string | null
          location?: unknown
          name?: string
          onboarded_by?: string | null
          organization_id?: string | null
          owner_id?: string
          state?: string | null
          updated_at?: string
          zone?: Database["public"]["Enums"]["farm_zone"]
        }
        Relationships: [
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
        ]
      }
      listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["listing_kind"]
          location: unknown
          operator_included: boolean
          owner_id: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          provider_type: Database["public"]["Enums"]["provider_type"] | null
          rate_kobo: number
          service_radius_km: number
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["listing_kind"]
          location: unknown
          operator_included?: boolean
          owner_id?: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          rate_kobo: number
          service_radius_km?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["listing_kind"]
          location?: unknown
          operator_included?: boolean
          owner_id?: string
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          provider_type?: Database["public"]["Enums"]["provider_type"] | null
          rate_kobo?: number
          service_radius_km?: number
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
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
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          cac_number?: string | null
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          cac_number?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plots: {
        Row: {
          area_ha: number | null
          area_is_measured: boolean
          boundary: unknown
          created_at: string
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
          farm_id?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
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
          full_name: string | null
          id: string
          lga: string | null
          onboarded_by: string | null
          phone: string | null
          preferred_language: Database["public"]["Enums"]["app_language"]
          state: string | null
          updated_at: string
          verification_tier: number
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          lga?: string | null
          onboarded_by?: string | null
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          state?: string | null
          updated_at?: string
          verification_tier?: number
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lga?: string | null
          onboarded_by?: string | null
          phone?: string | null
          preferred_language?: Database["public"]["Enums"]["app_language"]
          state?: string | null
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
      verifications: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["verification_kind"]
          masked_value: string | null
          profile_id: string
          provider: string | null
          reference: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["verification_kind"]
          masked_value?: string | null
          profile_id: string
          provider?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["verification_kind"]
          masked_value?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_role_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: {
          created_at: string
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
      cancel_role_request: {
        Args: { p_request_id: string }
        Returns: {
          created_at: string
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
      has_role: {
        Args: {
          p_provider_type?: Database["public"]["Enums"]["provider_type"]
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: { p_role?: Database["public"]["Enums"]["admin_role"] }
        Returns: boolean
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
      my_verification_tier: { Args: never; Returns: number }
      nearby_listings: {
        Args: {
          p_category?: string
          p_kind?: Database["public"]["Enums"]["listing_kind"]
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_km?: number
        }
        Returns: {
          category: string
          distance_km: number
          kind: Database["public"]["Enums"]["listing_kind"]
          listing_id: string
          operator_included: boolean
          owner_id: string
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          provider_type: Database["public"]["Enums"]["provider_type"]
          rate_kobo: number
          service_radius_km: number
          title: string
        }[]
      }
      org_role: {
        Args: { p_org: string }
        Returns: Database["public"]["Enums"]["org_member_role"]
      }
      reject_role_request: {
        Args: { p_note: string; p_request_id: string }
        Returns: {
          created_at: string
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
      write_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity: string
          p_entity_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "individual" | "business"
      admin_role:
        | "super_admin"
        | "verification_officer"
        | "support_officer"
        | "content_editor"
        | "finance_officer"
      app_language: "en" | "yo" | "pcm"
      app_role:
        | "crop_farmer"
        | "animal_farmer"
        | "machinery_owner"
        | "service_provider"
        | "input_supplier"
        | "buyer"
        | "logistics_provider"
        | "field_agent"
        | "institutional_partner"
        | "investor"
      farm_zone: "rainforest" | "derived_savanna" | "other"
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
        | "vet_doctor"
        | "agro_processor"
      request_status: "pending" | "approved" | "rejected" | "cancelled"
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
        "support_officer",
        "content_editor",
        "finance_officer",
      ],
      app_language: ["en", "yo", "pcm"],
      app_role: [
        "crop_farmer",
        "animal_farmer",
        "machinery_owner",
        "service_provider",
        "input_supplier",
        "buyer",
        "logistics_provider",
        "field_agent",
        "institutional_partner",
        "investor",
      ],
      farm_zone: ["rainforest", "derived_savanna", "other"],
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
        "vet_doctor",
        "agro_processor",
      ],
      request_status: ["pending", "approved", "rejected", "cancelled"],
      verification_kind: ["phone", "nin", "bvn", "cac", "document"],
      verification_status: ["pending", "verified", "failed"],
      waitlist_side: ["buyer", "seller"],
    },
  },
} as const
