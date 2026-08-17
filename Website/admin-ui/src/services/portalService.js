const invoke = (channel, ...args) => {
  if (window.electron && window.electron.invoke) {
    return window.electron.invoke(channel, ...args);
  }
  return Promise.reject(new Error("Portal API unavailable"));
};

export const getEntrepreneurDashboard = () =>
  invoke("portal:entrepreneur-dashboard");

export const getMentorDashboard = () => invoke("portal:mentor-dashboard");

export const getMentorSessions = (assignmentId) =>
  invoke("portal:mentor-sessions:get", assignmentId);

export const createMentorSession = (data) =>
  invoke("portal:mentor-sessions:create", data);

export const deleteMentorSession = (sessionId) =>
  invoke("portal:mentor-sessions:delete", sessionId);
