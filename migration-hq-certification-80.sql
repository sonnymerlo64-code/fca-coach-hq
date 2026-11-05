-- BACK UP database and review current constraints before running.
-- Allows new 80%-passing certification records; does not rewrite old scores.
ALTER TABLE public.pd_certifications DROP CONSTRAINT IF EXISTS pd_certifications_score_percent_check;
ALTER TABLE public.pd_certifications ADD CONSTRAINT pd_certifications_score_percent_check CHECK (score_percent >= 80 AND score_percent <= 100);
