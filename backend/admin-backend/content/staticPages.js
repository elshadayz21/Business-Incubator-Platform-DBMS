import pool from "../../config/db.js";

const ensureStaticPages = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS static_pages (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countRes = await pool.query(`SELECT COUNT(*)::int AS count FROM static_pages`);
  if (countRes.rows[0].count === 0) {
    const defaultPages = [
      {
        slug: "about",
        title: "About DxValley",
        body: `DxValley is the incubation arm of Cooperative Bank of Oromia. We create the structure, support, and community that help Ethiopian founders move from a promising idea to meaningful impact.

## Our Vision
To create a structured ecosystem where founders turn real problems into scalable businesses, with access to practical support and people at every stage.

## Our Mission
We empower startups and MSMEs with clear stages, expert mentorship, learning sprints, and a community that makes the hard work possible.

## How We Work
1. Evidence over noise — Talk is useful when it turns into a test.
2. Progress over perfection — The right next step beats a polished plan that never leaves the page.
3. Community with accountability — Founders do hard things together.`,
      },
      {
        slug: "terms",
        title: "Terms & Conditions",
        body: `Welcome to DxValley Incubation Center. By accessing or using our platform, services, and facilities, you agree to be bound by these terms.

## Program Participation
Participants in the incubation program agree to actively engage in scheduled workshops, mentorship sessions, and cohort activities.

## Intellectual Property
Founders retain full ownership of their intellectual property, ideas, and business assets created during the incubation program.

## Code of Conduct
All founders, mentors, and partners are expected to maintain professional conduct, respect confidentiality, and support fellow community members.`,
      },
      {
        slug: "faq",
        title: "Frequently Asked Questions",
        body: `Here are the most common questions about joining DxValley Incubation Center.

## Do I need a team to apply?
Not at all. You can apply as an individual and meet collaborators through the center, workshops, and cohort community.

## What kinds of founders does DxValley support?
We support early-stage startups and MSMEs solving meaningful problems, with tracks focused on Idea, MVP, and Scale-Up progress.

## Do you take equity in participating businesses?
Program terms depend on the specific cohort and support package. Details will be shared before acceptance.`,
      },
      {
        slug: "privacy-policy",
        title: "Privacy Policy",
        body: `Your privacy is important to us. This Privacy Policy explains how DxValley collects, uses, and protects your personal data.

## Information We Collect
We collect information you provide when registering, submitting applications, or interacting with our platform and mentors.

## How We Use Your Information
Your data is used solely for operating incubation programs, matching mentors, processing applications, and improving our services.

## Data Security
We implement robust technical and organizational security measures to safeguard your personal data against unauthorized access.`,
      },
    ];

    for (const p of defaultPages) {
      await pool.query(
        `INSERT INTO static_pages (slug, title, body) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING`,
        [p.slug, p.title, p.body]
      );
    }
  }
};

export const getAllStaticPages = async () => {
  await ensureStaticPages();
  const result = await pool.query(`SELECT * FROM static_pages ORDER BY title ASC`);
  return result.rows;
};

export const getStaticPageById = async (id) => {
  await ensureStaticPages();
  const result = await pool.query(`SELECT * FROM static_pages WHERE id = $1`, [id]);
  return result.rows[0];
};

export const getStaticPageBySlug = async (slug) => {
  await ensureStaticPages();
  const result = await pool.query(`SELECT * FROM static_pages WHERE slug = $1`, [slug]);
  return result.rows[0];
};

export const createStaticPage = async ({ slug, title, body }) => {
  await ensureStaticPages();
  const result = await pool.query(
    `INSERT INTO static_pages(slug, title, body) VALUES ($1, $2, $3) RETURNING *`,
    [slug, title, body]
  );
  return result.rows[0];
};

export const updateStaticPage = async (id, { slug, title, body }) => {
  await ensureStaticPages();
  const result = await pool.query(
    `UPDATE static_pages SET slug=$1, title=$2, body=$3, updated_at=now() WHERE id=$4 RETURNING *`,
    [slug, title, body, id]
  );
  return result.rows[0];
};

export const deleteStaticPage = async (id) => {
  await ensureStaticPages();
  await pool.query(`DELETE FROM static_pages WHERE id = $1`, [id]);
  return { success: true };
};
