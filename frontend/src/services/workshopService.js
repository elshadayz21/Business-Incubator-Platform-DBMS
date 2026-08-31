export const workshopService = {
    // Fetch all workshops
    async getWorkshops() {
        const res = await fetch('/api/admin/workshops');
        return await res.json();
    },

    // Get single workshop details
    async getWorkshop(id) {
        const res = await fetch(`/api/admin/workshops/${id}`);
        return await res.json();
    },

    // Create new workshop
    async createWorkshop(workshopData) {
        const res = await fetch('/api/admin/workshops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workshopData)
        });
        return await res.json();
    },

    // Update workshop
    async updateWorkshop(id, workshopData) {
        const res = await fetch(`/api/admin/workshops/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workshopData)
        });
        return await res.json();
    },

    // Delete workshop
    async deleteWorkshop(id) {
        const res = await fetch(`/api/admin/workshops/${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    // Track attendance
    async trackAttendance(enrollmentId, attended) {
        const res = await fetch(`/api/admin/workshops/attendance/${enrollmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attended })
        });
        return await res.json();
    },

    // Submit feedback
    async submitFeedback(enrollmentId, feedbackData) {
        const res = await fetch(`/api/admin/workshops/feedback/${enrollmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackData)
        });
        return await res.json();
    },

    // Get enrollments for a workshop
    async getWorkshopEnrollments(workshopId) {
        const res = await fetch(`/api/admin/workshops/${workshopId}/enrollments`);
        return await res.json();
    },

    // Get report data
    async getAttendanceReport() {
        const res = await fetch('/api/admin/reports/attendance');
        return await res.json();
    },

    async getFeedbackReport() {
        const res = await fetch('/api/admin/reports/feedback');
        return await res.json();
    }
};
