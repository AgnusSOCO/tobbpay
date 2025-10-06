export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      collection_jobs: {
        Row: {
          approved_count: number;
          created_at: string;
          filename: string;
          id: string;
          processed_count: number;
          rejected_count: number;
          status: Database['public']['Enums']['job_status'];
          total_entries: number;
          updated_at: string;
          uploaded_by: string;
        };
        Insert: {
          approved_count?: number;
          created_at?: string;
          filename: string;
          id?: string;
          processed_count?: number;
          rejected_count?: number;
          status?: Database['public']['Enums']['job_status'];
          total_entries?: number;
          updated_at?: string;
          uploaded_by: string;
        };
        Update: {
          approved_count?: number;
          created_at?: string;
          filename?: string;
          id?: string;
          processed_count?: number;
          rejected_count?: number;
          status?: Database['public']['Enums']['job_status'];
          total_entries?: number;
          updated_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'collection_jobs_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      customers: {
        Row: {
          address: string | null;
          name: string;
          bin: string | null;
          brand: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          id: string;
          kushki_token: string | null;
          last4: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          bin?: string | null;
          brand?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          kushki_token?: string | null;
          last4?: string | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          bin?: string | null;
          brand?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          kushki_token?: string | null;
          last4?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      iso_codes: {
        Row: {
          code: string;
          description: string;
          details: string | null;
        };
        Insert: {
          code: string;
          description: string;
          details?: string | null;
        };
        Update: {
          code?: string;
          description?: string;
          details?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          amount: number;
          attempt_interval_minutes: number;
          attempts: number;
          collection_job_id: string | null;
          created_at: string;
          currency: string;
          customer_id: string;
          frequency: string;
          id: string;
          reference: string | null;
          start_date: string;
          status: Database['public']['Enums']['schedule_status'];
          time_of_day: string | null;
          updated_at: string;
          cardholder_name: string;
          card_number: string;
          name: string;
          movement?: string;
          expiryMonth?: number;
          expiryYear?: number;

          address: string;
          first_name: string;
          last_name: string;
          bin: string;
          brand: string;
          city: string;
          country: string;
          email: string;
          kushki_token: string;
          last4: string;
          subscriptionId: string;
        };
        Insert: {
          amount: number;
          attempt_interval_minutes?: number;
          attempts?: number;
          collection_job_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id: string;
          frequency: string;
          id?: string;
          reference?: string | null;
          start_date: string;
          status?: Database['public']['Enums']['schedule_status'];
          time_of_day?: string | null;
          updated_at?: string;
          card_number: string;
          name: string;
          movement?: string;
          expiryMonth?: number;
          expiryYear?: number;
          cardholder_name?: string;
          address: string | null;
          first_name: string;
          last_name: string;
          bin: string | null;
          brand: string | null;
          city: string | null;
          country: string | null;
          email: string | null;
          kushki_token: string | null;
          last4: string | null;
          subscriptionId: string;
        };
        Update: {
          amount?: number;
          attempt_interval_minutes?: number;
          attempts?: number;
          collection_job_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string;
          frequency?: string;
          id?: string;
          reference?: string | null;
          start_date?: string;
          status?: Database['public']['Enums']['schedule_status'];
          time_of_day?: string | null;
          updated_at?: string;
          card_number: string;
          name: string;
          cardholder_name?: string;
          movement?: string;
          expiryMonth?: number;
          expiryYear?: number;
          address: string | null;
          first_name: string;
          last_name: string;
          bin: string | null;
          brand: string | null;
          city: string | null;
          country: string | null;
          email: string | null;
          kushki_token: string | null;
          last4: string | null;
          subscriptionId: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedules_collection_job_id_fkey';
            columns: ['collection_job_id'];
            isOneToOne: false;
            referencedRelation: 'collection_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedules_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      transactions: {
        Row: {
          amount: number;
          attempt_number: number;
          collection_job_id: string | null;
          created_at: string;
          currency: string;
          customer_id: string;
          id: string;
          iso_code: string | null;
          kushki_ticket: string | null;
          processor_error: string | null;
          request_payload: Json | null;
          response: Json | null;
          status: Database['public']['Enums']['transaction_status'];
          updated_at: string;
          name: string;
        };
        Insert: {
          amount: number;
          attempt_number?: number;
          collection_job_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id: string;
          id?: string;
          iso_code?: string | null;
          kushki_ticket?: string | null;
          processor_error?: string | null;
          request_payload?: Json | null;
          response?: Json | null;
          status?: Database['public']['Enums']['transaction_status'];
          name: string;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          attempt_number?: number;
          collection_job_id?: string | null;
          created_at?: string;
          currency?: string;
          customer_id?: string;
          id?: string;
          iso_code?: string | null;
          kushki_ticket?: string | null;
          processor_error?: string | null;
          request_payload?: Json | null;
          response?: Json | null;
          status?: Database['public']['Enums']['transaction_status'];
          name: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_collection_job_id_fkey';
            columns: ['collection_job_id'];
            isOneToOne: false;
            referencedRelation: 'collection_jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      job_status: 'pending' | 'processing' | 'completed' | 'failed';
      schedule_status: 'active' | 'inactive';
      transaction_status: 'approved' | 'pending' | 'rejected';
      user_role: 'admin' | 'operator' | 'viewer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      job_status: ['pending', 'processing', 'completed', 'failed'],
      schedule_status: ['active', 'paused', 'completed', 'cancelled'],
      transaction_status: ['approved', 'pending', 'rejected'],
      user_role: ['admin', 'operator', 'viewer'],
    },
  },
} as const;
