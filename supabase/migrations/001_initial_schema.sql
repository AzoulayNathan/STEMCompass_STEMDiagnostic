-- STEM Compass — initial schema (Supabase)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Teacher profile extension
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'parent', 'learner', 'school_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  display_name TEXT,
  age NUMERIC,
  age_group TEXT NOT NULL CHECK (age_group IN ('child', 'teen', 'adult')),
  learning_context TEXT,
  domain TEXT CHECK (domain IN ('mathematics', 'computer_science', 'mixed')),
  school_level TEXT,
  primary_goal TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  organization_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE SET NULL,
  learner_name TEXT,
  learner_profile_type TEXT NOT NULL CHECK (learner_profile_type IN ('child', 'teen', 'adult')),
  domain TEXT NOT NULL DEFAULT 'mathematics' CHECK (domain IN ('mathematics', 'computer_science', 'mixed')),
  diagnostic_mode TEXT NOT NULL CHECK (diagnostic_mode IN ('express', 'standard', 'complete')),
  context_type TEXT,
  selected_modules JSONB DEFAULT '[]'::jsonb,
  respondents JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft',
  workflow_status TEXT DEFAULT 'prepared',
  includes_parent_section BOOLEAN DEFAULT FALSE,
  includes_mini_tasks BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reliability_label TEXT,
  reliability_score NUMERIC,
  teacher_validated BOOLEAN DEFAULT FALSE,
  global_level_placeholder TEXT,
  summary_placeholder TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_access_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE SET NULL,
  respondent_type TEXT NOT NULL CHECK (respondent_type IN ('learner', 'parent', 'teacher')),
  learner_profile_type TEXT,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active',
  allowed_sections_json TEXT,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  question_key TEXT NOT NULL,
  response_value TEXT,
  response_text TEXT,
  respondent_type TEXT DEFAULT 'learner',
  learner_profile_type TEXT,
  access_link_id UUID REFERENCES diagnostic_access_links(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'shared_link',
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_completion_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  learner_section_completed BOOLEAN DEFAULT FALSE,
  parent_section_completed BOOLEAN DEFAULT FALSE,
  teacher_section_completed BOOLEAN DEFAULT FALSE,
  mini_task_completed BOOLEAN DEFAULT FALSE,
  reasoning_task_completed BOOLEAN DEFAULT FALSE,
  explanation_task_completed BOOLEAN DEFAULT FALSE,
  oral_explanation_completed BOOLEAN DEFAULT FALSE,
  learner_started_at TIMESTAMPTZ,
  learner_completed_at TIMESTAMPTZ,
  parent_started_at TIMESTAMPTZ,
  parent_completed_at TIMESTAMPTZ,
  teacher_started_at TIMESTAMPTZ,
  teacher_completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  missing_sections_json TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE SET NULL,
  global_level_estimate TEXT,
  oral_comprehension_level TEXT,
  written_comprehension_level TEXT,
  oral_interaction_level TEXT,
  written_production_level TEXT,
  vocabulary_level TEXT,
  grammar_in_context_level TEXT,
  instruction_comprehension_level TEXT,
  oral_confidence_score NUMERIC,
  autonomy_score NUMERIC,
  learner_strategy_score NUMERIC,
  exposure_score NUMERIC,
  consistency_score NUMERIC,
  emotional_block_score NUMERIC,
  need_for_structure_score NUMERIC,
  correction_tolerance_score NUMERIC,
  main_profile_type TEXT,
  profile_label TEXT,
  profile_explanation TEXT,
  global_profile_summary TEXT,
  secondary_profile_tags_json TEXT,
  priority_areas_json TEXT,
  recommended_method_text TEXT,
  avoid_list_json TEXT,
  recommended_activities_json TEXT,
  four_week_plan_json TEXT,
  next_session_focus_text TEXT,
  reliability_score NUMERIC,
  reliability_label TEXT,
  teacher_summary TEXT,
  parent_summary TEXT,
  learner_summary TEXT,
  teacher_validated BOOLEAN DEFAULT FALSE,
  teacher_adjustment_notes TEXT,
  motivation_profile TEXT,
  goal_clarity_score NUMERIC,
  engagement_levers_json TEXT,
  preferred_themes_json TEXT,
  success_indicator_text TEXT,
  first_lesson_angle_text TEXT,
  parent_support_notes TEXT,
  learner_personal_goal_text TEXT,
  main_blockage_text TEXT,
  teacher_posture TEXT,
  correction_strategy TEXT,
  recommended_first_activity TEXT,
  error_watchlist_json TEXT,
  level_confidence_label TEXT,
  missing_evidence_json TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diagnostic_id UUID NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  learner_id UUID REFERENCES learners(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('teacher', 'parent', 'learner')),
  report_title TEXT,
  report_content_json TEXT,
  report_content_text TEXT,
  audience TEXT,
  generated_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  export_status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learners_teacher ON learners(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_teacher ON diagnostics(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_learner ON diagnostics(learner_id);
CREATE INDEX IF NOT EXISTS idx_access_links_token ON diagnostic_access_links(token);
CREATE INDEX IF NOT EXISTS idx_access_links_diagnostic ON diagnostic_access_links(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_responses_diagnostic ON diagnostic_responses(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_results_diagnostic ON diagnostic_results(diagnostic_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_access_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_completion_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_self ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY learners_teacher ON learners FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY diagnostics_teacher ON diagnostics FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY access_links_teacher ON diagnostic_access_links FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY responses_teacher ON diagnostic_responses FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY completion_teacher ON diagnostic_completion_status FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY results_teacher ON diagnostic_results FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY observations_teacher ON observations FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY reports_teacher ON reports FOR ALL USING (auth.uid() = teacher_id);

-- Public token session RPCs (anon access via shared link)
CREATE OR REPLACE FUNCTION public.get_access_link_by_token(p_token TEXT)
RETURNS SETOF diagnostic_access_links
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM diagnostic_access_links WHERE token = p_token AND status = 'active' LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.get_diagnostic_for_token(p_token TEXT)
RETURNS SETOF diagnostics
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.* FROM diagnostics d
  JOIN diagnostic_access_links l ON l.diagnostic_id = d.id
  WHERE l.token = p_token AND l.status = 'active' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.open_access_link(p_token TEXT)
RETURNS diagnostic_access_links
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE link diagnostic_access_links;
BEGIN
  UPDATE diagnostic_access_links SET opened_at = COALESCE(opened_at, NOW()), updated_at = NOW()
  WHERE token = p_token AND status = 'active'
  RETURNING * INTO link;
  RETURN link;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_responses_for_token(p_token TEXT, p_diagnostic_id UUID)
RETURNS SETOF diagnostic_responses
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.* FROM diagnostic_responses r
  JOIN diagnostic_access_links l ON l.diagnostic_id = r.diagnostic_id
  WHERE l.token = p_token AND l.status = 'active' AND r.diagnostic_id = p_diagnostic_id;
$$;

CREATE OR REPLACE FUNCTION public.upsert_response_for_token(
  p_token TEXT,
  p_diagnostic_id UUID,
  p_section_key TEXT,
  p_question_key TEXT,
  p_response_value TEXT,
  p_response_text TEXT DEFAULT NULL,
  p_respondent_type TEXT DEFAULT 'learner',
  p_access_link_id UUID DEFAULT NULL
)
RETURNS diagnostic_responses
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  link diagnostic_access_links;
  existing diagnostic_responses;
  result diagnostic_responses;
BEGIN
  SELECT * INTO link FROM diagnostic_access_links WHERE token = p_token AND status = 'active' AND diagnostic_id = p_diagnostic_id;
  IF link IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;

  SELECT * INTO existing FROM diagnostic_responses
  WHERE diagnostic_id = p_diagnostic_id AND section_key = p_section_key AND question_key = p_question_key
    AND respondent_type = COALESCE(p_respondent_type, 'learner') LIMIT 1;

  IF existing IS NOT NULL THEN
    UPDATE diagnostic_responses SET response_value = p_response_value, response_text = p_response_text, answered_at = NOW(), updated_at = NOW()
    WHERE id = existing.id RETURNING * INTO result;
  ELSE
    INSERT INTO diagnostic_responses (teacher_id, diagnostic_id, section_key, question_key, response_value, response_text, respondent_type, access_link_id, answered_at, source)
    VALUES (link.teacher_id, p_diagnostic_id, p_section_key, p_question_key, p_response_value, p_response_text, COALESCE(p_respondent_type, 'learner'), COALESCE(p_access_link_id, link.id), NOW(), 'shared_link')
    RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_completion_for_token(p_token TEXT, p_diagnostic_id UUID)
RETURNS SETOF diagnostic_completion_status
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.* FROM diagnostic_completion_status c
  JOIN diagnostic_access_links l ON l.diagnostic_id = c.diagnostic_id
  WHERE l.token = p_token AND l.status = 'active' AND c.diagnostic_id = p_diagnostic_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.upsert_completion_for_token(p_token TEXT, p_diagnostic_id UUID, p_data JSONB)
RETURNS diagnostic_completion_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE link diagnostic_access_links; existing diagnostic_completion_status; result diagnostic_completion_status;
BEGIN
  SELECT * INTO link FROM diagnostic_access_links WHERE token = p_token AND status = 'active' AND diagnostic_id = p_diagnostic_id;
  IF link IS NULL THEN RAISE EXCEPTION 'Invalid token'; END IF;
  SELECT * INTO existing FROM diagnostic_completion_status WHERE diagnostic_id = p_diagnostic_id LIMIT 1;
  IF existing IS NOT NULL THEN
    UPDATE diagnostic_completion_status SET
      learner_section_completed = COALESCE((p_data->>'learner_section_completed')::boolean, learner_section_completed),
      parent_section_completed = COALESCE((p_data->>'parent_section_completed')::boolean, parent_section_completed),
      teacher_section_completed = COALESCE((p_data->>'teacher_section_completed')::boolean, teacher_section_completed),
      mini_task_completed = COALESCE((p_data->>'mini_task_completed')::boolean, mini_task_completed),
      reasoning_task_completed = COALESCE((p_data->>'reasoning_task_completed')::boolean, reasoning_task_completed),
      explanation_task_completed = COALESCE((p_data->>'explanation_task_completed')::boolean, explanation_task_completed),
      oral_explanation_completed = COALESCE((p_data->>'oral_explanation_completed')::boolean, oral_explanation_completed),
      learner_started_at = COALESCE((p_data->>'learner_started_at')::timestamptz, learner_started_at),
      learner_completed_at = COALESCE((p_data->>'learner_completed_at')::timestamptz, learner_completed_at),
      parent_started_at = COALESCE((p_data->>'parent_started_at')::timestamptz, parent_started_at),
      parent_completed_at = COALESCE((p_data->>'parent_completed_at')::timestamptz, parent_completed_at),
      teacher_started_at = COALESCE((p_data->>'teacher_started_at')::timestamptz, teacher_started_at),
      teacher_completed_at = COALESCE((p_data->>'teacher_completed_at')::timestamptz, teacher_completed_at),
      last_activity_at = NOW(), updated_at = NOW()
    WHERE id = existing.id RETURNING * INTO result;
  ELSE
    INSERT INTO diagnostic_completion_status (teacher_id, diagnostic_id, last_activity_at)
    VALUES (link.teacher_id, p_diagnostic_id, NOW()) RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_access_link_by_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_diagnostic_for_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.open_access_link TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_responses_for_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_response_for_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_completion_for_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_completion_for_token TO anon, authenticated;
