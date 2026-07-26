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
      contrato_pets: {
        Row: {
          contrato_id: string
          id: string
          pet_id: string
        }
        Insert: {
          contrato_id: string
          id?: string
          pet_id: string
        }
        Update: {
          contrato_id?: string
          id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_pets_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_servicos: {
        Row: {
          contrato_id: string
          id: string
          servico_produto_id: string
        }
        Insert: {
          contrato_id: string
          id?: string
          servico_produto_id: string
        }
        Update: {
          contrato_id?: string
          id?: string
          servico_produto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_servicos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_servicos_servico_produto_id_fkey"
            columns: ["servico_produto_id"]
            isOneToOne: false
            referencedRelation: "servicos_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          criado_em: string
          fim_vigencia: string | null
          id: string
          inicio_vigencia: string
          modalidade_id: string
          numero: string
          observacoes: string | null
          periodicidade: string
          status: string
          tutor_id: string
          valor_mensal: number
        }
        Insert: {
          criado_em?: string
          fim_vigencia?: string | null
          id?: string
          inicio_vigencia: string
          modalidade_id: string
          numero: string
          observacoes?: string | null
          periodicidade?: string
          status?: string
          tutor_id: string
          valor_mensal: number
        }
        Update: {
          criado_em?: string
          fim_vigencia?: string | null
          id?: string
          inicio_vigencia?: string
          modalidade_id?: string
          numero?: string
          observacoes?: string | null
          periodicidade?: string
          status?: string
          tutor_id?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      especies: {
        Row: {
          ativo: boolean
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          id?: string
          nome?: string
        }
        Relationships: []
      }
      historico_status_os: {
        Row: {
          id: string
          observacao: string | null
          ocorrido_em: string
          os_id: string
          status: string
          usuario_id: string | null
          usuario_nome: string
        }
        Insert: {
          id?: string
          observacao?: string | null
          ocorrido_em?: string
          os_id: string
          status: string
          usuario_id?: string | null
          usuario_nome: string
        }
        Update: {
          id?: string
          observacao?: string | null
          ocorrido_em?: string
          os_id?: string
          status?: string
          usuario_id?: string | null
          usuario_nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_status_os_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades_servico: {
        Row: {
          ativo: boolean
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      ordens_pagamento: {
        Row: {
          competencia: string | null
          contrato_id: string | null
          criado_em: string
          id: string
          numero: string
          origem: string
          os_id: string | null
          status: string
          tutor_id: string
          valor_total: number
        }
        Insert: {
          competencia?: string | null
          contrato_id?: string | null
          criado_em?: string
          id?: string
          numero: string
          origem: string
          os_id?: string | null
          status?: string
          tutor_id: string
          valor_total: number
        }
        Update: {
          competencia?: string | null
          contrato_id?: string | null
          criado_em?: string
          id?: string
          numero?: string
          origem?: string
          os_id?: string | null
          status?: string
          tutor_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ordens_pagamento_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_pagamento_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_pagamento_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_falecimento: string | null
          id: string
          modalidade_id: string
          numero: string
          observacoes: string | null
          pet_id: string
          status: string
          total: number
          tutor_id: string
          usuario_criador_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_falecimento?: string | null
          id?: string
          modalidade_id: string
          numero: string
          observacoes?: string | null
          pet_id: string
          status?: string
          total?: number
          tutor_id: string
          usuario_criador_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_falecimento?: string | null
          id?: string
          modalidade_id?: string
          numero?: string
          observacoes?: string | null
          pet_id?: string
          status?: string
          total?: number
          tutor_id?: string
          usuario_criador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      os_itens: {
        Row: {
          descricao: string
          id: string
          os_id: string
          preco_unitario: number
          quantidade: number
          servico_produto_id: string | null
          subtotal: number | null
        }
        Insert: {
          descricao: string
          id?: string
          os_id: string
          preco_unitario: number
          quantidade?: number
          servico_produto_id?: string | null
          subtotal?: number | null
        }
        Update: {
          descricao?: string
          id?: string
          os_id?: string
          preco_unitario?: number
          quantidade?: number
          servico_produto_id?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "os_itens_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_itens_servico_produto_id_fkey"
            columns: ["servico_produto_id"]
            isOneToOne: false
            referencedRelation: "servicos_produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          criado_em: string
          data_recebimento: string | null
          data_vencimento: string
          forma_pagamento: string | null
          id: string
          numero: number
          observacao: string | null
          ordem_pagamento_id: string
          status: string
          total_parcelas: number
          valor: number
        }
        Insert: {
          criado_em?: string
          data_recebimento?: string | null
          data_vencimento: string
          forma_pagamento?: string | null
          id?: string
          numero: number
          observacao?: string | null
          ordem_pagamento_id: string
          status?: string
          total_parcelas: number
          valor: number
        }
        Update: {
          criado_em?: string
          data_recebimento?: string | null
          data_vencimento?: string
          forma_pagamento?: string | null
          id?: string
          numero?: number
          observacao?: string | null
          ordem_pagamento_id?: string
          status?: string
          total_parcelas?: number
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_ordem_pagamento_id_fkey"
            columns: ["ordem_pagamento_id"]
            isOneToOne: false
            referencedRelation: "ordens_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          cor: string
          criado_em: string
          data_falecimento: string | null
          data_nascimento: string | null
          especie_id: string | null
          id: string
          nome: string
          observacoes: string | null
          peso_kg: number
          raca_id: string | null
          sexo: string
          tutor_id: string
        }
        Insert: {
          cor: string
          criado_em?: string
          data_falecimento?: string | null
          data_nascimento?: string | null
          especie_id?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          peso_kg: number
          raca_id?: string | null
          sexo: string
          tutor_id: string
        }
        Update: {
          cor?: string
          criado_em?: string
          data_falecimento?: string | null
          data_nascimento?: string | null
          especie_id?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          peso_kg?: number
          raca_id?: string | null
          sexo?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_raca_id_fkey"
            columns: ["raca_id"]
            isOneToOne: false
            referencedRelation: "racas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id: string
          nome?: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      racas: {
        Row: {
          ativo: boolean
          especie_id: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          especie_id: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          especie_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "racas_especie_id_fkey"
            columns: ["especie_id"]
            isOneToOne: false
            referencedRelation: "especies"
            referencedColumns: ["id"]
          },
        ]
      }
      sequencias: {
        Row: {
          ano: number
          tipo: string
          ultimo_numero: number
        }
        Insert: {
          ano: number
          tipo: string
          ultimo_numero?: number
        }
        Update: {
          ano?: number
          tipo?: string
          ultimo_numero?: number
        }
        Relationships: []
      }
      servicos_produtos: {
        Row: {
          ativo: boolean
          criado_em: string
          descricao: string | null
          id: string
          nome: string
          preco: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome: string
          preco?: number
          tipo: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          tipo?: string
        }
        Relationships: []
      }
      tutores: {
        Row: {
          atualizado_em: string
          bairro: string
          cep: string
          cidade: string
          complemento: string | null
          cpf: string
          criado_em: string
          email: string
          id: string
          logradouro: string
          nome: string
          numero: string
          observacoes: string | null
          telefone: string
          uf: string
        }
        Insert: {
          atualizado_em?: string
          bairro: string
          cep: string
          cidade: string
          complemento?: string | null
          cpf: string
          criado_em?: string
          email: string
          id?: string
          logradouro: string
          nome: string
          numero: string
          observacoes?: string | null
          telefone: string
          uf: string
        }
        Update: {
          atualizado_em?: string
          bairro?: string
          cep?: string
          cidade?: string
          complemento?: string | null
          cpf?: string
          criado_em?: string
          email?: string
          id?: string
          logradouro?: string
          nome?: string
          numero?: string
          observacoes?: string | null
          telefone?: string
          uf?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_sequence: { Args: { _ano: number; _tipo: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "operacional" | "financeiro" | "recepcao"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "operacional", "financeiro", "recepcao"],
    },
  },
} as const
