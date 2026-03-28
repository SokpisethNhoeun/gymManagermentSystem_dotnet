// ── GymApi Client ─────────────────────────────────────────────────────────────
const Api = (() => {
    const BASE_URL = '/api';   // relative — works on any host/port
    const TOKEN_KEY = 'gympro-token';

    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
    const clearToken = () => localStorage.removeItem(TOKEN_KEY);
    const isAuth = () => !!getToken();

    async function req(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${BASE_URL}${path}`, opts);
        if (res.status === 401) { clearToken(); location.href = 'index.html'; return null; }
        if (res.status === 403) { throw new Error('403 Forbidden — your role does not have permission for this action.'); }
        if (!res.ok) {
            const e = await res.json().catch(() => ({ message: res.statusText }));
            // .NET ModelState 400: { title, errors: { Field: ["msg"] } }
            // .NET ApiResponse fail: { success: false, message: "..." }
            // Generic: { message: "..." }
            let msg = e.message || e.Message || e.title || `HTTP ${res.status}`;
            // Extract first validation error from .NET's errors dictionary
            if (e.errors && typeof e.errors === 'object') {
                const firstField = Object.keys(e.errors)[0];
                if (firstField) msg = `${firstField}: ${e.errors[firstField][0]}`;
            }
            throw new Error(msg);
        }
        if (res.status === 204) return null;
        const json = await res.json();
        // Unwrap ApiResponse<T>: { success, message, data }
        if (json && typeof json === 'object' && 'success' in json && 'data' in json) return json.data;
        return json;
    }

    const get = (p) => req('GET', p);
    const post = (p, b) => req('POST', p, b);
    const put = (p, b) => req('PUT', p, b);
    const patch = (p, b) => req('PATCH', p, b);
    const del = (p) => req('DELETE', p);

    // ── Auth ─────────────────────────────────────────────────────────────────
    async function login(username, password) {
        const d = await post('/auth/login', { username, password });
        if (d?.token) setToken(d.token);
        return d;
    }
    function logout() { clearToken(); location.href = 'index.html'; }

    // ── Dashboard ────────────────────────────────────────────────────────────
    // GET /api/dashboard/stats → DashboardStats
    const getStats = () => get('/dashboard/stats');

    // ── Members ──────────────────────────────────────────────────────────────
    // GET /api/members          → List<ClientDto>
    // GET /api/members/{id}     → ClientDto
    // POST /api/members         → CreateClientRequest
    // GET /api/members/{id}/memberships → List<MembershipDto>
    // GET /api/members/{id}/checkins    → List<CheckInDto>
    const getMembers = () => get('/members');
    const getMember = (id) => get(`/members/${id}`);
    const getMe = () => get('/members/me');
    const createMember = (b) => post('/members', b);
    const getMemberMemberships = (id) => get(`/members/${id}/memberships`);
    const getMemberCheckIns = (id) => get(`/members/${id}/checkins`);

    // ── Trainers ─────────────────────────────────────────────────────────────
    // GET  /api/trainers          → List<TrainerDto>
    // POST /api/trainers          → CreateTrainerRequest
    // PUT  /api/trainers/{id}/toggle → toggle IsActive
    const getTrainers = () => get('/trainers');
    const createTrainer = (b) => post('/trainers', b);
    const toggleTrainer = (id) => put(`/trainers/${id}/toggle`);  // [HttpPut]

    // ── Courses ──────────────────────────────────────────────────────────────
    // GET    /api/courses     → List<CourseDto>
    // POST   /api/courses     → CreateCourseRequest
    // DELETE /api/courses/{id} → deactivate
    const getCourses = () => get('/courses');
    const createCourse = (b) => post('/courses', b);
    const deactivateCourse = (id) => del(`/courses/${id}`);  // no /deactivate suffix

    // ── Memberships ──────────────────────────────────────────────────────────
    // GET    /api/memberships      → List<MembershipDto>
    // POST   /api/memberships      → CreateMembershipRequest
    // DELETE /api/memberships/{id} → deactivate
    const getMemberships = () => get('/memberships');
    const createMembership = (b) => post('/memberships', b);
    const deactivateMembership = (id) => del(`/memberships/${id}`);  // no /deactivate suffix

    // ── Enrollments ──────────────────────────────────────────────────────────
    const getEnrollments = () => get('/enrollments');
    const createEnrollment = (b) => post('/enrollments', b);

    // ── Check-ins ────────────────────────────────────────────────────────────
    // GET  /api/checkins  → today's list (controller [HttpGet] at root)
    // POST /api/checkins  → CheckInRequest { clientId, amount }
    const getTodayCheckIns = () => get('/checkins');   // NOT /checkins/today
    const createCheckIn = (b) => post('/checkins', b);

    // ── Staff ────────────────────────────────────────────────────────────────
    const getStaff = () => get('/staff');
    const createStaff = (b) => post('/staff', b);
    const updateStaff = (id, b) => put(`/staff/${id}`, b);

    // ── Skills ───────────────────────────────────────────────────────────────
    const getSkills = () => get('/skills');
    const createSkill = (b) => post('/skills', b);

    // -- Membership Plans
    const getMembershipPlans = () => get('/membership-plans');
    const createMembershipPlan = (b) => post('/membership-plans', b);
    const updateMembershipPlan = (id, b) => put(`/membership-plans/${id}`, b);
    const deleteMembershipPlan = (id) => del(`/membership-plans/${id}`);

    // -- Enrollment approval
    const getPendingEnrollments = () => get('/enrollments/pending');
    const approveEnrollment = (id, b) => patch(`/enrollments/${id}/approve`, b);

    // ── Users ────────────────────────────────────────────────────────────────
    const getUsers = () => get('/users');
    const createUser = (b) => post('/users', b);
    const resetPassword = (id, b) => patch(`/users/${id}/reset-password`, b);  // [HttpPatch]

    return {
        BASE_URL, getToken, setToken, clearToken, isAuth,
        get, post, put, patch, del,
        login, logout, getStats,
        getMembers, getMember, getMe, createMember, getMemberMemberships, getMemberCheckIns,
        getTrainers, createTrainer, toggleTrainer,
        getCourses, createCourse, deactivateCourse,
        getMemberships, createMembership, deactivateMembership,
        getEnrollments, createEnrollment,
        getTodayCheckIns, createCheckIn,
        getStaff, createStaff, updateStaff,
        getSkills, createSkill,
        getMembershipPlans, createMembershipPlan, updateMembershipPlan, deleteMembershipPlan,
        getPendingEnrollments, approveEnrollment,
        getUsers, createUser, resetPassword,
    };
})();