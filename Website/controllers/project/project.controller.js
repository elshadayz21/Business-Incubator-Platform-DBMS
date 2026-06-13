import {
  createProject,
  addProjectEntrepreneur,
  getUserIdByCode,
  getAllProjects,
  getProjectById,
  getProjectEntrepreneurs,
} from "../../models/project/project.model.js";
import eventBus from "../../utils/eventBus.js";

// Helper function to get initials from name
const getInitials = (name) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Helper function to transform database project to template format
const transformProject = (dbProject, entrepreneurs = []) => {
  // Build team array from entrepreneurs
  const team = entrepreneurs.map((ent) => ({
    initials: getInitials(ent.name),
    name: ent.name,
    role: ent.role_in_project || "Team Member",
    color: "bg-blue-500", // Default color
  }));

  return {
    ...dbProject,
    id: dbProject.id,
    title: dbProject.name,
    description: dbProject.short_description,
    problem: dbProject.problem,
    solution: dbProject.solution,
    techStack: dbProject.tech_stack
      ? dbProject.tech_stack.split(",").map((t) => t.trim())
      : [],
    status: dbProject.status || "Pending",
    fundingStage: dbProject.funding_stage,
    looking_for_cofounders: dbProject.looking_for_cofounders,
    team: team,
    teamCount: `${team.length} member${team.length !== 1 ? "s" : ""}`,
    links: {
      github: dbProject.github_url || "#",
      demo: dbProject.demo_url || "#",
      website: dbProject.demo_url || "#",
    },
    targetMarket: dbProject.domain,
    startDate: dbProject.created_at
      ? new Date(dbProject.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        })
      : "N/A",
  };
};

export const createProjectController = async (req, res, next) => {
  try {
    const {
      name,
      domain,
      short_description,
      problem,
      solution,
      tech_stack,
      stage,
      status,
      github_url,
      demo_url,
      team_type,
      looking_for_cofounders,
      funding_stage,
      co_founders_codes,
    } = req.body;

    if (
      !name ||
      !domain ||
      !short_description ||
      !problem ||
      !solution ||
      !tech_stack ||
      !team_type
    ) {
      req.flash("error", "All required fields must be filled");
      return res.redirect("/v1/projects/new");
    }

    if (short_description.trim().length > 150) {
      req.flash("error", "Elevator pitch must not exceed 150 characters");
      return res.redirect("/v1/projects/new");
    }

    if (short_description.trim().length < 10) {
      req.flash("error", "Elevator pitch must be at least 10 characters");
      return res.redirect("/v1/projects/new");
    }

    if (name.trim().length < 3) {
      req.flash("error", "Project name must be at least 3 characters");
      return res.redirect("/v1/projects/new");
    }

    if (problem.trim().length < 20) {
      req.flash("error", "Problem description must be at least 20 characters");
      return res.redirect("/v1/projects/new");
    }

    if (solution.trim().length < 20) {
      req.flash("error", "Solution description must be at least 20 characters");
      return res.redirect("/v1/projects/new");
    }

    const validStages = ["idea", "in-progress", "completed"];
    if (stage && !validStages.includes(stage)) {
      req.flash("error", "Invalid development stage selected");
      return res.redirect("/v1/projects/new");
    }

    const validTeamTypes = ["individual", "team", "large-team"];
    if (!validTeamTypes.includes(team_type)) {
      req.flash("error", "Invalid team structure selected");
      return res.redirect("/v1/projects/new");
    }

    const validFundingStages = ["pre-seed", "seed", "bootstrapped"];
    if (
      funding_stage &&
      funding_stage.trim() &&
      !validFundingStages.includes(funding_stage)
    ) {
      req.flash("error", "Invalid funding stage selected");
      return res.redirect("/v1/projects/new");
    }

    const urlRegex = /^https?:\/\/.+\..+/;
    if (github_url && github_url.trim() && !urlRegex.test(github_url)) {
      req.flash(
        "error",
        "Invalid GitHub URL format. Must start with http:// or https://",
      );
      return res.redirect("/v1/projects/new");
    }

    if (demo_url && demo_url.trim() && !urlRegex.test(demo_url)) {
      req.flash(
        "error",
        "Invalid demo URL format. Must start with http:// or https://",
      );
      return res.redirect("/v1/projects/new");
    }

    if (
      (team_type === "team" || team_type === "large-team") &&
      !co_founders_codes
    ) {
      req.flash(
        "error",
        "Please enter co-founders user codes for team projects",
      );
      return res.redirect("/v1/projects/new");
    }

    let coFounderUserIds = [];
    if (co_founders_codes && co_founders_codes.trim()) {
      const codes = co_founders_codes
        .split(",")
        .map((code) => code.trim().toUpperCase())
        .filter((code) => code.length > 0);

      const uniqueCodes = [...new Set(codes)];
      if (codes.length !== uniqueCodes.length) {
        req.flash(
          "error",
          "Duplicate user codes found. Please remove duplicates",
        );
        return res.redirect("/v1/projects/new");
      }

      for (const code of uniqueCodes) {
          const userId = await getUserIdByCode(code);

          if (!userId) {
              req.flash("error", `User code '${code}' not found. Please verify and try again`);
              return res.redirect("/v1/projects/new");
          }

          if (userId === req.session.userId) {
              req.flash("error", "You cannot add yourself as a co-founder");
              return res.redirect("/v1/projects/new");
          }

          coFounderUserIds.push(userId);
      }

      if (team_type === "team" && coFounderUserIds.length > 2) {
        req.flash("error", "Core Team allows maximum 2 co-founders");
        return res.redirect("/v1/projects/new");
      }

      if (team_type === "large-team" && coFounderUserIds.length < 3) {
        req.flash("error", "Scale Team requires at least 3 co-founders");
        return res.redirect("/v1/projects/new");
      }
    }

    const newProject = await createProject({
      name: name.trim(),
      domain: domain.trim(),
      short_description: short_description.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      tech_stack: tech_stack.trim(),
      stage: stage || "idea",
      status: status || "Pending",
      github_url: github_url?.trim() || null,
      demo_url: demo_url?.trim() || null,
      team_type,
      looking_for_cofounders: Boolean(looking_for_cofounders),
      funding_stage: funding_stage?.trim() || null,
    });

    await addProjectEntrepreneur(newProject.id, req.session.userId, "founder");

    if (coFounderUserIds.length > 0) {
      for (const userId of coFounderUserIds) {
        await addProjectEntrepreneur(newProject.id, userId, "co-founder");
      }
    }

    // Emit event for subscribers (logs, metrics, notifications)
    eventBus.emit("project.created", { project: newProject, userId: req.session.userId });

    req.flash(
      "success",
      `Project created successfully! ${coFounderUserIds.length > 0 ? `${coFounderUserIds.length} co-founder(s) added` : ""} 🚀`,
    );
    res.redirect(`/v1/projects`);
  } catch (err) {
    console.error("Error in createProjectController:", err);

    if (err.code === "23505") {
      req.flash("error", "A project with this name already exists");
      return res.redirect("/v1/projects/new");
    }

    if (err.code === "23502") {
      req.flash("error", "Missing required database fields");
      return res.redirect("/v1/projects/new");
    }

    if (err.code === "23503") {
      req.flash("error", "Invalid user code provided");
      return res.redirect("/v1/projects/new");
    }

    req.flash(
      "error",
      "An error occurred while creating the project. Please try again",
    );
    res.redirect("/v1/projects/new");
  }
};

export const newProjectPage = (req, res) => {
  res.render("projects/add-project", {
    pageRoute: "/v1/projects/new",
    error: req.flash("error")[0] || null,
    success: req.flash("success")[0] || null,
  });
};

export const projectsController = async (req, res, next) => {
  try {
    const dbProjects = await getAllProjects();

    // Filter to only show projects that are not Pending on the public gallery
    const activeProjects = dbProjects.filter(
      (p) => p.status && p.status.toLowerCase() !== "pending"
    );

    // Fetch entrepreneurs for each project and transform
    const projects = await Promise.all(
      activeProjects.map(async (dbProject) => {
        const entrepreneurs = await getProjectEntrepreneurs(dbProject.id);
        return transformProject(dbProject, entrepreneurs);
      }),
    );

    res.render("projects/projects", { projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).render("error/error", {
      title: "Server Error",
      error: { message: "Failed to load projects", status: 500 },
    });
  }
};

export const projectDetailController = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const dbProject = await getProjectById(projectId);

    if (!dbProject) {
      return res.status(404).render("error/error", {
        title: "Not Found",
        error: { message: "Project not found", status: 404 },
      });
    }

    const entrepreneurs = await getProjectEntrepreneurs(projectId);
    const project = transformProject(dbProject, entrepreneurs);

    res.render("projects/project-detail", {
      project,
      entrepreneurs,
    });
  } catch (err) {
    console.error("Error fetching project details:", err);
    res.status(500).render("error/error", {
      title: "Server Error",
      error: { message: "Failed to load project details", status: 500 },
    });
  }
};
