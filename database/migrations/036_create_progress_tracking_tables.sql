-- Migration 036: Progress tracking module.
--
-- Admin defines Phases (e.g. "Idea Validation", "MVP Development"), each
-- optionally scoped to a single cohort (NULL = applies to every cohort/
-- project, used as a shared default template). Each phase has one or more
-- Tasks. Entrepreneurs submit work against a task for their project;
-- mentors assigned to that project review the submission (approve / request
-- changes). A task can be resubmitted after changes are requested, so
-- submissions are kept as history rather than overwritten in place.

CREATE TABLE IF NOT EXISTS progress_phases (
    id SERIAL PRIMARY KEY,
    cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active | archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_phases_cohort ON progress_phases(cohort_id);
CREATE INDEX IF NOT EXISTS idx_progress_phases_order ON progress_phases(order_index);

CREATE TABLE IF NOT EXISTS progress_tasks (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES progress_phases(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_tasks_phase ON progress_tasks(phase_id);

CREATE TABLE IF NOT EXISTS progress_submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES progress_tasks(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    submitted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    notes TEXT,
    link_url VARCHAR(500),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted | approved | changes_requested
    submitted_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_submissions_task ON progress_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_submissions_project ON progress_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_submissions_status ON progress_submissions(status);

CREATE TABLE IF NOT EXISTS progress_reviews (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES progress_submissions(id) ON DELETE CASCADE,
    mentor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL, -- approved | changes_requested | rejected
    feedback TEXT,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_reviews_submission ON progress_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_progress_reviews_mentor ON progress_reviews(mentor_id);
