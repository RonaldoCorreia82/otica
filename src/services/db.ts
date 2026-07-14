import { supabase } from '@/lib/supabaseClient';

export interface Billing {
  id?: string;
  os: string;
  pagador: string;
  vencimento: string; // YYYY-MM-DD
  valor: number;
  endereco?: string;
  telefone?: string;
  cidade?: string;
  cpf?: string;
  observacao?: string;
  status: 'paid' | 'pending' | 'overdue';
  parcelas?: string;
  banco?: string;
  created_at?: string;
}

export interface Installment {
  date: string;
  value: number;
  paga?: boolean;
}

export function parseInstallments(item: Billing): Installment[] | null {
  if (!item.parcelas) return null;
  try {
    const list = JSON.parse(item.parcelas);
    if (Array.isArray(list)) {
      return list.map((p: any) => {
        const [year, month, day] = p.vencimento.split('-');
        return {
          date: `${day}/${month}/${year}`,
          value: Number(p.valor),
          paga: !!p.paga
        };
      });
    }
  } catch (e) {
    console.error("Error parsing parcelas JSON:", e);
  }
  return null;
}

export interface Recebido {
  id?: string;
  os: string;
  nome: string;
  cidade?: string;
  vencimento: string;
  endereco?: string;
  telefone?: string;
  pagamento: string;
  valor_pago: number;
  parcela: string;
  pagamento_metodo?: string;
  billing_id?: string;
  created_at?: string;
}

export interface User {
  id?: string;
  username: string;
  password?: string;
  role: 'admin' | 'operator';
  created_at?: string;
}

export const db = {
  // Billings operations
  async getBillings(): Promise<Billing[]> {
    const { data, error } = await supabase
      .from('billings')
      .select('*')
      .order('vencimento', { ascending: true });

    if (error) {
      console.error('Error fetching billings:', error.message);
      throw error;
    }
    return data || [];
  },

  async createBilling(billing: Omit<Billing, 'id' | 'created_at'>): Promise<Billing> {
    const { data, error } = await supabase
      .from('billings')
      .insert([billing])
      .select();

    if (error) {
      console.error('Error creating billing:', error.message);
      throw error;
    }
    return data[0];
  },

  async updateBilling(id: string, billing: Partial<Omit<Billing, 'id' | 'created_at'>>): Promise<Billing> {
    const { data, error } = await supabase
      .from('billings')
      .update(billing)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating billing:', error.message);
      throw error;
    }
    return data[0];
  },

  async deleteBilling(id: string): Promise<void> {
    const { error } = await supabase
      .from('billings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting billing:', error.message);
      throw error;
    }
  },

  // Recebidos operations
  async getRecebidos(): Promise<Recebido[]> {
    const { data, error } = await supabase
      .from('recebidos')
      .select('*')
      .order('pagamento', { ascending: false });

    if (error) {
      console.error('Error fetching recebidos:', error.message);
      throw error;
    }
    return data || [];
  },

  async createRecebido(recebido: Omit<Recebido, 'id' | 'created_at'>): Promise<Recebido> {
    const { data, error } = await supabase
      .from('recebidos')
      .insert([recebido])
      .select();

    if (error) {
      console.error('Error creating recebido:', error.message);
      throw error;
    }
    return data[0];
  },

  async updateRecebido(id: string, recebido: Partial<Omit<Recebido, 'id' | 'created_at'>>): Promise<Recebido> {
    const { data, error } = await supabase
      .from('recebidos')
      .update(recebido)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating recebido:', error.message);
      throw error;
    }
    return data[0];
  },

  async deleteRecebido(id: string): Promise<void> {
    const { error } = await supabase
      .from('recebidos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recebido:', error.message);
      throw error;
    }
  },

  async syncRecebidosForBilling(billingId: string, installments: Omit<Recebido, 'id' | 'created_at'>[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('recebidos')
      .delete()
      .eq('billing_id', billingId);

    if (deleteError) {
      console.error('Error deleting previous recebidos:', deleteError.message);
      throw deleteError;
    }

    if (installments.length > 0) {
      const { error: insertError } = await supabase
        .from('recebidos')
        .insert(installments);

      if (insertError) {
        console.error('Error inserting recebidos:', insertError.message);
        throw insertError;
      }
    }
  },

  async syncRecebidosFromBillingObject(billing: Billing): Promise<void> {
    if (!billing.id) return;
    
    const list: Omit<Recebido, 'id' | 'created_at'>[] = [];
    const parsed = parseInstallments(billing);
    
    if (parsed) {
      parsed.forEach((inst, idx) => {
        if (inst.paga || billing.status === 'paid') {
          const [day, month, year] = inst.date.split('/');
          list.push({
            os: billing.os,
            nome: billing.pagador,
            cidade: billing.cidade || undefined,
            vencimento: `${year}-${month}-${day}`,
            endereco: billing.endereco || undefined,
            telefone: billing.telefone || undefined,
            pagamento: new Date().toISOString().split('T')[0],
            valor_pago: inst.value,
            parcela: `${idx + 1} de ${parsed.length}`,
            billing_id: billing.id
          });
        }
      });
    } else {
      if (billing.status === 'paid') {
        list.push({
          os: billing.os,
          nome: billing.pagador,
          cidade: billing.cidade || undefined,
          vencimento: billing.vencimento,
          endereco: billing.endereco || undefined,
          telefone: billing.telefone || undefined,
          pagamento: new Date().toISOString().split('T')[0],
          valor_pago: billing.valor,
          parcela: '1 de 1',
          billing_id: billing.id
        });
      }
    }
    
    await this.syncRecebidosForBilling(billing.id, list);
  },

  async toggleBillingPaid(id: string, currentStatus: 'paid' | 'pending' | 'overdue'): Promise<Billing> {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    return this.updateBilling(id, { status: newStatus });
  },

  // Users operations
  async login(username: string, passwordStr: string): Promise<Omit<User, 'password'>> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, password, role')
      .eq('username', username)
      .single();
      
    if (error || !data) {
      throw new Error('Usuário ou senha incorretos.');
    }
    
    if (data.password !== passwordStr) {
      throw new Error('Usuário ou senha incorretos.');
    }
    
    return { id: data.id, username: data.username, role: data.role as 'admin' | 'operator' };
  },

  async getUsers(): Promise<Omit<User, 'password'>[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .order('username', { ascending: true });
      
    if (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
    return data || [];
  },

  async createUser(user: Omit<User, 'id' | 'created_at'>): Promise<Omit<User, 'password'>> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select('id, username, role, created_at');
      
    if (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
    return data[0];
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting user:', error.message);
      throw error;
    }
  },

  async changePassword(username: string, currentPasswordStr: string, newPasswordStr: string): Promise<void> {
    // Verify current password
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single();
      
    if (error || !data || data.password !== currentPasswordStr) {
      throw new Error('A senha atual está incorreta.');
    }
    
    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPasswordStr })
      .eq('username', username);
      
    if (updateError) {
      console.error('Error updating password:', updateError.message);
      throw updateError;
    }
  },

  async unifyBillings(idsToDelete: string[], unifiedData: Omit<Billing, 'id' | 'created_at'>): Promise<Billing> {
    // 1. Insert new unified record
    const { data, error } = await supabase
      .from('billings')
      .insert([unifiedData])
      .select();
      
    if (error) {
      console.error('Error creating unified billing:', error.message);
      throw error;
    }
    
    // 2. Delete old records
    const { error: deleteError } = await supabase
      .from('billings')
      .delete()
      .in('id', idsToDelete);
      
    if (deleteError) {
      console.error('Error deleting unified billings:', deleteError.message);
    }
    
    return data[0];
  }
};
