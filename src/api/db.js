import { supabase } from './supabaseClient';

const SESSION_TOKEN_KEY = 'stem_compass_session_token';

export function setSessionToken(token) {
  if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  else sessionStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getSessionToken() {
  return sessionStorage.getItem(SESSION_TOKEN_KEY) || null;
}

function mapRow(row) {
  if (!row) return row;
  return {
    ...row,
    created_date: row.created_at,
  };
}

function mapRows(rows) {
  return (rows || []).map(mapRow);
}

function parseSort(sort) {
  if (!sort) return { column: 'created_at', ascending: false };
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const column = field === 'created_date' ? 'created_at' : field;
  return { column, ascending: !desc };
}

async function getTeacherId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');
  return user.id;
}

function createEntity(tableName) {
  return {
    async get(id) {
      const token = getSessionToken();
      if (token && tableName === 'diagnostics') {
        const { data, error } = await supabase.rpc('get_diagnostic_for_token', { p_token: token });
        if (error) throw error;
        const row = Array.isArray(data) ? data.find((d) => d.id === id) || data[0] : data;
        return mapRow(row);
      }
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return mapRow(data);
    },

    async list(sort, limit = 100) {
      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*').order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return mapRows(data);
    },

    async filter(filters = {}, sort, limit = 100) {
      const token = getSessionToken();

      if (token && tableName === 'diagnostic_access_links' && filters.token) {
        const { data, error } = await supabase.rpc('get_access_link_by_token', { p_token: filters.token });
        if (error) throw error;
        return mapRows(Array.isArray(data) ? data : data ? [data] : []);
      }

      if (token && tableName === 'diagnostic_responses' && filters.diagnostic_id) {
        const { data, error } = await supabase.rpc('list_responses_for_token', {
          p_token: token,
          p_diagnostic_id: filters.diagnostic_id,
        });
        if (error) throw error;
        return mapRows(data);
      }

      if (token && tableName === 'diagnostic_completion_status' && filters.diagnostic_id) {
        const { data, error } = await supabase.rpc('get_completion_for_token', {
          p_token: token,
          p_diagnostic_id: filters.diagnostic_id,
        });
        if (error) throw error;
        return mapRows(Array.isArray(data) ? data : data ? [data] : []);
      }

      const { column, ascending } = parseSort(sort);
      let query = supabase.from(tableName).select('*');
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      });
      query = query.order(column, { ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return mapRows(data);
    },

    async create(payload) {
      const token = getSessionToken();
      const teacherId = token ? null : await getTeacherId();
      const row = teacherId ? { ...payload, teacher_id: teacherId } : { ...payload };

      if (token && tableName === 'diagnostic_responses') {
        const { data, error } = await supabase.rpc('upsert_response_for_token', {
          p_token: token,
          p_diagnostic_id: payload.diagnostic_id,
          p_section_key: payload.section_key,
          p_question_key: payload.question_key,
          p_response_value: payload.response_value ?? null,
          p_response_text: payload.response_text ?? null,
          p_respondent_type: payload.respondent_type || 'learner',
          p_access_link_id: payload.access_link_id || null,
        });
        if (error) throw error;
        return mapRow(data);
      }

      if (token && tableName === 'diagnostic_completion_status') {
        const { data, error } = await supabase.rpc('upsert_completion_for_token', {
          p_token: token,
          p_diagnostic_id: payload.diagnostic_id,
          p_data: payload,
        });
        if (error) throw error;
        return mapRow(data);
      }

      const { data, error } = await supabase.from(tableName).insert(row).select('*').single();
      if (error) throw error;
      return mapRow(data);
    },

    async update(id, payload) {
      const token = getSessionToken();

      if (token && tableName === 'diagnostic_access_links') {
        const { data, error } = await supabase.rpc('open_access_link', { p_token: token });
        if (error) throw error;
        return mapRow(data);
      }

      if (token && tableName === 'diagnostic_responses') {
        const { data, error } = await supabase.rpc('upsert_response_for_token', {
          p_token: token,
          p_diagnostic_id: payload.diagnostic_id,
          p_section_key: payload.section_key,
          p_question_key: payload.question_key,
          p_response_value: payload.response_value ?? null,
          p_response_text: payload.response_text ?? null,
          p_respondent_type: payload.respondent_type || 'learner',
          p_access_link_id: payload.access_link_id || null,
        });
        if (error) throw error;
        return mapRow(data);
      }

      if (token && tableName === 'diagnostic_completion_status') {
        const { data, error } = await supabase.rpc('upsert_completion_for_token', {
          p_token: token,
          p_diagnostic_id: payload.diagnostic_id,
          p_data: payload,
        });
        if (error) throw error;
        return mapRow(data);
      }

      const { data, error } = await supabase.from(tableName).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
      if (error) throw error;
      return mapRow(data);
    },
  };
}

export const entities = {
  Learner: createEntity('learners'),
  Diagnostic: createEntity('diagnostics'),
  DiagnosticAccessLink: createEntity('diagnostic_access_links'),
  DiagnosticResponse: createEntity('diagnostic_responses'),
  DiagnosticCompletionStatus: createEntity('diagnostic_completion_status'),
  DiagnosticResult: createEntity('diagnostic_results'),
  Observation: createEntity('observations'),
  Report: createEntity('reports'),
};

export const db = {
  learners: entities.Learner,
  diagnostics: entities.Diagnostic,
  diagnosticAccessLinks: entities.DiagnosticAccessLink,
  diagnosticResponses: entities.DiagnosticResponse,
  diagnosticCompletionStatus: entities.DiagnosticCompletionStatus,
  diagnosticResults: entities.DiagnosticResult,
  observations: entities.Observation,
  reports: entities.Report,
};
