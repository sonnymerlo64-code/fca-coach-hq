-- Review and back up the existing database before running. Run once in the EXISTING FCA Supabase project.
ALTER TABLE public.pd_certifications DROP CONSTRAINT IF EXISTS pd_certifications_score_percent_check;
ALTER TABLE public.pd_certifications ADD CONSTRAINT pd_certifications_score_percent_check CHECK (score_percent >= 80 AND score_percent <= 100);
