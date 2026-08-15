window.electron = {
  invoke: async (channel, ...args) => {
    let url;
    let options = { headers: { "Content-Type": "application/json" } };

    switch (channel) {
      // Auth
      case "auth:login":
        url = "/api/admin/auth/login";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;

      // Workshops
      case "workshops:get-all":
      case "get-workshops":
        url = "/api/admin/workshops";
        break;
      case "workshops:get-by-id":
      case "get-workshop":
        url = `/api/admin/workshops/${args[0]}`;
        break;
      case "workshops:create":
      case "create-workshop":
        url = "/api/admin/workshops";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "workshops:update":
      case "update-workshop":
        url = `/api/admin/workshops/${args[0]}`;
        options.method = "PUT";
        options.body = JSON.stringify(args[1]);
        break;
      case "workshops:delete":
      case "delete-workshop":
        url = `/api/admin/workshops/${args[0]}`;
        options.method = "DELETE";
        break;
      case "track-attendance":
        url = `/api/admin/workshops/attendance/${args[0]}`;
        options.method = "POST";
        options.body = JSON.stringify({ attended: args[1] });
        break;
      case "submit-feedback":
        url = `/api/admin/workshops/feedback/${args[0]}`;
        options.method = "POST";
        options.body = JSON.stringify(args[1]);
        break;
      case "get-workshop-enrollments":
        url = `/api/admin/workshops/${args[0]}/enrollments`;
        break;
      case "get-attendance-report":
        url = "/api/admin/reports/attendance";
        break;
      case "get-feedback-report":
        url = "/api/admin/reports/feedback";
        break;

      // Resources
      case "resources:get-all":
        url = "/api/admin/resources";
        break;
      case "resources:add":
        url = "/api/admin/resources";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "resources:delete":
        url = `/api/admin/resources/${args[0]}`;
        options.method = "DELETE";
        break;
      case "resources:update":
        url = `/api/admin/resources/${args[0].id}`;
        options.method = "PUT";
        options.body = JSON.stringify(args[0].data);
        break;
      case "resources:get-stats":
        url = "/api/admin/resources/stats";
        break;
      case "bookings:get-pending":
        url = "/api/admin/bookings/pending";
        break;
      case "bookings:update-status":
        url = `/api/admin/bookings/${args[0].id}/status`;
        options.method = "PUT";
        options.body = JSON.stringify({ status: args[0].status });
        break;

      // Mentors
      case "mentors:get-all":
        url = "/api/admin/mentors";
        break;
      case "mentors:add":
        url = "/api/admin/mentors";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "mentors:delete":
        url = `/api/admin/mentors/${args[0]}`;
        options.method = "DELETE";
        break;
      case "mentors:update":
        url = `/api/admin/mentors/${args[0].id}`;
        options.method = "PUT";
        options.body = JSON.stringify(args[0].data);
        break;

      // Projects
      case "projects:getAll":
        url = "/api/admin/projects";
        break;
      case "projects:getById":
        url = `/api/admin/projects/${args[0]}`;
        break;
      case "projects:updateStatus":
        url = `/api/admin/projects/${args[0].id}/status`;
        options.method = "PUT";
        options.body = JSON.stringify({ status: args[0].status });
        break;
      case "projects:getByStatus":
        url = `/api/admin/projects/status/${args[0]}`;
        break;
      case "projects:toggleApproved":
        url = `/api/admin/projects/${args[0]}/toggle-approved`;
        options.method = "PUT";
        break;
      case "projects:getStats":
        url = "/api/admin/projects/stats";
        break;

      // Funding
      case "funding:getAll":
        url = `/api/admin/funding?query=${args[0] || ""}`;
        break;
      case "funding:getDashboard":
        url = "/api/admin/funding/dashboard";
        break;
      case "funding:getByStage":
        url = "/api/admin/funding/stage";
        break;
      case "funding:getById":
        url = `/api/admin/funding/${args[0]}`;
        break;
      case "funding:updateStatus":
        url = `/api/admin/funding/${args[0].id}/status`;
        options.method = "PUT";
        options.body = JSON.stringify({
          status: args[0].status,
          notes: args[0].notes,
        });
        break;
      case "funding:delete":
        url = `/api/admin/funding/${args[0]}`;
        options.method = "DELETE";
        break;

      case "users:get-all":
        url = "/api/admin/users";
        break;
      case "users:create":
        url = "/api/admin/users";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "users:update-role":
        url = `/api/admin/users/${args[0]}/role`;
        options.method = "PUT";
        options.body = JSON.stringify({ role: args[1] });
        break;
      case "users:update-status":
        url = `/api/admin/users/${args[0]}/status`;
        options.method = "PUT";
        options.body = JSON.stringify({ status: args[1] });
        break;

      // Static Pages
      case "static-pages:get-all":
        url = "/api/admin/static-pages";
        break;
      case "static-pages:get-by-id":
        url = `/api/admin/static-pages/${args[0]}`;
        break;
      case "static-pages:create":
        url = "/api/admin/static-pages";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "static-pages:update":
        url = `/api/admin/static-pages/${args[0]}`;
        options.method = "PUT";
        options.body = JSON.stringify(args[1]);
        break;
      case "static-pages:delete":
        url = `/api/admin/static-pages/${args[0]}`;
        options.method = "DELETE";
        break;
      // Cohorts
      case "cohorts:get-all":
        url = "/api/admin/cohorts";
        break;
      case "cohorts:get-by-id":
        url = `/api/admin/cohorts/${args[0]}`;
        break;
      case "cohorts:create":
        url = "/api/admin/cohorts";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "cohorts:update":
        url = `/api/admin/cohorts/${args[0]}`;
        options.method = "PUT";
        options.body = JSON.stringify(args[1]);
        break;
      case "cohorts:delete":
        url = `/api/admin/cohorts/${args[0]}`;
        options.method = "DELETE";
        break;
      case "cohort-members:get-all":
        url = `/api/admin/cohorts/${args[0]}/members`;
        break;
      case "cohort-members:add":
        url = "/api/admin/cohort-members";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "cohort-members:remove":
        url = `/api/admin/cohort-members/${args[0]}`;
        options.method = "DELETE";
        break;
      case "mentor-assignments:get-all":
        url = `/api/admin/cohorts/${args[0]}/mentor-assignments`;
        break;
      case "mentor-assignments:create":
        url = "/api/admin/mentor-assignments";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "mentor-assignments:remove":
        url = `/api/admin/mentor-assignments/${args[0]}`;
        options.method = "DELETE";
        break;
      case "mentor-sessions:get-all":
        url = `/api/admin/mentor-assignments/${args[0]}/sessions`;
        break;
      case "mentor-sessions:create":
        url = "/api/admin/mentor-sessions";
        options.method = "POST";
        options.body = JSON.stringify(args[0]);
        break;
      case "users:get-by-role":
        url = `/api/admin/users-by-role/${args[0]}`;
        break;
      case "reports:get-summary":
        url = "/api/admin/reports/summary";
        break;
      case "reports:get-rows":
        url = "/api/admin/reports/rows";
        break;

      default:
        console.warn("Unknown IPC channel:", channel);
        return null;
    }

    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`Error in IPC shim [${channel}]:`, err);
      throw err;
    }
  },
};
