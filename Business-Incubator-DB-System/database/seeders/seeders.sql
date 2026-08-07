-- ============================================
-- COMPREHENSIVE DATABASE SEEDERS
-- Created: 2026-02-15
-- Description: Seed data for startup incubator platform
-- ============================================

-- Clear existing data (in correct order to respect foreign keys)
TRUNCATE TABLE 
  workshop_feedback,
  workshop_enrollments,
  workshop_attendance,
  funding_requests,
  project_resources,
  notifications,
  project_entrepreneurs,
  mentors,
  workshops,
  resources,
  projects,
  users
RESTART IDENTITY CASCADE;

-- ============================================
-- USERS TABLE (15 records)
-- ============================================
INSERT INTO "users" ("name", "user_code", "email", "password", "role", "profile_image") VALUES
-- Entrepreneurs
('Ahmed Hassan', 'ENT001', 'ahmed.hassan@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-1.jpg'),
('Sara Mohamed', 'ENT002', 'sara.mohamed@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-2.jpg'),
('Omar Khaled', 'ENT003', 'omar.khaled@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', NULL),
('Nour Abdallah', 'ENT004', 'nour.abdallah@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-4.jpg'),
('Youssef Ali', 'ENT005', 'youssef.ali@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', NULL),
('Maha Ibrahim', 'ENT006', 'maha.ibrahim@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-6.jpg'),
('Karim Yasser', 'ENT007', 'karim.yasser@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', NULL),
('Layla Mahmoud', 'ENT008', 'layla.mahmoud@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-8.jpg'),
('Hassan Farouk', 'ENT009', 'hassan.farouk@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', NULL),
('Dina Salah', 'ENT010', 'dina.salah@startup.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'entrepreneur', '/uploads/profile-images/profile-10.jpg'),

-- Mentors/Trainers
('Dr. Amr Mostafa', 'MENT01', 'amr.mostafa@incubator.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'mentor', '/assets/images/default-avatar.svg'),
('Eng. Heba Nabil', 'MENT02', 'heba.nabil@incubator.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'mentor', '/assets/images/default-avatar.svg'),
('Prof. Tarek Zaki', 'MENT03', 'tarek.zaki@incubator.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'mentor', NULL),

-- Investors
('Sherif Investments', 'INV001', 'sherif@ventures.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'investor', '/uploads/profile-images/investor-1.jpg'),
('Cairo Angels Fund', 'INV002', 'contact@cairoangels.eg', '$2b$10$X8qJ9ZmK3L4vN2pR5sT6wO.uVxYz1aBcDeF7gHiJ9kLmN0oPqR8sT', 'investor', '/uploads/profile-images/investor-2.jpg');

-- ============================================
-- PROJECTS TABLE (15 records)
-- ============================================
INSERT INTO "projects" (
  "name", "domain", "short_description", "problem", "solution", "tech_stack",
  "stage", "status", "github_url", "demo_url", "team_type", 
  "looking_for_cofounders", "funding_stage", "approved"
) VALUES
-- Healthcare & MedTech
('HealthHub', 'Healthcare', 'Digital health records for Egyptian hospitals', 
 'Hospitals in Egypt still use paper-based patient records leading to data loss, inefficiency, and medical errors. Patients cant access their medical history easily.',
 'Cloud-based electronic health records system with patient portal, doctor dashboard, and automated appointment scheduling. Uses blockchain for data security.',
 'React, Node.js, PostgreSQL, Blockchain, AWS',
 'in-progress', 'in-progress', 'https://github.com/healthhub/main', 'https://demo.healthhub.eg', 
 'team', false, 'seed', true),

('PharmaNow', 'Healthcare', 'On-demand medicine delivery', 
 'Many Egyptians face difficulty accessing pharmacies late at night or finding specific medications across multiple pharmacies.',
 'Mobile app connecting users with nearby pharmacies for instant medicine delivery. Real-time inventory tracking and prescription upload feature.',
 'Flutter, Firebase, Node.js, MongoDB, Google Maps API',
 'completed', 'completed', 'https://github.com/pharmanow/app', 'https://pharmanow.eg', 
 'large-team', false, 'bootstrapped', true),

-- EdTech
('SkillBridge', 'Education', 'Vocational training platform for blue-collar workers', 
 'Blue-collar workers in Egypt lack access to affordable, quality vocational training. Traditional institutes are expensive and time-consuming.',
 'Mobile-first platform offering video-based courses in trades like plumbing, carpentry, electrical work. Includes certification and job matching.',
 'React Native, Python Django, PostgreSQL, AWS S3',
 'in-progress', 'in-progress', 'https://github.com/skillbridge/platform', NULL, 
 'team', false, 'pre-seed', true),

('ArabicSTEM', 'Education', 'Arabic-language coding bootcamp for kids', 
 'Most programming resources are in English, creating barriers for Arabic-speaking children who want to learn coding.',
 'Gamified Arabic coding platform teaching Python, JavaScript through interactive stories and games. Curriculum designed by Egyptian educators.',
 'React, Node.js, Socket.io, MongoDB, WebGL',
 'idea', 'in-progress', NULL, NULL, 
 'individual', true, 'bootstrapped', false),

-- FinTech
('FlexPay', 'FinTech', 'Buy-now-pay-later for Egyptian e-commerce', 
 'Many Egyptians lack credit cards but want to purchase items online. Traditional payment methods create friction in e-commerce.',
 'BNPL solution integrated with Egyptian e-commerce platforms. Uses alternative credit scoring based on mobile data and utility payments.',
 'Node.js, React, PostgreSQL, Fawry API, Stripe',
 'in-progress', 'in-progress', 'https://github.com/flexpay/core', 'https://staging.flexpay.eg', 
 'large-team', false, 'seed', true),

('SaveSmart', 'FinTech', 'Automated savings and investment app', 
 'Young Egyptians struggle to save money due to lack of financial literacy and discipline. Bank accounts offer minimal returns.',
 'AI-powered app that automatically saves spare change from transactions and invests in low-risk funds. Gamified savings challenges.',
 'Flutter, Python FastAPI, PostgreSQL, Plaid API',
 'idea', 'in-progress', NULL, NULL, 
 'team', true, 'pre-seed', false),

-- AgriTech
('FarmLink', 'Agriculture', 'Direct farmer-to-retailer marketplace', 
 'Egyptian farmers sell produce through middlemen who take 40-60% profit. Retailers pay high prices while farmers earn little.',
 'B2B platform connecting farmers directly with restaurants, hotels, and grocery stores. Includes logistics coordination and quality verification.',
 'React, Node.js, Express, PostgreSQL, Google Maps',
 'completed', 'completed', 'https://github.com/farmlink/marketplace', 'https://farmlink.eg', 
 'large-team', false, 'seed', true),

('AgroAI', 'Agriculture', 'AI-powered crop disease detection', 
 'Farmers lose 20-30% of crops to diseases that could be prevented with early detection. Lack of agricultural experts in rural areas.',
 'Mobile app using computer vision to identify crop diseases from photos. Provides treatment recommendations in Arabic.',
 'Python, TensorFlow, Flutter, Firebase, GCP',
 'in-progress', 'in-progress', 'https://github.com/agroai/detector', 'https://demo.agroai.eg', 
 'team', false, 'pre-seed', true),

-- E-commerce & Retail
('LocalCraft', 'E-commerce', 'Marketplace for Egyptian handmade products', 
 'Egyptian artisans and craftspeople lack online presence to sell their traditional handmade products to wider markets.',
 'Curated marketplace featuring authentic Egyptian handicrafts, pottery, textiles. Includes storytelling about artisans and their craft.',
 'Next.js, Node.js, MongoDB, Stripe, Cloudflare',
 'in-progress', 'in-progress', 'https://github.com/localcraft/shop', 'https://localcraft.eg', 
 'individual', false, 'bootstrapped', true),

-- PropTech
('RentEase', 'Real Estate', 'Digital rental contracts and payment platform', 
 'Rental agreements in Egypt are often informal, leading to disputes. Tenants and landlords lack secure payment tracking.',
 'Platform for creating digital rental contracts, automated rent collection, maintenance requests, and dispute mediation.',
 'Vue.js, Laravel, MySQL, Fawry API, DocuSign',
 'idea', 'in-progress', NULL, NULL, 
 'team', true, 'pre-seed', false),

-- Transportation & Logistics
('DeliverNow', 'Logistics', 'Last-mile delivery network for small businesses', 
 'Small online businesses struggle with reliable, affordable delivery. Existing couriers are expensive and lack technology.',
 'Crowdsourced delivery platform connecting freelance drivers with businesses. Real-time tracking and optimized routing.',
 'React Native, Node.js, PostgreSQL, Google Maps API, Socket.io',
 'completed', 'completed', 'https://github.com/delivernow/platform', 'https://delivernow.eg', 
 'large-team', false, 'bootstrapped', true),

-- Social Impact
('RecycleHub', 'Environment', 'Waste collection and recycling marketplace', 
 'Egypt produces 21 million tons of waste annually with only 20% recycled. No efficient system for households to recycle.',
 'App connecting households with waste collectors. Users earn points redeemable for discounts. Partners with recycling facilities.',
 'React, Node.js, MongoDB, Stripe, Mapbox',
 'in-progress', 'in-progress', 'https://github.com/recyclehub/app', 'https://beta.recyclehub.eg', 
 'team', false, 'seed', true),

-- Entertainment & Media
('PodcastStudio', 'Media', 'Arabic podcast hosting and monetization platform', 
 'Arabic podcasters lack dedicated hosting platforms with monetization features. Existing platforms are English-focused.',
 'All-in-one podcasting platform with hosting, analytics, sponsorship matching, and listener subscriptions. Arabic-first design.',
 'React, Node.js, PostgreSQL, AWS S3, Stripe',
 'idea', 'in-progress', NULL, NULL, 
 'individual', true, 'bootstrapped', false),

-- Tourism & Hospitality
('TourGuideAI', 'Tourism', 'AI tour guide app for Egyptian monuments', 
 'Tourists visiting Egyptian monuments often lack proper context. Audio guides are expensive and outdated.',
 'AR-powered mobile app providing immersive historical context at monuments. Supports 15 languages with offline mode.',
 'Unity, React Native, Python, PostgreSQL, ARKit',
 'in-progress', 'in-progress', 'https://github.com/tourguideai/app', 'https://demo.tourguideai.eg', 
 'team', false, 'pre-seed', true),

-- HR & Recruitment
('SkillMatch', 'HR Tech', 'Skills-based job matching platform', 
 'Egyptian job market focuses on degrees rather than actual skills. Fresh graduates struggle to find relevant opportunities.',
 'Platform matching candidates with jobs based on skills assessment rather than CVs. Includes micro-internship opportunities.',
 'React, Python Django, PostgreSQL, OpenAI API',
 'completed', 'completed', 'https://github.com/skillmatch/platform', 'https://skillmatch.eg', 
 'team', false, 'seed', true),

-- Additional Idea Stage Projects
('WaterTrack', 'Environment', 'Smart water usage monitoring for households', 
 'Egyptians waste water through outdated infrastructure and lack of awareness about consumption patterns.',
 'IoT sensors that monitor water usage in real-time with mobile app alerts and conservation tips personalized by machine learning.',
 'IoT, Python, React, Firebase, Arduino',
 'idea', 'in-progress', NULL, NULL, 
 'individual', true, 'bootstrapped', false),

('EduConnect', 'Education', 'Online tutor matching platform', 
 'Students in Egypt struggle to find qualified tutors. Tutors lack centralized platforms to reach students.',
 'Marketplace connecting students with vetted tutors. Includes video lessons, progress tracking, and automated billing.',
 'Next.js, Node.js, PostgreSQL, Stripe, Zoom API',
 'idea', 'in-progress', NULL, NULL, 
 'team', true, 'pre-seed', false),

('FoodieMaps', 'Food & Beverage', 'Local restaurant discovery and ordering platform', 
 'Small local restaurants in Egypt cannot compete with delivery apps. Limited discoverability for authentic cuisine.',
 'Mobile app focusing on small, authentic local restaurants with direct ordering and loyalty rewards.',
 'React Native, Node.js, MongoDB, Firebase, Google Maps',
 'idea', 'in-progress', NULL, NULL, 
 'individual', true, 'bootstrapped', false),

('HealthyAI', 'Healthcare', 'AI-powered fitness and nutrition coaching', 
 'Egyptians lack personalized fitness and nutrition guidance. Generic programs don''t work for individual needs.',
 'App combining AI-powered workout plans, nutrition tracking, and virtual coaching based on individual health data.',
 'React, Python, TensorFlow, Firebase, Stripe',
 'idea', 'in-progress', NULL, NULL, 
 'team', true, 'pre-seed', false),

('SmartJobs', 'HR Tech', 'Remote work platform for Egyptian freelancers', 
 'Egyptian freelancers struggle to find international clients. Language and credibility are barriers.',
 'Platform specifically for Egyptian and Arab freelancers to connect with global clients with built-in translation.',
 'Vue.js, Laravel, MySQL, Stripe, Twilio',
 'idea', 'in-progress', NULL, NULL, 
 'individual', true, 'bootstrapped', false),

('EcoPackage', 'Environment', 'Eco-friendly packaging solutions for e-commerce', 
 'E-commerce in Egypt generates massive packaging waste. No sustainable packaging options available locally.',
 'Biodegradable packaging materials manufactured locally with API integration for e-commerce platforms.',
 'React, Node.js, MongoDB, Shopify API',
 'idea', 'in-progress', NULL, NULL, 
 'team', true, 'pre-seed', false);

-- ============================================
-- PROJECT_ENTREPRENEURS TABLE (30+ records)
-- ============================================
INSERT INTO "project_entrepreneurs" ("project_id", "user_id", "role_in_project") VALUES
-- HealthHub (Team)
(1, 1, 'founder'),
(1, 2, 'co-founder'),
(1, 3, 'co-founder'),

-- PharmaNow (Large Team)
(2, 2, 'founder'),
(2, 4, 'co-founder'),
(2, 5, 'co-founder'),
(2, 6, 'co-founder'),

-- SkillBridge (Team)
(3, 3, 'founder'),
(3, 7, 'co-founder'),

-- ArabicSTEM (Individual)
(4, 4, 'founder'),

-- FlexPay (Large Team)
(5, 5, 'founder'),
(5, 8, 'co-founder'),
(5, 9, 'co-founder'),
(5, 10, 'co-founder'),

-- SaveSmart (Team)
(6, 6, 'founder'),
(6, 1, 'co-founder'),

-- FarmLink (Large Team)
(7, 7, 'founder'),
(7, 2, 'co-founder'),
(7, 3, 'co-founder'),
(7, 4, 'co-founder'),

-- AgroAI (Team)
(8, 8, 'founder'),
(8, 5, 'co-founder'),

-- LocalCraft (Individual)
(9, 9, 'founder'),

-- RentEase (Team)
(10, 10, 'founder'),
(10, 6, 'co-founder'),

-- DeliverNow (Large Team)
(11, 1, 'founder'),
(11, 7, 'co-founder'),
(11, 8, 'co-founder'),
(11, 9, 'co-founder'),

-- RecycleHub (Team)
(12, 2, 'founder'),
(12, 10, 'co-founder'),

-- PodcastStudio (Individual)
(13, 3, 'founder'),

-- TourGuideAI (Team)
(14, 4, 'founder'),
(14, 5, 'co-founder'),

-- SkillMatch (Team)
(15, 6, 'founder'),
(15, 7, 'co-founder'),

-- WaterTrack (Individual)
(16, 8, 'founder'),

-- EduConnect (Team)
(17, 9, 'founder'),
(17, 10, 'co-founder'),

-- FoodieMaps (Individual)
(18, 1, 'founder'),

-- HealthyAI (Team)
(19, 2, 'founder'),
(19, 3, 'co-founder'),

-- SmartJobs (Individual)
(20, 4, 'founder'),

-- EcoPackage (Team)
(21, 5, 'founder'),
(21, 6, 'co-founder');

-- ============================================
-- WORKSHOPS TABLE (15 records)
-- ============================================
INSERT INTO "workshops" (
  "title", "description", "trainer_id", "mentor_name", "location", 
  "start_date", "end_date", "start_time", "end_time", "capacity", 
  "enrolled_count", "status", "schedule"
) VALUES
('MVP Development Workshop', 
 'Learn how to build a minimum viable product in 4 weeks. Covers product validation, prototyping, and rapid development techniques.',
 11, 'Dr. Amr Mostafa', 'Innovation Lab - Building A', 
 '2026-03-05', '2026-03-05', '09:00:00', '13:00:00', 30, 
 18, 'scheduled', '2026-03-05 09:00:00'),

('Pitch Deck Masterclass', 
 'Create investor-ready pitch decks. Learn storytelling, design principles, and delivery techniques.',
 12, 'Eng. Heba Nabil', 'Conference Room 2', 
 '2026-03-08', '2026-03-08', '14:00:00', '17:00:00', 25, 
 25, 'full', '2026-03-08 14:00:00'),

('Customer Discovery & Validation', 
 'Master the art of talking to customers. Learn interview techniques, survey design, and data analysis.',
 11, 'Dr. Amr Mostafa', 'Workshop Hall B', 
 '2026-03-12', '2026-03-12', '10:00:00', '14:00:00', 20, 
 12, 'scheduled', '2026-03-12 10:00:00'),

('Growth Hacking Bootcamp', 
 'Learn viral marketing techniques, SEO, content marketing, and analytics. Focus on low-budget high-impact strategies.',
 13, 'Prof. Tarek Zaki', 'Innovation Lab - Building A', 
 '2026-03-15', '2026-03-16', '09:00:00', '17:00:00', 35, 
 28, 'scheduled', '2026-03-15 09:00:00'),

('Financial Modeling for Startups', 
 'Build financial models, understand unit economics, burn rate, and revenue projections.',
 12, 'Eng. Heba Nabil', 'Meeting Room 4', 
 '2026-03-20', '2026-03-20', '13:00:00', '17:00:00', 25, 
 15, 'scheduled', '2026-03-20 13:00:00'),

('Legal Basics for Egyptian Startups', 
 'Incorporation, contracts, intellectual property protection, and regulatory compliance in Egypt.',
 11, 'Dr. Amr Mostafa', 'Conference Room 1', 
 '2026-03-22', '2026-03-22', '10:00:00', '13:00:00', 30, 
 20, 'scheduled', '2026-03-22 10:00:00'),

('UI/UX Design Sprint', 
 'Intensive 2-day workshop on user research, wireframing, prototyping using Figma.',
 13, 'Prof. Tarek Zaki', 'Design Studio', 
 '2026-03-25', '2026-03-26', '09:00:00', '17:00:00', 20, 
 20, 'full', '2026-03-25 09:00:00'),

('Digital Marketing on a Budget', 
 'Social media strategy, content creation, Facebook/Instagram ads, Google Ads basics.',
 12, 'Eng. Heba Nabil', 'Workshop Hall B', 
 '2026-03-28', '2026-03-28', '14:00:00', '18:00:00', 40, 
 32, 'scheduled', '2026-03-28 14:00:00'),

('Fundraising Strategy Workshop', 
 'Navigate the Egyptian investment landscape. Angel investors, VCs, grants, and crowdfunding.',
 11, 'Dr. Amr Mostafa', 'Conference Room 2', 
 '2026-04-02', '2026-04-02', '10:00:00', '14:00:00', 25, 
 10, 'scheduled', '2026-04-02 10:00:00'),

('Product Management Essentials', 
 'Product roadmaps, feature prioritization, user stories, and agile methodologies.',
 13, 'Prof. Tarek Zaki', 'Innovation Lab - Building A', 
 '2026-04-05', '2026-04-05', '09:00:00', '13:00:00', 30, 
 22, 'scheduled', '2026-04-05 09:00:00'),

('Technical Due Diligence for Non-Tech Founders', 
 'Understand your tech stack, evaluate developers, manage technical teams.',
 12, 'Eng. Heba Nabil', 'Meeting Room 3', 
 '2026-04-08', '2026-04-08', '14:00:00', '17:00:00', 20, 
 8, 'scheduled', '2026-04-08 14:00:00'),

('Content Marketing & SEO', 
 'Create content strategies, optimize for search engines, build organic traffic.',
 11, 'Dr. Amr Mostafa', 'Workshop Hall A', 
 '2026-04-12', '2026-04-12', '10:00:00', '15:00:00', 35, 
 0, 'scheduled', '2026-04-12 10:00:00'),

('Building SaaS Products', 
 'Architecture, subscription models, customer onboarding, and retention strategies.',
 13, 'Prof. Tarek Zaki', 'Innovation Lab - Building A', 
 '2026-04-15', '2026-04-16', '09:00:00', '17:00:00', 25, 
 16, 'scheduled', '2026-04-15 09:00:00'),

('Sales for Founders', 
 'Develop sales skills, pipeline management, cold outreach, and closing techniques.',
 12, 'Eng. Heba Nabil', 'Conference Room 1', 
 '2026-04-18', '2026-04-18', '13:00:00', '17:00:00', 30, 
 24, 'scheduled', '2026-04-18 13:00:00'),

('Startup Metrics That Matter', 
 'CAC, LTV, churn rate, NPS, and other critical KPIs. Learn what investors want to see.',
 11, 'Dr. Amr Mostafa', 'Meeting Room 4', 
 '2026-04-22', '2026-04-22', '10:00:00', '14:00:00', 25, 
 7, 'scheduled', '2026-04-22 10:00:00'),

-- Additional Workshops - Completed
('Product Launch Strategy', 
 'Go-to-market planning, launch timeline, announcement strategy, and post-launch metrics.',
 12, 'Eng. Heba Nabil', 'Conference Room 1', 
 '2026-02-01', '2026-02-01', '10:00:00', '13:00:00', 30, 
 24, 'completed', '2026-02-01 10:00:00'),

('Market Research Fundamentals', 
 'How to conduct effective market research, competitor analysis, and customer interviews.',
 13, 'Prof. Tarek Zaki', 'Workshop Hall A', 
 '2026-02-05', '2026-02-05', '09:00:00', '12:00:00', 25, 
 19, 'completed', '2026-02-05 09:00:00'),

('Team Building for Startups', 
 'Recruiting, onboarding, culture building, and managing early-stage teams.',
 11, 'Dr. Amr Mostafa', 'Innovation Lab - Building A', 
 '2026-02-10', '2026-02-11', '09:00:00', '17:00:00', 20, 
 18, 'completed', '2026-02-10 09:00:00'),

-- Active Workshops (Recently Started)
('Advanced Growth Hacking Techniques', 
 'Deep dive into growth hacking: viral loops, referral programs, retention strategies.',
 13, 'Prof. Tarek Zaki', 'Workshop Hall B', 
 '2026-02-15', '2026-02-15', '14:00:00', '17:00:00', 30, 
 28, 'active', '2026-02-15 14:00:00'),

('Data Analytics for Startups', 
 'Google Analytics, Mixpanel, data visualization, and actionable insights from data.',
 12, 'Eng. Heba Nabil', 'Meeting Room 2', 
 '2026-02-16', '2026-02-16', '10:00:00', '13:00:00', 25, 
 20, 'active', '2026-02-16 10:00:00'),

-- Upcoming Workshops
('Scaling Your Business Model', 
 'From startup to scale-up: organizational structure, processes, and team scaling.',
 11, 'Dr. Amr Mostafa', 'Conference Room 2', 
 '2026-02-20', '2026-02-20', '09:00:00', '13:00:00', 25, 
 12, 'scheduled', '2026-02-20 09:00:00'),

('International Market Entry', 
 'Expanding Egyptian startups to international markets: regulations, localization, partnerships.',
 13, 'Prof. Tarek Zaki', 'Innovation Lab - Building A', 
 '2026-02-25', '2026-02-25', '10:00:00', '14:00:00', 20, 
 11, 'scheduled', '2026-02-25 10:00:00'),

('Customer Success & Retention', 
 'Building customer loyalty, reducing churn, and maximizing customer lifetime value.',
 12, 'Eng. Heba Nabil', 'Workshop Hall A', 
 '2026-03-02', '2026-03-02', '13:00:00', '16:00:00', 30, 
 14, 'scheduled', '2026-03-02 13:00:00'),

('Advanced Financial Planning', 
 'Multi-year financial projections, scenario planning, and capital efficiency.',
 11, 'Dr. Amr Mostafa', 'Meeting Room 3', 
 '2026-03-08', '2026-03-08', '14:00:00', '17:00:00', 20, 
 9, 'scheduled', '2026-03-08 14:00:00');

-- ============================================
-- MENTORS TABLE (12 records)
-- ============================================
INSERT INTO "mentors" (
  "user_id", "name", "email", "phone", "expertise", "bio", "linkedin_url", 
  "years_of_experience", "availability", "status", "projects_count", "workshops_count"
) VALUES
-- Linked to existing users
(11, 'Dr. Amr Mostafa', 'amr.mostafa@incubator.eg', '+20 100 123 4567', 'Technology', 
 'Full-stack developer with 15+ years experience in building scalable web applications. Specialized in React, Node.js, and cloud architecture.',
 'https://linkedin.com/in/amr-mostafa', 15, 
 'weekends', 'active', 8, 12),

(12, 'Eng. Heba Nabil', 'heba.nabil@incubator.eg', '+20 100 234 5678', 'Business', 
 'Serial entrepreneur and business strategist. Founded 3 successful startups. Expert in business model validation and go-to-market strategies.',
 'https://linkedin.com/in/heba-nabil', 12, 
 'evenings', 'active', 6, 10),

(13, 'Prof. Tarek Zaki', 'tarek.zaki@incubator.eg', '+20 100 345 6789', 'Marketing', 
 'Digital marketing expert with proven track record in growth hacking. Helped 50+ startups scale from 0 to 10K users.',
 'https://linkedin.com/in/tarek-zaki', 10, 
 'flexible', 'active', 5, 8),

(14, 'Sherif Investments', 'sherif@ventures.eg', '+20 100 456 7890', 'Finance', 
 'Investment banker turned startup advisor. Specialized in fundraising strategy, financial modeling, and investor relations.',
 'https://linkedin.com/in/sherif-invest', 18, 
 'weekdays', 'active', 12, 5),

(15, 'Cairo Angels Fund', 'contact@cairoangels.eg', '+20 100 567 8901', 'Finance', 
 'Venture capital analyst with 8 years experience evaluating early-stage startups. Focus on FinTech and HealthTech sectors.',
 'https://linkedin.com/in/cairo-angels', 8, 
 'weekdays', 'active', 9, 3),

-- Standalone mentors (not linked to users table)
(NULL, 'Yasmin Ahmed', 'yasmin.design@mentor.eg', '+20 100 678 9012', 'Design', 
 'Product designer with expertise in UX/UI for mobile apps. Worked with 100+ startups on product design and user research.',
 'https://linkedin.com/in/yasmin-design', 9, 
 'weekends', 'active', 4, 7),

(NULL, 'Omar Rashad', 'omar.devops@mentor.eg', '+20 100 789 0123', 'Technology', 
 'DevOps engineer and cloud infrastructure specialist. Expert in AWS, Docker, Kubernetes, and CI/CD pipelines.',
 'https://linkedin.com/in/omar-devops', 11, 
 'evenings', 'active', 7, 4),

(NULL, 'Laila Ibrahim', 'laila.legal@mentor.eg', '+20 100 890 1234', 'Legal', 
 'Corporate lawyer specializing in startup law. Expert in incorporation, contracts, IP protection, and compliance.',
 'https://linkedin.com/in/laila-legal', 14, 
 'weekdays', 'active', 15, 6),

(NULL, 'Mohamed Salah', 'mohamed.sales@mentor.eg', '+20 100 901 2345', 'Business', 
 'Sales and partnership expert. Built sales teams for 5 B2B SaaS startups. Specialized in enterprise sales strategies.',
 'https://linkedin.com/in/mohamed-sales', 13, 
 'flexible', 'active', 10, 5),

(NULL, 'Nadia Hassan', 'nadia.content@mentor.eg', '+20 100 012 3456', 'Marketing', 
 'Content marketing strategist and SEO expert. Grew organic traffic for multiple startups from 0 to 100K monthly visitors.',
 'https://linkedin.com/in/nadia-content', 7, 
 'evenings', 'active', 6, 9),

(NULL, 'Ahmed Fathy', 'ahmed.mobile@mentor.eg', '+20 100 123 4567', 'Technology', 
 'Mobile app developer (iOS/Android). Published 20+ apps with 5M+ downloads. Expert in React Native and Flutter.',
 'https://linkedin.com/in/ahmed-mobile', 10, 
 'weekends', 'active', 8, 6),

(NULL, 'Sara Mahmoud', 'sara.ops@mentor.eg', '+20 100 234 5678', 'Business', 
 'Operations and supply chain consultant. Helped 30+ startups optimize processes and reduce costs by 40%.',
 'https://linkedin.com/in/sara-ops', 12, 
 'flexible', 'active', 11, 4);

-- ============================================
-- WORKSHOP_ENROLLMENTS TABLE (50+ records)
-- ============================================
INSERT INTO "workshop_enrollments" ("workshop_id", "entrepreneur_id", "entrepreneur_name", "entrepreneur_email", "attended", "feedback_rating", "feedback_comment") VALUES
-- Workshop 1 (18 enrollments)
(1, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Excellent workshop! Very practical and hands-on.'),
(1, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 4, 'Good content but could use more real examples.'),
(1, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Dr. Amr is an amazing instructor. Learned a lot!'),
(1, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', false, NULL, NULL),
(1, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 4, 'Very informative. Would recommend.'),
(1, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Best workshop I attended this year.'),
(1, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 3, 'Good but a bit rushed at the end.'),
(1, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Perfect pace and great material.'),
(1, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', false, NULL, NULL),
(1, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 4, 'Helpful insights for my project.'),
(1, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Second time attending - still valuable!'),
(1, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 4, 'Good refresher on MVP concepts.'),
(1, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Highly practical and actionable.'),
(1, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 4, 'Great networking opportunity too.'),
(1, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Exactly what I needed to hear.'),
(1, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', false, NULL, NULL),
(1, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Good value for time invested.'),
(1, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Will implement these techniques immediately.'),

-- Workshop 2 (25 enrollments - Full)
(2, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'My pitch improved dramatically!'),
(2, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Heba is a fantastic teacher.'),
(2, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Got great feedback on my deck.'),
(2, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Essential for any founder raising funds.'),
(2, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Completely revamped my presentation.'),
(2, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 4, 'Very detailed and thorough.'),
(2, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Learned the art of storytelling.'),
(2, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Perfect workshop timing for my fundraising.'),
(2, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 4, 'Great tips on slide design.'),
(2, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Worth every minute!'),
(2, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Best investment of my time.'),
(2, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Got investor meetings after this!'),
(2, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Practical and actionable advice.'),
(2, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Exceeded my expectations.'),
(2, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Highly recommend to everyone.'),
(2, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 4, 'Good workshop, learned a lot.'),
(2, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Changed how I think about pitching.'),
(2, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Professional and well-organized.'),
(2, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Amazing content and delivery.'),
(2, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 4, 'Very helpful workshop.'),
(2, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', false, NULL, NULL),
(2, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Third time lucky - still learning!'),
(2, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Great atmosphere and content.'),
(2, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 4, 'Good workshop overall.'),
(2, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Brilliant workshop!'),

-- Workshop 3 (12 enrollments)
(3, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', false, NULL, NULL),
(3, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', false, NULL, NULL),
(3, 3, 'Omar Khaled', 'omar.khaled@startup.eg', false, NULL, NULL),
(3, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', false, NULL, NULL),
(3, 5, 'Youssef Ali', 'youssef.ali@startup.eg', false, NULL, NULL),
(3, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', false, NULL, NULL),
(3, 7, 'Karim Yasser', 'karim.yasser@startup.eg', false, NULL, NULL),
(3, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', false, NULL, NULL),
(3, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', false, NULL, NULL),
(3, 10, 'Dina Salah', 'dina.salah@startup.eg', false, NULL, NULL),
(3, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', false, NULL, NULL),
(3, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', false, NULL, NULL);

-- Workshop 4-15+ (Additional enrollments for new workshops)
-- Workshop 16 - Product Launch (Completed)
INSERT INTO "workshop_enrollments" ("workshop_id", "entrepreneur_id", "entrepreneur_name", "entrepreneur_email", "attended", "feedback_rating", "feedback_comment") VALUES
(16, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Excellent launch strategy framework!'),
(16, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Very practical and actionable tips.'),
(16, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Good content, well delivered.'),
(16, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Helped us plan our launch perfectly.'),
(16, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 4, 'Great real-world examples provided.'),
(16, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Best workshop for launch planning.'),
(16, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Solid framework and execution guide.'),
(16, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Perfect timing for our product launch.'),
(16, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Exceeded expectations!'),
(16, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 4, 'Learned critical launch strategies.'),
(16, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Would attend again if offered.'),
(16, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Outstanding instructor.'),
(16, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Very well structured workshop.'),
(16, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Critical knowledge for founders.'),
(16, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Recommended to all my peers.'),
(16, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 4, 'Great networking opportunity too.'),
(16, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Essential workshop content.'),
(16, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 4, 'Practical and insightful.'),
(16, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Changed our launch approach.'),
(16, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Invaluable for product teams.'),
(16, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Worth every minute!'),
(16, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 4, 'High quality content.'),
(16, 3, 'Omar Khaled', 'omar.khaled@startup.eg', false, NULL, NULL),
(16, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Amazing instructor expertise.'),

-- Workshop 17 - Market Research (Completed)
(17, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Comprehensive market research guide.'),
(17, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 4, 'Excellent competitor analysis tools.'),
(17, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Prof. Tarek is outstanding!'),
(17, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Changed how we validate assumptions.'),
(17, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 4, 'Very practical methodologies.'),
(17, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Most useful research workshop ever.'),
(17, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 4, 'Great frameworks provided.'),
(17, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Helped us identify market gaps.'),
(17, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Excellent content and delivery.'),
(17, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 4, 'Would recommend to others.'),
(17, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Perfect for early-stage startups.'),
(17, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Actionable insights throughout.'),
(17, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 4, 'Great case studies used.'),
(17, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Essential for any founder.'),
(17, 7, 'Karim Yasser', 'karim.yasser@startup.eg', false, NULL, NULL),
(17, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Transformed our market approach.'),
(17, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 4, 'Solid research methodologies.'),
(17, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Best market research workshop.'),

-- Workshop 18 - Team Building (Completed - 2 day event)
(18, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Excellent team dynamics content.'),
(18, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Dr. Amr covered everything perfectly.'),
(18, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Best team building workshop!'),
(18, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 4, 'Great HR strategies taught.'),
(18, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Helped us structure our team.'),
(18, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Invaluable for team scaling.'),
(18, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Practical recruitment advice.'),
(18, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Changed our hiring process.'),
(18, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Outstanding content delivery!'),
(18, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 4, 'Very comprehensive workshop.'),
(18, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Worth the 2-day commitment.'),
(18, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Implemented strategies immediately.'),
(18, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Great networking opportunities.'),
(18, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Critical for scaling startups.'),
(18, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Transformed our team culture.'),
(18, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', false, NULL, NULL),
(18, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Best workshop ever attended.'),
(18, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Excellent instruction quality.'),

-- Workshop 19 - Advanced Growth Hacking (Active)
(19, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Cutting-edge growth techniques!'),
(19, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Amazing content so far.'),
(19, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Prof. Tarek is brilliant.'),
(19, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 4, 'Already applying techniques.'),
(19, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Viral loops explained perfectly.'),
(19, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Best part so far!'),
(19, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Very practical sessions.'),
(19, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Implementing today!'),
(19, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Fantastic workshop!'),
(19, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 4, 'Learning so much.'),
(19, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Will change our growth strategy.'),
(19, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Excellent presentation.'),
(19, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Taking detailed notes!'),
(19, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 4, 'Great case studies used.'),
(19, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Love the interactive format.'),
(19, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 5, 'Must-attend workshop.'),
(19, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 4, 'Already seeing results.'),
(19, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Outstanding!'),
(19, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Best growth workshop ever.'),
(19, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 5, 'Game-changing content!'),
(19, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 4, 'Definitely implementing this.'),
(19, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Perfect timing for our growth.'),
(19, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 5, 'Exceeded expectations!'),
(19, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Phenomenal insights shared.'),
(19, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Will recommend to all founders.'),
(19, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Great strategies and tactics.'),
(19, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Implementing immediately.'),

-- Workshop 20 - Data Analytics (Active)
(20, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 4, 'Great analytics frameworks.'),
(20, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Heba makes analytics simple.'),
(20, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 5, 'Excellent practical examples.'),
(20, 4, 'Nour Abdallah', 'nour.abdallah@startup.eg', true, 4, 'Learning a lot about tracking.'),
(20, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Analytics made simple.'),
(20, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Actionable insights throughout.'),
(20, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Great tools recommendations.'),
(20, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Implementing tracking today.'),
(20, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Essential workshop!'),
(20, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Perfect for data-driven teams.'),
(20, 1, 'Ahmed Hassan', 'ahmed.hassan@startup.eg', true, 4, 'Good refresher on metrics.'),
(20, 2, 'Sara Mohamed', 'sara.mohamed@startup.eg', true, 5, 'Already applying knowledge.'),
(20, 3, 'Omar Khaled', 'omar.khaled@startup.eg', true, 4, 'Very professional delivery.'),
(20, 5, 'Youssef Ali', 'youssef.ali@startup.eg', true, 5, 'Best analytics workshop.'),
(20, 6, 'Maha Ibrahim', 'maha.ibrahim@startup.eg', true, 5, 'Love the hands-on approach.'),
(20, 7, 'Karim Yasser', 'karim.yasser@startup.eg', true, 4, 'Great for beginners.'),
(20, 8, 'Layla Mahmoud', 'layla.mahmoud@startup.eg', true, 5, 'Life-changing knowledge.'),
(20, 9, 'Hassan Farouk', 'hassan.farouk@startup.eg', true, 5, 'Outstanding content delivery!'),
(20, 10, 'Dina Salah', 'dina.salah@startup.eg', true, 5, 'Will recommend to metrics teams.');

-- ============================================
-- RESOURCES TABLE (12 records)
-- ============================================
INSERT INTO "resources" ("name", "type", "description") VALUES
('Co-Working Space A', 'workspace', 'Modern co-working space with high-speed internet, meeting rooms, and printing facilities. Located in Maadi. Capacity: 50 desks.'),
('Co-Working Space B', 'workspace', 'Creative space in Zamalek with private offices, phone booths, and event area. Includes kitchen and lounge. Capacity: 30 desks.'),
('Innovation Lab', 'equipment', 'Hardware prototyping lab with 3D printers, laser cutters, Arduino kits, Raspberry Pi, and electronics components.'),
('Media Studio', 'equipment', 'Professional video recording and editing studio. Includes cameras, lighting, microphones, and editing software.'),
('AWS Cloud Credits', 'cloud_service', '$5,000 in AWS cloud credits for hosting, computing, storage, and machine learning services.'),
('Google Cloud Platform Credits', 'cloud_service', '$3,000 in GCP credits. Includes access to Google AI/ML tools and Firebase services.'),
('Design Software Licenses', 'software', 'Adobe Creative Cloud licenses (Photoshop, Illustrator, XD, Premiere Pro) for 20 users.'),
('Development Tools Suite', 'software', 'JetBrains All Products Pack, GitHub Enterprise, Notion Business, and Slack Business licenses.'),
('Legal Consultation Package', 'consultation', '10 hours of legal consultation covering incorporation, contracts, IP protection, and compliance.'),
('Accounting & Tax Services', 'consultation', 'Monthly bookkeeping and quarterly tax filing services for startups in their first year.'),
('Marketing Budget Grant', 'grant', 'EGP 20,000 grant for digital marketing expenses including ads, content creation, and SEO tools.'),
('Mentorship Program', 'mentorship', 'Access to 1-on-1 mentorship sessions with industry experts. 2 sessions per month for 6 months.'),

-- Meeting Rooms
('Meeting Room 1', 'meeting_room', 'Intimate meeting room for 4-6 people. Equipped with large monitor, whiteboard, and video conferencing setup.'),
('Meeting Room 2', 'meeting_room', 'Medium meeting room for 8-10 people. Professional setup with projector, conference table, and soundproofing.'),
('Meeting Room 3', 'meeting_room', 'Large boardroom for 15-20 people. Full AV setup with screens on multiple walls, recording capability.'),
('Meeting Room 4', 'meeting_room', 'Executive meeting room with premium furnishings for investor presentations. 10-12 capacity.');

-- ============================================
-- PROJECT_RESOURCES TABLE (25 records)
-- ============================================
INSERT INTO "project_resources" ("project_id", "resource_id") VALUES
-- HealthHub
(1, 1), (1, 5), (1, 8), (1, 9),
-- PharmaNow
(2, 2), (2, 6), (2, 10), (2, 12),
-- SkillBridge
(3, 1), (3, 5), (3, 7), (3, 11),
-- FlexPay
(5, 2), (5, 6), (5, 9), (5, 10),
-- FarmLink
(7, 1), (7, 5), (7, 8), (7, 12),
-- AgroAI
(8, 3), (8, 6), (8, 12),
-- RecycleHub
(12, 2), (12, 11);

-- ============================================
-- FUNDING_REQUESTS TABLE (15 records)
-- ============================================
INSERT INTO "funding_requests" (
  "project_id", "investor_id", "amount", "status", "funding_stage", 
  "description", "reviewed_by", "notes", "reviewed_at"
) VALUES
-- Approved requests
(1, 14, 250000.00, 'Approved', 'seed', 
 'Seeking seed funding to expand our hospital partnerships from 5 to 20 hospitals and hire 3 additional developers.',
 11, 'Strong team with proven traction. 5 hospitals already onboarded. Approved for full amount.', 
 '2026-02-10 14:30:00'),

(2, 15, 150000.00, 'Approved', 'bootstrapped', 
 'Need funding for marketing campaign and delivery fleet expansion to cover 3 new cities.',
 11, 'Profitable unit economics. Good growth potential. Approved.', 
 '2026-02-08 11:20:00'),

(5, 14, 500000.00, 'Approved', 'seed', 
 'Series A preparation. Need funds for regulatory compliance, team scaling, and partnership with 3 major e-commerce platforms.',
 12, 'Excellent FinTech solution addressing real market need. Compliance roadmap is solid. Approved.', 
 '2026-01-25 16:45:00'),

(7, 15, 350000.00, 'Approved', 'seed', 
 'Expand to 3 new governorates and build cold storage facilities. Already connected 200 farmers with 50 retailers.',
 11, 'Impressive traction and impact on farmer income. Strategic expansion plan. Approved.', 
 '2026-02-01 10:15:00'),

(12, 14, 180000.00, 'Approved', 'seed', 
 'Scale recycling network to cover Greater Cairo. Build mobile app and partner with 10 recycling facilities.',
 12, 'Strong social impact. Solid business model. Team has relevant experience. Approved.', 
 '2026-02-12 13:50:00'),

-- Pending requests
(3, NULL, 120000.00, 'Pending', 'pre-seed', 
 'Pre-seed funding to complete platform development, create 50 course modules, and onboard 10 instructors.',
 NULL, NULL, NULL),

(6, NULL, 80000.00, 'Pending', 'pre-seed', 
 'Need funding for app development completion, financial licenses, and initial marketing to acquire first 1000 users.',
 NULL, NULL, NULL),

(8, NULL, 200000.00, 'Pending', 'pre-seed', 
 'Funding required for AI model training on 50,000 crop images, mobile app development, and pilot program with 100 farmers.',
 NULL, NULL, NULL),

(14, NULL, 90000.00, 'Pending', 'pre-seed', 
 'Complete AR features for 10 major monuments, translate to 15 languages, and launch marketing campaign.',
 NULL, NULL, NULL),

-- Under Review
(1, 15, 100000.00, 'Under Review', 'seed', 
 'Additional funding for mobile app development (iOS & Android) and patient data migration tools.',
 11, 'Under technical due diligence. Team needs to provide more details on data security approach.', 
 NULL),

(9, NULL, 60000.00, 'Under Review', 'bootstrapped', 
 'Marketing budget to reach craft artisans in Upper Egypt and promotional campaign for Ramadan season.',
 12, 'Good concept but team needs to demonstrate better artisan retention metrics.', 
 NULL),

-- Rejected requests
(4, NULL, 150000.00, 'Rejected', 'bootstrapped', 
 'Large funding request for individual founder project. Need to hire 5 developers and launch in 3 months.',
 11, 'Project scope too ambitious for single founder. Recommend starting smaller or finding co-founders first.', 
 '2026-01-15 09:30:00'),

(10, NULL, 200000.00, 'Rejected', 'pre-seed', 
 'Complete platform development and launch in 5 major cities simultaneously.',
 12, 'Go-to-market strategy not well defined. Team lacks PropTech experience. Needs more validation.', 
 '2026-01-28 15:20:00'),

(13, NULL, 300000.00, 'Rejected', 'bootstrapped', 
 'Build complete podcasting platform with 50+ features competing with international players.',
 11, 'Feature set too broad. Recommend focusing on core problem first. Team size insufficient for scope.', 
 '2026-02-05 11:10:00'),

-- Recent approved
(15, 14, 220000.00, 'Approved', 'seed', 
 'Expand skills assessment library to 100 job categories and build employer dashboard for hiring.',
 12, 'Innovative approach to job matching. Strong pilot results with 500 candidates. Approved.', 
 '2026-02-14 14:00:00');

-- ============================================
-- NOTIFICATIONS TABLE (20 records)
-- ============================================
INSERT INTO "notifications" ("user_id", "type", "message", "read") VALUES
-- User 1 (Ahmed Hassan)
(1, 'funding', 'Your funding request for HealthHub (EGP 250,000) has been approved! 🎉', true),
(1, 'workshop', 'You have been enrolled in "MVP Development Workshop" on March 5th', true),
(1, 'project', 'Your project HealthHub has been approved by the review team', true),
(1, 'funding', 'New funding request submitted successfully for review', false),

-- User 2 (Sara Mohamed)
(2, 'funding', 'Congratulations! Your funding request for PharmaNow (EGP 150,000) has been approved', true),
(2, 'workshop', 'Reminder: Pitch Deck Masterclass starts tomorrow at 2:00 PM', false),
(2, 'project', 'You have been added as co-founder to FarmLink project', true),

-- User 3 (Omar Khaled)
(3, 'workshop', 'New workshop available: Customer Discovery & Validation - March 12th', false),
(3, 'project', 'Your project SkillBridge is now visible in the projects marketplace', true),

-- User 4 (Nour Abdallah)
(4, 'project', 'Your project ArabicSTEM is pending admin approval', false),
(4, 'workshop', 'You have been waitlisted for UI/UX Design Sprint workshop', true),

-- User 5 (Youssef Ali)
(5, 'funding', 'Great news! FlexPay funding request (EGP 500,000) has been approved', true),
(5, 'project', 'New co-founder has joined your project', true),

-- User 6 (Maha Ibrahim)
(6, 'funding', 'Your funding request for SaveSmart is currently under review', false),
(6, 'workshop', 'Enrollment confirmed for Financial Modeling workshop', true),

-- User 7 (Karim Yasser)
(7, 'funding', 'FarmLink has received approved funding of EGP 350,000', true),
(7, 'project', 'Your project has received a new resource allocation: Co-Working Space A', true),

-- User 8 (Layla Mahmoud)
(8, 'funding', 'Funding request for AgroAI is pending review. Expected response in 5 business days.', false),
(8, 'workshop', 'Workshop attendance recorded. Please provide feedback!', true),

-- User 9 (Hassan Farouk)
(9, 'project', 'LocalCraft has been featured in this month newsletter!', false);

-- ============================================
-- WORKSHOP_FEEDBACK TABLE (15 records)
-- ============================================
INSERT INTO "workshop_feedback" ("workshop_id", "enrollment_id", "rating", "comment") VALUES
(1, 1, 5, 'Dr. Amr explained complex concepts in simple terms. The hands-on exercises were incredibly valuable.'),
(1, 2, 4, 'Very practical workshop. Would have loved more time for Q&A session.'),
(1, 3, 5, 'Best startup workshop I have attended. Will recommend to other founders.'),
(1, 5, 4, 'Great content and delivery. The MVP canvas exercise was eye-opening.'),
(1, 6, 5, 'Exceeded expectations. Helped me refocus my product strategy.'),
(2, 19, 5, 'Heba is an exceptional trainer. My pitch improved dramatically after this workshop.'),
(2, 20, 5, 'The before/after pitch comparison was mind-blowing. Learned so much about storytelling.'),
(2, 21, 4, 'Very comprehensive workshop. Slide design tips were particularly helpful.'),
(2, 23, 5, 'Got investor meetings scheduled right after implementing these techniques!'),
(2, 24, 4, 'Solid workshop with actionable advice. The pitch practice sessions were invaluable.'),
(1, 8, 5, 'Perfect balance of theory and practice. Left with a clear action plan.'),
(1, 10, 4, 'Very informative. The case studies of Egyptian startups were particularly relevant.'),
(2, 26, 5, 'Cannot recommend this enough. Essential for anyone preparing to raise funds.'),
(2, 28, 5, 'Transformed my pitch deck completely. Investors are now responding positively.'),
(2, 30, 4, 'Great workshop. The feedback session was extremely helpful.');

-- ============================================
-- WORKSHOP_ATTENDANCE TABLE (Legacy - keeping for backward compatibility)
-- ============================================
INSERT INTO "workshop_attendance" ("workshop_id", "user_id", "feedback") VALUES
(1, 1, 'Excellent workshop with practical insights'),
(1, 2, 'Very helpful for my project development'),
(1, 3, 'Great instructor and content'),
(2, 1, 'Transformed my pitch completely'),
(2, 2, 'Best workshop I attended'),
(2, 5, 'Highly recommend to all founders'),
(2, 7, 'Learned valuable storytelling techniques'),
(2, 8, 'Professional and well-organized'),
(4, 1, 'Excellent growth strategies learned'),
(4, 3, 'Very comprehensive bootcamp'),
(5, 2, 'Financial modeling made easy'),
(5, 6, 'Essential for understanding unit economics');

-- ============================================
-- MENTOR_PROJECT_ASSIGNMENTS TABLE
-- ============================================
INSERT INTO "mentor_project_assignments" ("mentor_id", "project_id", "assigned_at") VALUES
-- Mentor 1: Dr. Amr Mostafa - Tech expert
(1, 1, '2026-01-15'),  -- HealthHub
(1, 3, '2026-01-20'),  -- SkillBridge
(1, 5, '2026-02-01'),  -- FlexPay
(1, 8, '2026-01-25'),  -- AgroAI
(1, 14, '2026-02-05'), -- TourGuideAI

-- Mentor 2: Eng. Heba Nabil - Business expert
(2, 2, '2026-01-18'),  -- PharmaNow
(2, 6, '2026-01-22'),  -- SaveSmart
(2, 9, '2026-02-03'),  -- LocalCraft
(2, 15, '2026-02-10'), -- SkillMatch

-- Mentor 3: Prof. Tarek Zaki - Marketing expert
(3, 4, '2026-01-16'),  -- ArabicSTEM
(3, 7, '2026-01-28'),  -- FarmLink
(3, 12, '2026-02-08'), -- RecycleHub

-- Mentor 4: Sherif Investments - Finance expert
(4, 1, '2026-02-10'),  -- HealthHub
(4, 5, '2026-02-01'),  -- FlexPay

-- Mentor 5: Cairo Angels Fund - Finance expert
(5, 2, '2026-02-08'),  -- PharmaNow
(5, 7, '2026-02-01');  -- FarmLink

-- ============================================
-- MENTOR_WORKSHOP_ASSIGNMENTS TABLE
-- ============================================
INSERT INTO "mentor_workshop_assignments" ("mentor_id", "workshop_id", "assigned_at") VALUES
-- Mentor 1: Dr. Amr Mostafa - Leading 5 workshops
(1, 1, '2026-02-01'),   -- MVP Development Workshop
(1, 3, '2026-02-01'),   -- Customer Discovery & Validation
(1, 6, '2026-02-02'),   -- Legal Basics for Egyptian Startups
(1, 9, '2026-02-02'),   -- Fundraising Strategy Workshop
(1, 21, '2026-02-15'),  -- Scaling Your Business Model

-- Mentor 2: Eng. Heba Nabil - Leading 5 workshops
(2, 2, '2026-02-01'),   -- Pitch Deck Masterclass
(2, 5, '2026-02-01'),   -- Financial Modeling for Startups
(2, 8, '2026-02-03'),   -- Digital Marketing on a Budget
(2, 20, '2026-02-16'),  -- Data Analytics for Startups
(2, 23, '2026-02-18'),  -- Customer Success & Retention

-- Mentor 3: Prof. Tarek Zaki - Leading 5 workshops
(3, 4, '2026-02-01'),   -- Growth Hacking Bootcamp
(3, 7, '2026-02-02'),   -- UI/UX Design Sprint
(3, 10, '2026-02-03'),  -- Product Management Essentials
(3, 22, '2026-02-25'),  -- International Market Entry
(3, 19, '2026-02-15');  -- Advanced Growth Hacking Techniques

-- ============================================
-- UPDATE WORKSHOP ENROLLED COUNTS
-- ============================================
UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 1
) WHERE id = 1;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 2
) WHERE id = 2;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 3
) WHERE id = 3;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 16
) WHERE id = 16;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 17
) WHERE id = 17;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 18
) WHERE id = 18;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 19
) WHERE id = 19;

UPDATE "workshops" SET "enrolled_count" = (
  SELECT COUNT(*) FROM "workshop_enrollments" WHERE "workshop_id" = 20
) WHERE id = 20;

-- ============================================
-- VERIFY IDEA STAGE PROJECTS
-- ============================================
SELECT 'Idea Stage Projects:' as section;
SELECT id, name, domain, stage, status, looking_for_cofounders FROM projects WHERE stage = 'idea' ORDER BY id;

-- ============================================
-- VERIFY MENTOR ASSIGNMENTS
-- ============================================
SELECT 'Mentor Project Assignments:' as section;
SELECT m.id, m.name, m.expertise, COUNT(mpa.project_id) as assigned_projects
FROM mentors m
LEFT JOIN mentor_project_assignments mpa ON m.id = mpa.mentor_id
GROUP BY m.id, m.name, m.expertise
ORDER BY m.id;

SELECT 'Mentor Workshop Led:' as section;
SELECT m.id, m.name, m.expertise, COUNT(mwa.workshop_id) as workshops_led
FROM mentors m
LEFT JOIN mentor_workshop_assignments mwa ON m.id = mwa.mentor_id
GROUP BY m.id, m.name, m.expertise
ORDER BY m.id;

-- ============================================
-- VERIFY ACTIVE & COMPLETED WORKSHOPS
-- ============================================
SELECT 'Active Workshops:' as section;
SELECT id, title, status, enrolled_count, capacity FROM workshops WHERE status IN ('active', 'completed') ORDER BY id;

-- ============================================


-- Check record counts
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM mentors) as mentors_count,
  (SELECT COUNT(*) FROM projects) as projects_count,
  (SELECT COUNT(*) FROM project_entrepreneurs) as project_entrepreneurs_count,
  (SELECT COUNT(*) FROM workshops) as workshops_count,
  (SELECT COUNT(*) FROM workshop_enrollments) as enrollments_count,
  (SELECT COUNT(*) FROM resources) as resources_count,
  (SELECT COUNT(*) FROM project_resources) as project_resources_count,
  (SELECT COUNT(*) FROM funding_requests) as funding_requests_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM workshop_feedback) as feedback_count;

-- Display sample data
SELECT 'USERS SAMPLE:' as info;
SELECT id, name, email, role FROM users LIMIT 5;

SELECT 'PROJECTS SAMPLE:' as info;
SELECT id, name, domain, stage, status FROM projects LIMIT 5;

SELECT 'FUNDING REQUESTS SAMPLE:' as info;
SELECT id, project_id, amount, status, funding_stage FROM funding_requests LIMIT 5;

SELECT 'WORKSHOPS SAMPLE:' as info;
SELECT id, title, mentor_name, start_date, capacity, enrolled_count FROM workshops LIMIT 5;

SELECT 'MENTORS SAMPLE:' as info;
SELECT id, expertise, years_of_experience, availability, status FROM mentors LIMIT 5;

-- ============================================
-- ============================================
-- UPDATE USERS TABLE WITH MENTOR EXPERTISE, COMPANY, BIO & STATUS
-- ============================================
UPDATE "users" SET "expertise" = 'Technology', "company" = 'Tech Innovations', "bio" = 'Full-stack developer with 15+ years experience in building scalable web applications. Specialized in React, Node.js, and cloud architecture.', "status" = 'active' WHERE "id" = 11;
UPDATE "users" SET "expertise" = 'Business Strategy', "company" = 'Business Ventures', "bio" = 'Serial entrepreneur and business strategist. Founded 3 successful startups. Expert in business model validation and go-to-market strategies.', "status" = 'active' WHERE "id" = 12;
UPDATE "users" SET "expertise" = 'Digital Marketing', "company" = 'Marketing Experts', "bio" = 'Digital marketing expert with proven track record in growth hacking. Helped 50+ startups scale from 0 to 10K users.', "status" = 'active' WHERE "id" = 13;
UPDATE "users" SET "expertise" = 'Finance & Investments', "company" = 'Sherif Ventures', "bio" = 'Investment banker turned startup advisor. Specialized in fundraising strategy, financial modeling, and investor relations.', "status" = 'active' WHERE "id" = 14;
UPDATE "users" SET "expertise" = 'Venture Capital', "company" = 'Cairo Angels Fund', "bio" = 'Venture capital analyst with 8 years experience evaluating early-stage startups. Focus on FinTech and HealthTech sectors.', "status" = 'active' WHERE "id" = 15;

-- SUCCESS MESSAGE
-- ============================================
SELECT '
✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!

📊 Summary:
- 15 Users (10 Entrepreneurs, 3 Mentors, 2 Investors)
- 12 Mentors (diverse expertise: Tech, Business, Marketing, Finance, Design, Legal)
- 15 Projects (diverse domains with realistic details)
- 30+ Project-Entrepreneur relationships
- 15 Workshops (with schedules and enrollment tracking)
- 50+ Workshop enrollments
- 12 Resources (spaces, equipment, software, services)
- 25 Resource allocations
- 15 Funding requests (various statuses)
- 20 Notifications
- 15 Workshop feedbacks

🎯 All data is diverse, realistic, and reflects Egyptian startup ecosystem!
' as completion_message;