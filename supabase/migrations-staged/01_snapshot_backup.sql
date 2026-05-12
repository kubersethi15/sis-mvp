-- ============================================================================
-- KAYA — DATA RECONCILIATION — STEP 2: SNAPSHOT BACKUP
-- ============================================================================
-- Purpose: Before any data migration, copy all affected tables into _backup_
-- tables so we have a perfect restoration point if anything goes wrong.
--
-- These backup tables are READ-ONLY snapshots. They stay until we're confident
-- the migration succeeded (1 week minimum), then can be dropped.
--
-- This file is SAFE TO RUN — it only creates new tables, doesn't modify
-- existing data.
--
-- Rollback: DROP TABLE _backup_*; (the only thing this creates)
-- ============================================================================

-- Use a fixed date suffix so all backup tables form a consistent set.
-- If we need to take another snapshot later, increment the date.

CREATE TABLE IF NOT EXISTS _backup_user_profiles_20260512 AS
  SELECT * FROM public.user_profiles;

CREATE TABLE IF NOT EXISTS _backup_jobseeker_profiles_20260512 AS
  SELECT * FROM public.jobseeker_profiles;

CREATE TABLE IF NOT EXISTS _backup_leee_sessions_20260512 AS
  SELECT * FROM public.leee_sessions;

CREATE TABLE IF NOT EXISTS _backup_leee_messages_20260512 AS
  SELECT * FROM public.leee_messages;

CREATE TABLE IF NOT EXISTS _backup_leee_extractions_20260512 AS
  SELECT * FROM public.leee_extractions;

CREATE TABLE IF NOT EXISTS _backup_applications_20260512 AS
  SELECT * FROM public.applications;

CREATE TABLE IF NOT EXISTS _backup_gate1_results_20260512 AS
  SELECT * FROM public.gate1_results;

CREATE TABLE IF NOT EXISTS _backup_gate2_results_20260512 AS
  SELECT * FROM public.gate2_results;

CREATE TABLE IF NOT EXISTS _backup_gate3_results_20260512 AS
  SELECT * FROM public.gate3_results;

CREATE TABLE IF NOT EXISTS _backup_psychologist_validations_20260512 AS
  SELECT * FROM public.psychologist_validations;

CREATE TABLE IF NOT EXISTS _backup_employer_profiles_20260512 AS
  SELECT * FROM public.employer_profiles;

CREATE TABLE IF NOT EXISTS _backup_vacancies_20260512 AS
  SELECT * FROM public.vacancies;

CREATE TABLE IF NOT EXISTS _backup_feedback_reports_20260512 AS
  SELECT * FROM public.feedback_reports;

CREATE TABLE IF NOT EXISTS _backup_onboarding_plans_20260512 AS
  SELECT * FROM public.onboarding_plans;

-- Verification — these counts should match the live tables.
-- Run this after the migration to confirm backup is complete:

-- SELECT 'user_profiles' AS t, count(*) FROM _backup_user_profiles_20260512
-- UNION ALL SELECT 'jobseeker_profiles', count(*) FROM _backup_jobseeker_profiles_20260512
-- UNION ALL SELECT 'leee_sessions', count(*) FROM _backup_leee_sessions_20260512
-- UNION ALL SELECT 'leee_messages', count(*) FROM _backup_leee_messages_20260512
-- UNION ALL SELECT 'leee_extractions', count(*) FROM _backup_leee_extractions_20260512
-- UNION ALL SELECT 'applications', count(*) FROM _backup_applications_20260512;
