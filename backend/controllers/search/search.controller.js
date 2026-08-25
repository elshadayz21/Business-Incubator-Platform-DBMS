import pool from "../../config/db.js";

export const searchEntities = async (req, res, next) => {
  try {
    const query = (req.query.q || "").trim();
    // Types can be specified as a single string or an array of strings
    let types = req.query.type || [];
    if (!Array.isArray(types)) {
      types = [types];
    }
    
    // If no types are specified, default to searching all
    const searchAll = types.length === 0 || types.includes("all");
    const searchProjects = searchAll || types.includes("projects");
    const searchMentors = searchAll || types.includes("mentors");
    const searchWorkshops = searchAll || types.includes("workshops");

    let projects = [];
    let mentors = [];
    let workshops = [];

    const searchPattern = `%${query}%`;
    const queries = [];

    if (query.length > 0) {
      if (searchProjects) {
        queries.push(
          pool.query(
            `SELECT id, name, domain, stage, status, short_description
             FROM projects 
             WHERE status != 'Pending' 
               AND (name ILIKE $1 
                 OR domain ILIKE $1 
                 OR short_description ILIKE $1 
                 OR tech_stack ILIKE $1)
             LIMIT 15`,
            [searchPattern]
          ).then(res => res.rows)
        );
      } else {
        queries.push(Promise.resolve([]));
      }

      if (searchMentors) {
        queries.push(
          pool.query(
            `SELECT id, name, company, expertise, bio, profile_image 
             FROM users 
             WHERE role = 'mentor' 
               AND status = 'active'
               AND (name ILIKE $1 
                 OR company ILIKE $1 
                 OR expertise ILIKE $1 
                 OR bio ILIKE $1)
             LIMIT 15`,
            [searchPattern]
          ).then(res => res.rows)
        );
      } else {
        queries.push(Promise.resolve([]));
      }

      if (searchWorkshops) {
        queries.push(
          pool.query(
            `SELECT id, title, description, category, schedule 
             FROM workshops 
             WHERE (title ILIKE $1 
               OR description ILIKE $1 
               OR category ILIKE $1)
             LIMIT 15`,
            [searchPattern]
          ).then(res => res.rows)
        );
      } else {
        queries.push(Promise.resolve([]));
      }

      const results = await Promise.all(queries);
      projects = results[0] || [];
      mentors = results[1] || [];
      workshops = results[2] || [];
    }

    // Format all results into a unified structure
    const unifiedResults = [
      ...projects.map(p => ({
        id: p.id,
        type: "projects",
        typeName: "Project",
        title: p.name,
        subtitle: p.domain,
        description: p.short_description || "",
        badge: p.stage,
        link: `/v1/projects/${p.id}`,
        icon: "🚀"
      })),
      ...mentors.map(m => ({
        id: m.id,
        type: "mentors",
        typeName: "Mentor",
        title: m.name,
        subtitle: m.company || "Independent Mentor",
        description: m.expertise || m.bio || "",
        badge: "Mentor",
        link: `/v1/mentors`,
        icon: "🧑‍🏫"
      })),
      ...workshops.map(w => ({
        id: w.id,
        type: "workshops",
        typeName: "Workshop",
        title: w.title,
        subtitle: w.category,
        description: w.description || "",
        badge: new Date(w.schedule).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }),
        link: `/v1/workshop`,
        icon: "🎓"
      }))
    ];

    // Simple relevance sorting:
    // Items that have the exact search query in their title/name are boosted to the top
    const lowerQuery = query.toLowerCase();
    unifiedResults.sort((a, b) => {
      const aTitleMatch = a.title.toLowerCase().includes(lowerQuery);
      const bTitleMatch = b.title.toLowerCase().includes(lowerQuery);
      
      if (aTitleMatch && !bTitleMatch) return -1;
      if (!aTitleMatch && bTitleMatch) return 1;
      
      // If both or neither match the title, sort by type
      return a.typeName.localeCompare(b.typeName);
    });

    res.render("search/search", {
      q: query,
      types: {
        projects: searchProjects,
        mentors: searchMentors,
        workshops: searchWorkshops
      },
      results: unifiedResults,
      pageRoute: "/v1/search"
    });
  } catch (err) {
    next(err);
  }
};
