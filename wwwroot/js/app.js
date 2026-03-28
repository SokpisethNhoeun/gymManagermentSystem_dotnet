// ── GymPro app.js — Production ───────────────────────────────────────────────
// All field names match exact camelCase DTO names returned by the .NET API.
// DTOs (after camelCase serialization):
//   ClientDto:     { clientId, userId, fullName, email, phone, dob, emergencyContact, isActive }
//   CheckInDto:    { trackingId, clientId, clientName, checkinDate, amount }
//   MembershipDto: { membershipId, clientId, clientName, type, price, startAt, expireAt, isActive }
//   TrainerDto:    { trainerId, userId, fullName, email, isActive, skills:[] }
//   StaffDto:      { staffId, userId, fullName, email, phone, placeOfBirth, dob, salary, isActive }
//   CourseDto:     { courseId, courseName, trainerName, skillName, price, description, isActive, enrollmentCount }
//   DashboardStats:{ totalMembers, totalTrainers, totalStaff, activeMemberships,
//                    todayCheckIns, monthlyRevenue, totalActiveUsers, revenueChart:[{month,revenue}] }
// ─────────────────────────────────────────────────────────────────────────────

// ── Theme ──────────────────────────────────────────────────────────────────────
const Theme = {
    get() { return localStorage.getItem('gympro-theme') || 'dark'; },
    apply(m) {
        document.documentElement.classList.toggle('light', m === 'light');
        localStorage.setItem('gympro-theme', m);
        if (typeof Chart !== 'undefined') {
            const dark = m === 'dark';
            Object.values(Chart.instances).forEach(c => {
                const p = _cp(dark);
                Object.values(c.options.scales || {}).forEach(s => {
                    if (s.grid) s.grid.color = p.grid;
                    if (s.ticks) s.ticks.color = p.tick;
                });
                if (c.options.plugins?.tooltip) {
                    c.options.plugins.tooltip.backgroundColor = p.bg;
                    c.options.plugins.tooltip.titleColor = p.title;
                    c.options.plugins.tooltip.bodyColor = p.body;
                }
                c.update('none');
            });
        }
    },
    toggle() { this.apply(this.get() === 'dark' ? 'light' : 'dark'); },
    init() { this.apply(this.get()); },
};
function _cp(dark = true) {
    return {
        grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
        tick: dark ? '#545e74' : '#9099b0',
        bg: dark ? '#1c2230' : '#ffffff',
        title: dark ? '#dde3f0' : '#1a1f2e',
        body: dark ? '#8892aa' : '#5a6478',
    };
}

// ── Toast ──────────────────────────────────────────────────────────────────────
function toast(msg, type = 'info', ms = 3200) {
    const wrap = document.getElementById('toast-wrap'); if (!wrap) return;
    const icons = { ok: '✓', err: '✕', info: 'i', warn: '!' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-icon">${icons[type] || 'i'}</div><span>${msg}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; setTimeout(() => el.remove(), 260); }, ms);
}

// ── Overlay helpers ────────────────────────────────────────────────────────────
function openOverlay(oId, pId) { document.getElementById(oId)?.classList.add('open'); document.getElementById(pId)?.classList.add('open'); }
function closeOverlay(oId, pId) { document.getElementById(oId)?.classList.remove('open'); document.getElementById(pId)?.classList.remove('open'); }
function closeAll() { document.querySelectorAll('.overlay.open,.slideover.open,.modal-wrap.open').forEach(e => e.classList.remove('open')); }

// ── Helpers ────────────────────────────────────────────────────────────────────
const AV_COLS = ['var(--glow),var(--accent)', 'var(--blue-bg),var(--blue)', 'var(--purple-bg),var(--purple)', 'var(--green-bg),var(--green)', 'var(--amber-bg),var(--amber)', 'var(--red-bg),var(--red)'];
function avColor(i) { const c = AV_COLS[i % AV_COLS.length].split(','); return `background:${c[0]};color:${c[1]}`; }
function initials(n) { return (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function fmtDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return d; } }
function fmtTime(d) { if (!d) return '—'; try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); } catch { return d; } }
function planBadge(n) { n = (n || '').toLowerCase(); if (n.includes('annual')) return 'b-orange'; if (n.includes('month')) return 'b-blue'; if (n.includes('quart')) return 'b-purple'; return 'b-muted'; }
function statusBadge(a) { return a ? 'b-green badge-dot' : 'b-red badge-dot'; }
function val(id) { return (document.getElementById(id) || {}).value || ''; }
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function setHTML(id, v) { const e = document.getElementById(id); if (e) e.innerHTML = v; }
function isActive(v) { return v === true || v === 1 || String(v).toLowerCase() === 'active'; }
function fmtMoney(v) { return '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function apiError(err, cols) {
    const is403 = err && (err.includes('403') || err.toLowerCase().includes('forbidden') || err.toLowerCase().includes('not authorized'));
    const is401 = err && (err.includes('401') || err.toLowerCase().includes('unauthorized'));
    if (is403 || is401) {
        return `<tr><td colspan="${cols}" style="text-align:center;padding:32px">
      <div style="font-size:22px;margin-bottom:8px">🔒</div>
      <div style="font-weight:600;color:var(--txt);margin-bottom:4px">Access Restricted</div>
      <div style="font-size:12px;color:var(--txt3)">Your role (<strong>${window._userRole || 'Unknown'}</strong>) does not have permission to view this section.</div>
    </td></tr>`;
    }
    return `<tr><td colspan="${cols}" style="text-align:center;padding:32px">
    <div style="color:var(--red);margin-bottom:8px">⚠ ${err}</div>
    <div style="font-size:12px;color:var(--txt3)">Check your .NET API is running on port 5000</div>
  </td></tr>`;
}
function skeleton(rows = 5, cols = 4) {
    return `<table><thead><tr>${'<th><div class="skeleton" style="height:10px;width:80px"></div></th>'.repeat(cols)}</tr></thead><tbody>
    ${Array(rows).fill(`<tr>${Array(cols).fill('<td><div class="skeleton" style="height:12px;width:100%"></div></td>').join('')}</tr>`).join('')}
  </tbody></table>`;
}

// ── Charts factory ────────────────────────────────────────────
const _charts = {};
function mkChart(id, type, data, opts = {}) {
    const el = document.getElementById(id); if (!el) return;
    if (_charts[id]) _charts[id].destroy();
    const p = _cp(!document.documentElement.classList.contains('light'));
    const base = {
        responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: p.bg, titleColor: p.title, bodyColor: p.body, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, cornerRadius: 8, padding: 10 } },
        scales: {
            x: { grid: { display: false }, ticks: { color: p.tick, font: { size: 11, family: 'DM Sans' } }, border: { display: false } },
            y: { grid: { color: p.grid }, ticks: { color: p.tick, font: { size: 11, family: 'DM Sans' } }, border: { display: false } },
        },
    };
    _charts[id] = new Chart(el.getContext('2d'), { type, data, options: deepMerge(base, opts) });
    return _charts[id];
}
function deepMerge(a, b) { const o = { ...a }; for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) o[k] = deepMerge(a[k] || {}, b[k]); else o[k] = b[k]; } return o; }

// ── Member slide-over ──────────────────────────────────────────────────────────
let _activeMemberId = null;

function openMember(data) {
    _activeMemberId = data.id;
    const ini = (data.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setText('so-avatar', ini);
    setText('so-name', data.name || '—');
    setText('so-sub', `Member #${data.id || '—'} · ${data.plan || '—'} · ${data.status || '—'}`);
    // Populate profile fields if we have a full member object
    if (data.email) { const el = document.getElementById('so-email'); if (el) el.value = data.email; }
    if (data.phone) { const el = document.getElementById('so-phone'); if (el) el.value = data.phone; }
    if (data.emergencyContact) { const el = document.getElementById('so-emergency'); if (el) el.value = data.emergencyContact; }
    if (data.dob) { const el = document.getElementById('so-dob'); if (el) el.value = data.dob?.substring(0, 10) || ''; }
    soTab('profile');
    openOverlay('so-overlay', 'slideover');
    if (data.id) {
        // CheckInDto: { trackingId, clientId, clientName, checkinDate, amount }
        Api.getMemberCheckIns(data.id).then(r => renderSoCheckIns(r || [])).catch(() => { });
        // MembershipDto: { membershipId, clientId, clientName, type, price, startAt, expireAt, isActive }
        Api.getMemberMemberships(data.id).then(r => renderSoMemberships(r || [])).catch(() => { });
    }
}
function closeMember() { closeOverlay('so-overlay', 'slideover'); }

function soTab(tab) {
    document.querySelectorAll('.so-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.so-panel').forEach(p => p.style.display = p.id === `so-panel-${tab}` ? 'block' : 'none');
}

function renderSoCheckIns(data) {
    const el = document.getElementById('so-checkins-list'); if (!el) return;
    if (!data?.length) { el.innerHTML = '<div class="text-muted" style="font-size:12px;padding:12px 0">No check-ins found.</div>'; return; }
    el.innerHTML = data.slice(0, 8).map(c => `
    <div class="audit-item">
      <div class="audit-dot" style="background:var(--green-bg);color:var(--green)">✓</div>
      <div class="audit-content">
        <div class="audit-action">Checked in</div>
        <div class="audit-time">${fmtDate(c.checkinDate)} ${fmtTime(c.checkinDate)}</div>
      </div>
    </div>`).join('');
}

function renderSoMemberships(data) {
    const el = document.getElementById('so-memb-list'); if (!el) return;
    if (!data?.length) { el.innerHTML = '<div class="text-muted" style="font-size:12px;padding:12px 0">No memberships found.</div>'; return; }
    // MembershipDto fields: type, startAt, expireAt, isActive
    el.innerHTML = data.map(m => `
    <div class="pay-row">
      <div class="pay-icon" style="background:var(--glow);color:var(--accent)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
      </div>
      <div class="pay-info">
        <div class="pay-name">${m.type || 'Membership'}</div>
        <div class="pay-meta">${fmtDate(m.startAt)} → ${fmtDate(m.expireAt)}</div>
      </div>
      <span class="badge ${m.isActive ? 'b-green badge-dot' : 'b-red badge-dot'}">${m.isActive ? 'Active' : 'Expired'}</span>
    </div>`).join('');
}

// ── Modals ────────────────────────────────────────────────────────────────────
function openMemberModal() { openOverlay('modal-overlay', 'member-modal'); }
function closeMemberModal() { closeOverlay('modal-overlay', 'member-modal'); }

// CreateClientRequest: { fullName, username, gender, email, password, phone, dob, emergencyContact }
async function submitMember() {
    const body = {
        fullName: val('new-fullname'),
        username: val('new-username'),
        email: val('new-email'),
        password: val('new-password'),
        phone: val('new-phone') || null,
        gender: val('new-gender') || null,
        dob: val('new-dob') ? new Date(val('new-dob')).toISOString() : null,
        emergencyContact: val('new-emergency') || null,
    };
    if (!body.fullName || !body.username || !body.email || !body.password) {
        toast('Full name, username, email and password are required', 'warn'); return;
    }
    btnLoading('new-submit-btn', true, 'Create Member');
    try {
        await Api.createMember(body);
        toast('Member created ✓', 'ok');
        closeMemberModal();
        ['new-fullname', 'new-username', 'new-email', 'new-password', 'new-phone', 'new-emergency', 'new-dob'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        if (_currentPage === 'members') loadMembers();
        if (_currentPage === 'dashboard') loadDashboard();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('new-submit-btn', false, 'Create Member'); }
}

// CheckInRequest: { clientId, amount }
async function submitCheckIn() {
    const id = val('ci-member-id');
    const amount = parseFloat(val('ci-amount')) || 0;
    if (!id) { toast('Select a member', 'warn'); return; }
    btnLoading('ci-submit-btn', true, 'Check In');
    try {
        await Api.createCheckIn({ clientId: parseInt(id), amount });
        const sel = document.getElementById('ci-member-id');
        const memberName = sel?.options[sel.selectedIndex]?.text || `Member #${id}`;
        toast(`${memberName} checked in ✓`, 'ok');
        closeOverlay('modal-overlay', 'ci-modal');
        const am = document.getElementById('ci-amount'); if (am) am.value = '';
        if (_currentPage === 'checkins') loadCheckins();
        if (_currentPage === 'dashboard') loadDashboard();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('ci-submit-btn', false, 'Check In'); }
}

// CreateTrainerRequest: { fullName, username, gender, email, password, skillIds }
async function submitTrainer() {
    const body = {
        fullName: val('tr-fname'),
        username: val('tr-username'),
        email: val('tr-email'),
        password: val('tr-password'),
        gender: val('tr-gender') || null,
        skillIds: [],
    };
    if (!body.fullName || !body.username || !body.email || !body.password) {
        toast('Full name, username, email and password required', 'warn'); return;
    }
    btnLoading('tr-submit-btn', true, 'Add Trainer');
    try {
        await Api.createTrainer(body);
        toast('Trainer added ✓', 'ok');
        closeOverlay('modal-overlay', 'trainer-modal');
        ['tr-fname', 'tr-username', 'tr-email', 'tr-password'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        loadTrainers();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('tr-submit-btn', false, 'Add Trainer'); }
}

// CreateStaffRequest: { fullName, username, gender, email, password, phone, placeOfBirth, dob, salary }
async function submitStaff() {
    const body = {
        fullName: val('st-fname'),
        username: val('st-username'),
        email: val('st-email'),
        password: val('st-password'),
        phone: val('st-phone') || null,
        gender: val('st-gender') || null,
        placeOfBirth: val('st-place') || null,
        dob: null,
        salary: parseFloat(val('st-salary')) || 0,
    };
    if (!body.fullName || !body.username || !body.email || !body.password) {
        toast('Full name, username, email and password required', 'warn'); return;
    }
    btnLoading('st-submit-btn', true, 'Add Staff');
    try {
        await Api.createStaff(body);
        toast('Staff added ✓', 'ok');
        closeOverlay('modal-overlay', 'staff-modal');
        ['st-fname', 'st-username', 'st-email', 'st-password', 'st-phone', 'st-place', 'st-salary'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        loadStaff();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('st-submit-btn', false, 'Add Staff'); }
}

// ── Loading state helper ───────────────────────────────────────────────────────
// Prevents double-submit and gives visual feedback on any submit button
function btnLoading(id, loading, originalText) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Saving…' : originalText;
}

// ── Populate select helpers ────────────────────────────────────────────────────
// Call before opening a modal that needs live data in a <select>
// ── Returns null on success, error string on failure ─────────────────────────
async function populateTrainerSelect(selectId) {
    const sel = document.getElementById(selectId); if (!sel) return null;
    sel.innerHTML = '<option value="">Loading trainers…</option>';
    try {
        const raw = await Api.getTrainers();

        // Log for debugging — open DevTools console to see what came back
        console.log('[populateTrainerSelect] raw response:', raw);

        if (!raw || !Array.isArray(raw) || raw.length === 0) {
            sel.innerHTML = '<option value="">No trainers found in database</option>';
            return 'No trainers returned from GET /api/trainers';
        }

        // Show ALL trainers the API returns — no isActive filter
        // (the API's global query filter already handles inactive user accounts)
        // Mark inactive trainers with a label so the user knows but can still pick them
        sel.innerHTML = '<option value="">— select trainer —</option>' +
            raw.map(t => {
                const id = t.trainerId ?? t.TrainerId ?? t.id;
                const name = t.fullName ?? t.FullName ?? t.name ?? `Trainer #${id}`;
                const active = t.isActive ?? t.IsActive ?? true;
                const label = active ? name : `${name} (inactive)`;
                return `<option value="${id}">${label}</option>`;
            }).join('');
        return null;
    } catch (e) {
        console.error('[populateTrainerSelect] error:', e);
        sel.innerHTML = '<option value="">Failed to load trainers</option>';
        return e.message;
    }
}

async function populateSkillSelect(selectId) {
    const sel = document.getElementById(selectId); if (!sel) return null;
    sel.innerHTML = '<option value="">Loading skills…</option>';
    try {
        const raw = await Api.getSkills();

        console.log('[populateSkillSelect] raw response:', raw);

        if (!raw || !Array.isArray(raw) || raw.length === 0) {
            sel.innerHTML = '<option value="">No skills found — add skills first</option>';
            return 'No skills returned from GET /api/skills';
        }

        sel.innerHTML = '<option value="">— select skill —</option>' +
            raw.map(s => {
                const id = s.skillId ?? s.SkillId ?? s.id;
                const name = s.skillName ?? s.SkillName ?? s.name ?? `Skill #${id}`;
                return `<option value="${id}">${name}</option>`;
            }).join('');
        return null;
    } catch (e) {
        console.error('[populateSkillSelect] error:', e);
        sel.innerHTML = '<option value="">Failed to load skills</option>';
        return e.message;
    }
}

async function populateMemberSelect(selectId) {
    const sel = document.getElementById(selectId); if (!sel) return null;
    sel.innerHTML = '<option value="">Loading members…</option>';
    try {
        const raw = await Api.getMembers() || [];
        const members = raw.map(m => ({
            id: m.clientId ?? m.ClientId,
            name: m.fullName ?? m.FullName ?? `Member #${m.clientId ?? m.ClientId}`,
            active: (m.isActive ?? m.IsActive) !== false,
        })).filter(m => m.active);
        if (!members.length) {
            sel.innerHTML = '<option value="">No active members found</option>';
            return null;
        }
        sel.innerHTML = '<option value="">— select member —</option>' +
            members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        return null;
    } catch (e) {
        sel.innerHTML = '<option value="">Failed to load members</option>';
        return e.message;
    }
}

// ── Save member profile from slideover ───────────────────────────────────────
// Reads the contact fields in the slideover and calls PUT /api/users/{userId}
// UpdateUserRequest: { fullName, gender, email, isActive }
async function saveMemberProfile() {
    if (!_activeMemberId) { toast('No member selected', 'warn'); return; }

    let member = null;
    try {
        member = await Api.getMember(_activeMemberId);
    } catch (e) { toast('Could not load member details', 'err'); return; }

    const userId = member?.userId;
    if (!userId) { toast('Member userId not found', 'err'); return; }

    // Read fields from slideover form
    const email = document.getElementById('so-email')?.value?.trim();
    const name = document.getElementById('so-name')?.textContent?.trim();

    if (!email) { toast('Email is required', 'warn'); return; }
    if (!name || name === '—') { toast('Name is missing', 'warn'); return; }

    const body = {
        fullName: name,
        gender: member?.gender ?? null,
        email: email,
        isActive: member?.isActive ?? true,
    };

    btnLoading('so-save-btn', true, 'Save');
    try {
        await Api.put(`/users/${userId}`, body);
        toast('Profile saved ✓', 'ok');
        if (_currentPage === 'members') loadMembers();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('so-save-btn', false, 'Save'); }
}
async function openRenewalModal() {
    if (!_activeMemberId) { toast('No member selected', 'warn'); return; }

    const today = new Date().toISOString().split('T')[0];
    const oneMonth = new Date(); oneMonth.setMonth(oneMonth.getMonth() + 1);
    const s = document.getElementById('mb-start'); if (s) s.value = today;
    const ex = document.getElementById('mb-expire'); if (ex) ex.value = oneMonth.toISOString().split('T')[0];

    // Wire live preview
    const ti = document.getElementById('mb-type-custom');
    const pi = document.getElementById('mb-price');
    if (ti) ti.oninput = updateMbPreview;
    if (pi) pi.oninput = updateMbPreview;

    closeMember();
    openOverlay('modal-overlay', 'memb-modal');

    await populateMemberSelect('mb-client');
    const sel = document.getElementById('mb-client');
    if (sel) {
        sel.value = _activeMemberId;
        if (!sel.value) {
            const opt = document.createElement('option');
            opt.value = _activeMemberId;
            opt.textContent = `Member #${_activeMemberId}`;
            sel.appendChild(opt);
            sel.value = _activeMemberId;
        }
        sel.disabled = true;
    }
}

// Re-enable the client select when the memb-modal closes so it works normally next time
function closeMembModal() {
    closeOverlay('modal-overlay', 'memb-modal');
    const sel = document.getElementById('mb-client');
    if (sel) sel.disabled = false;
}
async function openCourseModal() {
    // Reset dropdowns to loading before opening
    const trSel = document.getElementById('co-trainer');
    const skSel = document.getElementById('co-skill');
    if (trSel) trSel.innerHTML = '<option value="">Loading…</option>';
    if (skSel) skSel.innerHTML = '<option value="">Loading…</option>';

    openOverlay('modal-overlay', 'course-modal');

    const [trErr, skErr] = await Promise.all([
        populateTrainerSelect('co-trainer'),
        populateSkillSelect('co-skill'),
    ]);

    // Show error banner if any fetch failed
    const errEl = document.getElementById('co-error');
    const errors = [trErr, skErr].filter(Boolean);
    if (errEl) {
        if (errors.length) {
            errEl.textContent = '⚠ ' + errors.join(' · ');
            errEl.style.display = 'block';
        } else {
            errEl.style.display = 'none';
        }
    }
}

// CreateCourseRequest: { courseName, trainerId, skillId, price, description }
async function submitCourse() {
    const body = {
        courseName: val('co-name'),
        trainerId: parseInt(val('co-trainer')) || 0,
        skillId: parseInt(val('co-skill')) || 0,
        price: parseFloat(val('co-price')) || 0,
        description: val('co-desc') || null,
    };
    if (!body.courseName) { toast('Course name is required', 'warn'); return; }
    if (!body.trainerId) { toast('Select a trainer', 'warn'); return; }
    if (!body.skillId) { toast('Select a skill', 'warn'); return; }
    if (body.price <= 0) { toast('Enter a valid price', 'warn'); return; }

    btnLoading('co-submit-btn', true, 'Create Course');
    try {
        await Api.createCourse(body);
        toast('Course created ✓', 'ok');
        closeOverlay('modal-overlay', 'course-modal');
        // Clear form for next use
        ['co-name', 'co-price', 'co-desc'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        const ts = document.getElementById('co-trainer'); if (ts) ts.selectedIndex = 0;
        const ss = document.getElementById('co-skill'); if (ss) ss.selectedIndex = 0;
        if (_currentPage === 'courses') loadCourses();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('co-submit-btn', false, 'Create Course'); }
}

// ── Membership Modal ───────────────────────────────────────────────────────────
async function openMembModal() {
    // Pre-fill today + 1 month
    const today = new Date().toISOString().split('T')[0];
    const oneMonth = new Date(); oneMonth.setMonth(oneMonth.getMonth() + 1);
    const s = document.getElementById('mb-start'); if (s) s.value = today;
    const ex = document.getElementById('mb-expire'); if (ex) ex.value = oneMonth.toISOString().split('T')[0];

    // Wire live preview to text input and client select
    const ti = document.getElementById('mb-type-custom');
    const pi = document.getElementById('mb-price');
    const ci = document.getElementById('mb-client');
    if (ti) ti.oninput = updateMbPreview;
    if (pi) pi.oninput = updateMbPreview;
    if (ci) ci.onchange = updateMbPreview;

    openOverlay('modal-overlay', 'memb-modal');
    await populateMemberSelect('mb-client');
    updateMbPreview();
}

// CreateMembershipRequest: { clientId, type, price, startAt, expireAt }
async function submitMembership() {
    const body = {
        clientId: parseInt(val('mb-client')) || 0,
        type: val('mb-type-custom').trim(),
        price: parseFloat(val('mb-price')) || 0,
        startAt: val('mb-start') ? new Date(val('mb-start')).toISOString() : null,
        expireAt: val('mb-expire') ? new Date(val('mb-expire')).toISOString() : null,
    };
    if (!body.clientId) { toast('Select a member', 'warn'); return; }
    if (!body.type) { toast('Enter a plan type', 'warn'); return; }
    if (body.price < 0) { toast('Price cannot be negative', 'warn'); return; }
    if (!body.startAt) { toast('Enter a start date', 'warn'); return; }
    if (!body.expireAt) { toast('Enter an expire date', 'warn'); return; }
    if (new Date(body.expireAt) <= new Date(body.startAt)) {
        toast('Expire date must be after start date', 'warn'); return;
    }
    btnLoading('mb-submit-btn', true, 'Create Membership');
    try {
        await Api.createMembership(body);
        toast('Membership created ✓', 'ok');
        closeMembModal();
        ['mb-price', 'mb-start', 'mb-expire', 'mb-type-custom'].forEach(id => {
            const e = document.getElementById(id); if (e) e.value = '';
        });
        const cs = document.getElementById('mb-client'); if (cs) cs.selectedIndex = 0;
        const ds = document.getElementById('mb-duration'); if (ds) ds.selectedIndex = 0;
        document.querySelectorAll('.mb-chip').forEach(c => c.classList.remove('active'));
        updateMbPreview();
        if (_currentPage === 'memberships') loadMemberships();
        if (_currentPage === 'dashboard') loadDashboard();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('mb-submit-btn', false, 'Create Membership'); }
}

// ── Payment Modal (= Membership creation) ─────────────────────────────────────
// ── Membership modal helpers ───────────────────────────────────────────────────
const PLAN_PRICES = { Monthly: 29.99, Quarterly: 79.99, Annual: 249.00 };
const PLAN_MONTHS = { Monthly: 1, Quarterly: 3, Annual: 12, Student: 1, VIP: 1 };

// Quick-pick chip: fill type, price, and auto-set expire
function setMbType(type, price, months) {
    const ti = document.getElementById('mb-type-custom'); if (ti) ti.value = type;
    const pi = document.getElementById('mb-price'); if (pi) pi.value = price.toFixed(2);
    // Set duration dropdown to match
    const di = document.getElementById('mb-duration');
    if (di) di.value = months > 0 ? String(months) : '';
    // Highlight active chip
    document.querySelectorAll('.mb-chip').forEach(c =>
        c.classList.toggle('active', c.textContent.trim().startsWith(type)));
    // Auto-calc expire from start
    applyMbDuration(months > 0 ? String(months) : '');
    updateMbPreview();
}

// Duration dropdown → auto-set expire date
function applyMbDuration(val) {
    const start = document.getElementById('mb-start')?.value;
    if (!start || !val) return;
    const d = new Date(start);
    const months = parseFloat(val);
    if (months === 0.5) { d.setDate(d.getDate() + 14); }
    else { d.setMonth(d.getMonth() + months); }
    const expEl = document.getElementById('mb-expire');
    if (expEl) expEl.value = d.toISOString().split('T')[0];
    updateMbPreview();
}

// When start date changes, re-apply the selected duration
function recalcMbExpire() {
    const dur = document.getElementById('mb-duration')?.value;
    if (dur) applyMbDuration(dur);
    updateMbPreview();
}

// Live preview card
function updateMbPreview() {
    const clientSel = document.getElementById('mb-client');
    const name = clientSel?.options[clientSel.selectedIndex]?.text || '—';
    const type = document.getElementById('mb-type-custom')?.value?.trim() || '—';
    const price = parseFloat(document.getElementById('mb-price')?.value) || 0;
    const start = document.getElementById('mb-start')?.value;
    const expir = document.getElementById('mb-expire')?.value;
    const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    document.getElementById('prev-name').textContent = name === '— select member —' ? '—' : name;
    document.getElementById('prev-type').textContent = type;
    document.getElementById('prev-price').textContent = price > 0 ? '$' + price.toFixed(2) : 'Free';
    document.getElementById('prev-dates').textContent = fmt(start) + ' → ' + fmt(expir);
}

function autoFillMbPrice(type) {
    const el = document.getElementById('mb-price');
    if (el && PLAN_PRICES[type]) el.value = PLAN_PRICES[type].toFixed(2);
}

async function openPaymentModal() {
    const today = new Date().toISOString().split('T')[0];
    const oneMonth = new Date(); oneMonth.setMonth(oneMonth.getMonth() + 1);
    const expire = oneMonth.toISOString().split('T')[0];
    const s = document.getElementById('pay-start'); if (s) s.value = today;
    const ex = document.getElementById('pay-expire'); if (ex) ex.value = expire;
    // Auto-fill price when plan changes
    const typeEl = document.getElementById('pay-type');
    if (typeEl) {
        autoFillPayPrice(typeEl.value);
        typeEl.onchange = () => {
            autoFillPayPrice(typeEl.value);
            // Auto-set expire based on plan
            const start = document.getElementById('pay-start')?.value;
            if (start) {
                const d = new Date(start);
                if (typeEl.value === 'Monthly') d.setMonth(d.getMonth() + 1);
                if (typeEl.value === 'Quarterly') d.setMonth(d.getMonth() + 3);
                if (typeEl.value === 'Annual') d.setFullYear(d.getFullYear() + 1);
                const expEl = document.getElementById('pay-expire');
                if (expEl) expEl.value = d.toISOString().split('T')[0];
            }
        };
    }
    openOverlay('modal-overlay', 'payment-modal');
    await populateMemberSelect('pay-client');
}

function autoFillPayPrice(type) {
    const el = document.getElementById('pay-price');
    if (el && PLAN_PRICES[type]) el.value = PLAN_PRICES[type].toFixed(2);
}

async function submitPayment() {
    const body = {
        clientId: parseInt(val('pay-client')) || 0,
        type: val('pay-type'),
        price: parseFloat(val('pay-price')) || 0,
        startAt: val('pay-start') ? new Date(val('pay-start')).toISOString() : null,
        expireAt: val('pay-expire') ? new Date(val('pay-expire')).toISOString() : null,
    };
    if (!body.clientId) { toast('Select a member', 'warn'); return; }
    if (!body.type) { toast('Select a plan type', 'warn'); return; }
    if (body.price <= 0) { toast('Enter a valid amount', 'warn'); return; }
    if (!body.startAt) { toast('Enter a start date', 'warn'); return; }
    if (!body.expireAt) { toast('Enter an expire date', 'warn'); return; }
    if (new Date(body.expireAt) <= new Date(body.startAt)) {
        toast('Expire date must be after start date', 'warn'); return;
    }

    btnLoading('pay-submit-btn', true, 'Record Payment');
    try {
        await Api.createMembership(body);
        toast('Payment recorded ✓', 'ok');
        closeOverlay('modal-overlay', 'payment-modal');
        ['pay-price', 'pay-start', 'pay-expire'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        const cs = document.getElementById('pay-client'); if (cs) cs.selectedIndex = 0;
        if (_currentPage === 'payments') loadPayments();
        if (_currentPage === 'memberships') loadMemberships();
        if (_currentPage === 'dashboard') loadDashboard();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('pay-submit-btn', false, 'Record Payment'); }
}

// -- Approve / Reject pending enrollment
async function approveEnrollment(id, approve, btnEl) {
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = '...'; }
    try {
        await Api.patch(`/enrollments/${id}/approve`, { approve });
        toast(approve ? 'Enrollment approved \u2713' : 'Enrollment rejected', approve ? 'ok' : 'info');
        loadDashboard();
    } catch (e) { toast(e.message, 'err'); }
    finally { if (btnEl) { btnEl.disabled = false; } }
}

// -- Load recent enrollments + pending approvals for dashboard
async function loadDashboardEnrollments() {
    // Recent enrollments
    try {
        const all = await Api.getEnrollments() || [];
        const tbody = document.getElementById('dash-enrollments-tbody');
        if (tbody) {
            if (!all.length) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:20px">No enrollments yet</td></tr>';
            } else {
                tbody.innerHTML = all.slice(0, 6).map(e => `<tr>
          <td><div class="fw5">${e.clientName || '\u2014'}</div></td>
          <td class="text-muted">${e.courseName || '\u2014'}</td>
          <td class="text-muted" style="font-size:11px">${fmtDate(e.startAt)}</td>
          <td><span class="badge ${e.isApproved ? 'b-green badge-dot' : 'b-amber'}">${e.isApproved ? 'Approved' : 'Pending'}</span></td>
        </tr>`).join('');
            }
        }
    } catch (e) { console.warn('Dashboard enrollments:', e.message); }

    // Pending approvals
    try {
        const pending = await Api.get('/enrollments/pending') || [];
        const badge = document.getElementById('pending-count-badge');
        if (badge) { badge.textContent = pending.length; badge.style.display = pending.length ? '' : 'none'; }
        const list = document.getElementById('pending-approvals-list');
        if (list) {
            if (!pending.length) {
                list.innerHTML = '<div class="text-muted" style="font-size:12px;padding:16px;text-align:center">No pending approvals</div>';
            } else {
                list.innerHTML = pending.map(e => `
          <div class="pay-row" style="align-items:center">
            <div class="pay-info" style="flex:1">
              <div class="pay-name">${e.clientName || '\u2014'}</div>
              <div class="pay-meta">${e.courseName || '\u2014'} \u00b7 ${fmtDate(e.startAt)}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" onclick="approveEnrollment(${e.enrollmentId}, true, this)">Approve</button>
              <button class="btn btn-danger btn-sm" onclick="approveEnrollment(${e.enrollmentId}, false, this)">Reject</button>
            </div>
          </div>`).join('');
            }
        }
    } catch (e) { console.warn('Pending approvals:', e.message); }
}

// -- CI modal member search filter
function filterCiMembers(q) {
    q = q.toLowerCase();
    const sel = document.getElementById('ci-member-id');
    if (!sel) return;
    Array.from(sel.options).forEach(opt => {
        opt.style.display = !q || opt.text.toLowerCase().includes(q) || opt.value === '' ? '' : 'none';
    });
    // Auto-select first visible non-placeholder option
    const first = Array.from(sel.options).find(o => o.value !== '' && o.style.display !== 'none');
    if (first && q) sel.value = first.value;
}

// -- Membership Plans (shown in Memberships page and on home.html)
async function loadPlansManagement() {
    const el = document.getElementById('plans-list'); if (!el) return;
    el.innerHTML = '<div class="text-muted" style="font-size:12px;padding:12px">Loading...</div>';
    try {
        const plans = await Api.getMembershipPlans() || [];
        if (!plans.length) {
            el.innerHTML = '<div class="text-muted" style="font-size:12px;padding:12px">No plans yet. Click + Add Plan to create one that will show on the public website.</div>';
            return;
        }
        el.innerHTML = plans.map(p => `
      <div style="background:var(--s2);border:1px solid var(--brd);border-radius:var(--r);padding:14px;min-width:160px;flex:1;position:relative">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--txt3);margin-bottom:4px">${p.type}</div>
        <div style="font-size:22px;font-weight:800;color:var(--accent)">$${Number(p.price).toFixed(2)}</div>
        <div style="font-size:11px;color:var(--txt3);margin-bottom:6px">${p.durationMonths} month${p.durationMonths > 1 ? 's' : ''}</div>
        <div style="font-size:11px;color:var(--txt2);margin-bottom:10px">${p.description || ''}</div>
        <span class="badge ${p.isActive ? 'b-green badge-dot' : 'b-muted'}">${p.isActive ? 'Active' : 'Hidden'}</span>
        <div style="margin-top:10px;display:flex;gap:6px">
          <button class="btn btn-danger btn-sm" onclick="deletePlan(${p.planId},'${(p.type || '').replace(/'/g, "\\'")}')" style="flex:1">Remove</button>
        </div>
      </div>`).join('');
    } catch (e) { el.innerHTML = `<div style="color:var(--red);font-size:12px;padding:12px">${e.message}</div>`; }
}

function openPlanModal() { openOverlay('modal-overlay', 'plan-modal'); }

async function submitPlan() {
    const body = {
        type: val('plan-type').trim(),
        description: val('plan-desc').trim() || null,
        price: parseFloat(val('plan-price')) || 0,
        durationMonths: parseInt(val('plan-duration')) || 1,
    };
    if (!body.type) { toast('Plan name is required', 'warn'); return; }
    if (body.price < 0) { toast('Price cannot be negative', 'warn'); return; }
    btnLoading('plan-submit-btn', true, 'Add Plan');
    try {
        await Api.createMembershipPlan(body);
        toast(`${body.type} plan added ✓`, 'ok');
        closeOverlay('modal-overlay', 'plan-modal');
        ['plan-type', 'plan-desc', 'plan-price'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        const d = document.getElementById('plan-duration'); if (d) d.value = '1';
        loadPlansManagement();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('plan-submit-btn', false, 'Add Plan'); }
}

async function deletePlan(id, name) {
    if (!confirm(`Remove "${name}" from the public website?`)) return;
    try { await Api.deleteMembershipPlan(id); toast(`${name} removed`, 'ok'); loadPlansManagement(); }
    catch (e) { toast(e.message, 'err'); }
}

// -- Check-in Modal
async function openCheckInModal() {
    openOverlay('modal-overlay', 'ci-modal');
    const search = document.getElementById('ci-search'); if (search) search.value = '';
    await populateMemberSelect('ci-member-id');
    const am = document.getElementById('ci-amount'); if (am) am.value = '';
}

// -- CSV Export
async function exportCSV() {
    try {
        let rows = [], headers = [], filename = 'export.csv';
        if (_currentPage === 'members') {
            toast('Fetching members...', 'info');
            const data = await Api.getMembers() || [];
            headers = ['ClientId', 'FullName', 'Email', 'Phone', 'DOB', 'Status'];
            rows = data.map(m => [m.clientId, m.fullName, m.email, m.phone || '', m.dob ? m.dob.split('T')[0] : '', m.isActive ? 'Active' : 'Inactive']);
            filename = 'members.csv';
        } else if (_currentPage === 'checkins') {
            toast('Fetching check-ins...', 'info');
            const data = await Api.getTodayCheckIns() || [];
            headers = ['TrackingId', 'ClientId', 'MemberName', 'CheckinDate', 'Amount'];
            rows = data.map(c => [c.trackingId, c.clientId, c.clientName, new Date(c.checkinDate).toLocaleString(), c.amount]);
            filename = 'checkins-today.csv';
        } else if (_currentPage === 'memberships') {
            toast('Fetching memberships...', 'info');
            const data = await Api.getMemberships() || [];
            headers = ['MembershipId', 'ClientId', 'MemberName', 'Type', 'Price', 'StartAt', 'ExpireAt', 'Status'];
            rows = data.map(m => [m.membershipId, m.clientId, m.clientName, m.type, m.price,
            m.startAt ? m.startAt.split('T')[0] : '', m.expireAt ? m.expireAt.split('T')[0] : '', m.isActive ? 'Active' : 'Expired']);
            filename = 'memberships.csv';
        } else { toast('No export available for this page', 'info'); return; }
        const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = filename; a.click();
        URL.revokeObjectURL(a.href);
        toast(`Exported ${rows.length} rows`, 'ok');
    } catch (e) { toast('Export failed: ' + e.message, 'err'); }
}

let _currentPage = '';
const PAGE_LABELS = { dashboard: 'Dashboard', analytics: 'Analytics', members: 'Members', trainers: 'Trainers', staff: 'Staff', checkins: 'Check-ins', courses: 'Courses', memberships: 'Memberships', payments: 'Payments', settings: 'Settings', auditlog: 'Audit Log' };

// Role-aware top button labels — Trainer/Client can't create anything
const TOP_BTN_ADMIN = { dashboard: 'Add Member', members: 'Add Member', trainers: 'Add Trainer', staff: 'Add Staff', checkins: 'Manual Check-in', courses: 'New Course', memberships: 'New Plan', payments: 'Record Payment' };
const TOP_BTN_STAFF = { dashboard: 'Add Member', members: 'Add Member', checkins: 'Manual Check-in', courses: 'New Course', memberships: 'New Plan' };
const TOP_BTN_ROLE = { Admin: TOP_BTN_ADMIN, Staff: TOP_BTN_STAFF, Trainer: {}, Client: {} };

function navigate(page, skipHash = false) {
    // Block navigation to pages the role can't access
    const role = window._userRole || 'Client';
    const hidden = { Admin: [], Staff: ['staff', 'settings', 'auditlog'], Trainer: ['members', 'staff', 'checkins', 'memberships', 'payments', 'settings', 'auditlog'], Client: ['members', 'trainers', 'staff', 'checkins', 'memberships', 'payments', 'settings', 'auditlog'] };
    if ((hidden[role] || hidden.Client).includes(page)) { navigate('dashboard', skipHash); return; }

    if (_currentPage === page) return;
    _currentPage = page;
    if (!skipHash) history.replaceState(null, '', '#' + page);
    document.querySelectorAll('.nav-item[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    setText('bread-cur', PAGE_LABELS[page] || page);

    // Show/hide topbar action button based on role
    const btn = document.getElementById('topbar-btn');
    const topMap = TOP_BTN_ROLE[role] || {};
    const label = topMap[page];
    if (btn) { btn.style.display = label ? '' : 'none'; if (label) setText('topbar-btn-label', label); }

    try { loadPage(page); } catch (e) { console.error('loadPage error', page, e); }
}

function loadPage(page) {
    ({ dashboard: loadDashboard, members: loadMembers, trainers: loadTrainers, staff: loadStaff, checkins: loadCheckins, courses: loadCourses, memberships: loadMemberships, payments: loadPayments, analytics: loadAnalytics })[page]?.();
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD — role-aware
// ═══════════════════════════════════════════════════════════════
async function loadDashboard() {
    const role = window._userRole || 'Client';

    // Client / Trainer — they cannot call /api/dashboard/stats (Admin,Staff only)
    // Show what they CAN see: courses list + trainers
    if (role === 'Client' || role === 'Trainer') {
        // Show a friendly message in stat cards
        const msg = `<div style="font-size:11px;color:var(--text3);margin-top:4px">Not available</div>`;
        ['stat-members', 'stat-checkins', 'stat-memb'].forEach(id => setText(id, '—'));
        setText('stat-trainers', '—');
        setHTML('live-checkins',
            `<div style="text-align:center;padding:24px">
        <div style="font-size:13px;font-weight:600;color:var(--txt);margin-bottom:6px">Welcome, ${window._currentUser || 'there'}!</div>
        <div style="font-size:12px;color:var(--txt3)">You are signed in as <strong>${role}</strong>.<br>Browse Courses and Trainers from the sidebar.</div>
      </div>`);
        setHTML('dash-members-tbody',
            `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--txt3)">
        Member list is only available to Admin and Staff.
      </td></tr>`);
        // Load available courses into the chart section
        try {
            const courses = await Api.getCourses() || [];
            if (courses.length) setText('nav-member-count', courses.length);
        } catch (e) { }
        return;
    }

    // ── Admin / Staff — full dashboard ────────────────────────────────────────
    let stats = null;
    try {
        stats = await Api.getStats();
        if (stats) {
            setText('stat-members', stats.totalMembers ?? '—');
            setText('stat-checkins', stats.todayCheckIns ?? '—');
            setText('stat-trainers', stats.totalTrainers ?? '—');
            setText('stat-memb', stats.activeMemberships ?? '—');
            if (stats.totalMembers != null) setText('nav-member-count', stats.totalMembers);
        }
    } catch (e) { console.warn('Stats:', e.message); }

    // ── Check-ins: CheckInDto ─────────────────────────────────────────────────
    // { trackingId, clientId, clientName, checkinDate, amount }
    try {
        const ci = await Api.getTodayCheckIns() || [];
        setText('nav-ci-count', ci.length || '0');
        if (ci.length) {
            setHTML('live-checkins', ci.slice(0, 5).map((c, i) => {
                const name = c.clientName || `Member #${c.clientId || '?'}`;
                return `<div class="pay-row">
          <div class="av av-sq" style="${avColor(i)};width:32px;height:32px;border-radius:var(--r-sm)">${initials(name)}</div>
          <div class="pay-info"><div class="pay-name">${name}</div><div class="pay-meta">${fmtTime(c.checkinDate)}</div></div>
          <span class="badge b-green">In</span>
        </div>`;
            }).join(''));
        } else {
            setHTML('live-checkins', '<div class="text-muted" style="padding:20px;text-align:center;font-size:12px">No check-ins today yet</div>');
        }
    } catch (e) { console.warn('Checkins:', e.message); }

    // ── Recent Members: ClientDto ─────────────────────────────────────────────
    // { clientId, userId, fullName, email, phone, dob, emergencyContact, isActive }
    // NOTE: ClientDto has NO membershipType or createdAt — plan shows '—', date shows '—'
    try {
        const members = await Api.getMembers() || [];
        if (members.length) {
            setHTML('dash-members-tbody', members.slice(0, 5).map((m, i) => {
                const name = m.fullName || '—';
                const activ = m.isActive;
                const id = m.clientId;
                return `<tr onclick="openMember({id:${id},name:'${name.replace(/'/g, "\\'")}',plan:'Member',status:'${activ ? 'Active' : 'Inactive'}',email:'${m.email || ''}',phone:'${m.phone || ''}',dob:'${m.dob || ''}',emergencyContact:'${m.emergencyContact || ''}'})" style="cursor:pointer">
          <td><div class="cell-flex"><div class="av" style="${avColor(i)}">${initials(name)}</div>${name}</div></td>
          <td class="text-muted" style="font-size:11px">${m.email || '—'}</td>
          <td><span class="badge ${activ ? 'b-green badge-dot' : 'b-red badge-dot'}">${activ ? 'Active' : 'Inactive'}</span></td>
          <td class="text-muted">${m.phone || '—'}</td>
        </tr>`;
            }).join(''));
        } else {
            setHTML('dash-members-tbody', '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:20px">No members yet</td></tr>');
        }
        if (members.length) setText('nav-member-count', members.length);
    } catch (e) { console.warn('Members:', e.message); }

    // ── Charts from real API data ─────────────────────────────────────────────
    try {
        const [membsRaw] = await Promise.all([Api.getMemberships().catch(() => [])]);
        const membs = membsRaw || [];

        setTimeout(() => {
            // Revenue bar chart — DashboardStats.revenueChart: [{month:"2025-03", revenue:249}]
            const rc = stats?.revenueChart || [];
            const rLabels = rc.map(p => {
                try { const d = new Date(p.month + '-01'); return d.toLocaleString('en-US', { month: 'short' }); } catch { return p.month; }
            });
            const rData = rc.map(p => Number(p.revenue || 0));
            const rBg = rData.map((_, i) => i === rData.length - 1 ? '#e8621a' : 'rgba(232,98,26,0.32)');
            mkChart('chart-revenue', 'bar', {
                labels: rLabels.length ? rLabels : ['No data'],
                datasets: [{ data: rData.length ? rData : [0], backgroundColor: rBg.length ? rBg : ['rgba(232,98,26,0.32)'], borderRadius: 6, borderSkipped: false }],
            }, { scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } } });

            // Membership split donut — count by type field from MembershipDto
            const typeCounts = {};
            membs.forEach(m => { const t = (m.type || 'Other').trim(); typeCounts[t] = (typeCounts[t] || 0) + 1; });
            const dLabels = Object.keys(typeCounts);
            const dData = dLabels.map(k => typeCounts[k]);
            const dColors = ['rgba(64,136,244,.85)', 'rgba(157,107,245,.85)', 'rgba(232,98,26,.85)', 'rgba(29,185,122,.85)', 'rgba(255,200,60,.85)'];
            mkChart('chart-donut', 'doughnut', {
                labels: dLabels.length ? dLabels : ['No data'],
                datasets: [{ data: dData.length ? dData : [1], backgroundColor: dColors.slice(0, Math.max(dLabels.length, 1)), borderWidth: 0, borderRadius: 4, spacing: 3 }],
            }, { scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: true, position: 'bottom', labels: { color: _cp(!document.documentElement.classList.contains('light')).tick, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8, padding: 16 } } } });
        }, 80);
    } catch (e) { console.warn('Dashboard charts:', e.message); }

    // Load enrollment cards (Admin/Staff only)
    if (role !== 'Client' && role !== 'Trainer') { loadDashboardEnrollments(); }
}


// ═══════════════════════════════════════════════════════════════
// ACCOUNTS — Settings > Accounts panel
// ═══════════════════════════════════════════════════════════════
async function loadAccountsPanel() {
    // Populate My Account fields from token + localStorage
    const name = localStorage.getItem('gympro-user') || '';
    const el = document.getElementById('acc-fullname'); if (el) el.value = name;
    try {
        const token = Api.getToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const emailEl = document.getElementById('acc-email');
            if (emailEl && payload.email) emailEl.value = payload.email;
        }
    } catch (e) { }

    // Load all Admin/Staff/Trainer users into table
    const tbody = document.getElementById('accounts-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px"><div class="skeleton" style="height:12px;width:80%"></div></td></tr>';
    try {
        // GET /api/users?roleId=1,2,3 — filter to non-client roles
        const all = await Api.getUsers() || [];
        const admins = all.items ? all.items : (Array.isArray(all) ? all : []);
        const staff = admins.filter(u => u.roleName !== 'Client');
        if (!staff.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:24px">No admin/staff accounts found.</td></tr>';
            return;
        }
        tbody.innerHTML = staff.map((u, i) => {
            const name = u.fullName || '—';
            const role = u.roleName || '—';
            const roleColor = role === 'Admin' ? 'b-orange' : role === 'Staff' ? 'b-blue' : 'b-purple';
            return `<tr>
        <td><div class="cell-flex"><div class="av" style="${avColor(i)}">${initials(name)}</div>${name}</div></td>
        <td class="mono text-muted">${u.username || '—'}</td>
        <td><span class="badge ${roleColor}">${role}</span></td>
        <td class="text-muted" style="font-size:12px">${u.email || '—'}</td>
        <td><span class="badge ${u.isActive ? 'b-green badge-dot' : 'b-red badge-dot'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
        <td style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-sm" onclick="openResetPwModal(${u.userId},'${name.replace(/'/g, "\\'")}')">Reset PW</button>
          <button class="btn btn-${u.isActive ? 'danger' : 'ghost'} btn-sm" onclick="toggleAccount(${u.userId},${u.isActive},'${name.replace(/'/g, "\\'")}')">
            ${u.isActive ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>`;
        }).join('');
    } catch (e) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--red)">${e.message}</td></tr>`; }
}

async function saveMyProfile() {
    const fullName = document.getElementById('acc-fullname')?.value?.trim();
    const email = document.getElementById('acc-email')?.value?.trim();
    if (!fullName) { toast('Full name is required', 'warn'); return; }
    if (!email) { toast('Email is required', 'warn'); return; }

    // Get current user id from token
    const token = Api.getToken();
    if (!token) { toast('Not logged in', 'err'); return; }
    let userId;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.user_id || payload.sub;
    } catch (e) { toast('Could not read token', 'err'); return; }

    try {
        await Api.put(`/users/${userId}`, { fullName, gender: null, email, isActive: true });
        localStorage.setItem('gympro-user', fullName);
        const nameEl = document.getElementById('sidebar-name'); if (nameEl) nameEl.textContent = fullName;
        const avEl = document.getElementById('sidebar-av');
        if (avEl) avEl.textContent = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        toast('Profile updated \u2713', 'ok');
    } catch (e) { toast(e.message, 'err'); }
}

async function changeMyPassword() {
    const np = document.getElementById('acc-new-pw')?.value;
    const cp = document.getElementById('acc-confirm-pw')?.value;
    if (!np || np.length < 6) { toast('Password must be at least 6 characters', 'warn'); return; }
    if (np !== cp) { toast('Passwords do not match', 'warn'); return; }

    const token = Api.getToken();
    let userId;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.user_id || payload.sub;
    } catch (e) { toast('Could not read token', 'err'); return; }

    try {
        await Api.patch(`/users/${userId}/reset-password`, { newPassword: np });
        document.getElementById('acc-new-pw').value = '';
        document.getElementById('acc-confirm-pw').value = '';
        toast('Password changed \u2713', 'ok');
    } catch (e) { toast(e.message, 'err'); }
}

async function submitNewAccount() {
    const body = {
        fullName: val('nacc-fullname'),
        username: val('nacc-username'),
        email: val('nacc-email'),
        password: val('nacc-password'),
        gender: val('nacc-gender') || null,
        roleId: parseInt(val('nacc-role')) || 2,
    };
    if (!body.fullName || !body.username || !body.email || !body.password) {
        toast('Full name, username, email and password are required', 'warn'); return;
    }
    if (body.password.length < 6) { toast('Password must be at least 6 characters', 'warn'); return; }

    btnLoading('nacc-submit-btn', true, 'Create Account');
    try {
        await Api.createUser(body);
        toast(`Account created for ${body.fullName} \u2713`, 'ok');
        closeOverlay('modal-overlay', 'new-account-modal');
        ['nacc-fullname', 'nacc-username', 'nacc-email', 'nacc-password'].forEach(id => {
            const e = document.getElementById(id); if (e) e.value = '';
        });
        loadAccountsPanel();
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('nacc-submit-btn', false, 'Create Account'); }
}

function openResetPwModal(userId, name) {
    document.getElementById('reset-pw-uid').value = userId;
    document.getElementById('reset-pw-sub').textContent = `Set a new password for ${name}`;
    document.getElementById('reset-pw-value').value = '';
    openOverlay('modal-overlay', 'reset-pw-modal');
}

async function submitResetPassword() {
    const userId = document.getElementById('reset-pw-uid')?.value;
    const pw = document.getElementById('reset-pw-value')?.value;
    if (!pw || pw.length < 6) { toast('Password must be at least 6 characters', 'warn'); return; }
    btnLoading('reset-pw-btn', true, 'Reset Password');
    try {
        await Api.patch(`/users/${userId}/reset-password`, { newPassword: pw });
        toast('Password reset \u2713', 'ok');
        closeOverlay('modal-overlay', 'reset-pw-modal');
    } catch (e) { toast(e.message, 'err'); }
    finally { btnLoading('reset-pw-btn', false, 'Reset Password'); }
}

async function toggleAccount(userId, currentlyActive, name) {
    const action = currentlyActive ? 'disable' : 're-enable';
    if (!confirm(`Are you sure you want to ${action} the account for "${name}"?`)) return;
    try {
        if (currentlyActive) {
            await Api.del(`/users/${userId}`);
        } else {
            await Api.put(`/users/${userId}`, { fullName: name, gender: null, email: '', isActive: true });
        }
        toast(`Account ${currentlyActive ? 'disabled' : 'enabled'} \u2713`, 'ok');
        loadAccountsPanel();
    } catch (e) { toast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
// MEMBERS
// ClientDto: { clientId, userId, fullName, email, phone, dob, emergencyContact, isActive }
// ═══════════════════════════════════════════════════════════════
async function loadMembers() {
    setHTML('members-tbody', skeleton(5, 6));
    try {
        const members = await Api.getMembers() || [];
        if (!members.length) {
            setHTML('members-tbody', '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:32px">No members found.</td></tr>');
            return;
        }
        setText('nav-member-count', members.length);
        setHTML('members-tbody', members.map((m, i) => {
            const name = m.fullName || '—';
            const id = m.clientId;
            const activ = m.isActive;
            const email = m.email || '';
            const phone = m.phone || '—';
            return `<tr onclick="openMember({id:${id},name:'${name.replace(/'/g, "\\'")}',plan:'Member',status:'${activ ? 'Active' : 'Inactive'}',email:'${email}',phone:'${phone}',dob:'${m.dob || ''}',emergencyContact:'${m.emergencyContact || ''}'})"
              data-name="${name.toLowerCase()}" data-status="${activ ? 'Active' : 'Inactive'}">
        <td><div class="cell-flex"><div class="av" style="${avColor(i)}">${initials(name)}</div>
          <div><div>${name}</div><div class="text-muted" style="font-size:11px">${email}</div></div></div></td>
        <td class="mono text-muted">#${id}</td>
        <td class="text-muted">${phone}</td>
        <td><span class="badge ${activ ? 'b-green badge-dot' : 'b-red badge-dot'}">${activ ? 'Active' : 'Inactive'}</span></td>
        <td class="text-muted">${m.dob ? fmtDate(m.dob) : '—'}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();openMember({id:${id},name:'${name.replace(/'/g, "\\'")}',plan:'Member',status:'${activ ? 'Active' : 'Inactive'}',email:'${email}',phone:'${phone}'})">View</button></td>
      </tr>`;
        }).join(''));
    } catch (e) { setHTML('members-tbody', apiError(e.message, 6)); }
}
function filterMembers(q) { q = q.toLowerCase(); document.querySelectorAll('#members-tbody tr[data-name]').forEach(tr => { tr.style.display = tr.dataset.name.includes(q) ? '' : 'none'; }); }
function filterMemberStatus(s) { document.querySelectorAll('#members-tbody tr[data-status]').forEach(tr => { tr.style.display = (!s || s === 'All' || tr.dataset.status === s) ? '' : 'none'; }); }

// ═══════════════════════════════════════════════════════════════
// TRAINERS
// TrainerDto: { trainerId, userId, fullName, email, isActive, skills:["HIIT","Yoga"] }
// ═══════════════════════════════════════════════════════════════
async function loadTrainers() {
    setHTML('trainers-grid', '<div class="text-muted" style="padding:32px;text-align:center;grid-column:1/-1">Loading…</div>');
    try {
        const trainers = await Api.getTrainers() || [];
        if (!trainers.length) { setHTML('trainers-grid', '<div class="text-muted" style="padding:32px;text-align:center;grid-column:1/-1">No trainers found.</div>'); return; }
        setHTML('trainers-grid', trainers.map((t, i) => {
            const name = t.fullName || '—';
            const id = t.trainerId;
            const activ = t.isActive;
            // skills is List<string> from TrainerDto
            const skills = (t.skills || []).filter(Boolean).join(' · ') || '—';
            return `<div class="card" style="text-align:center">
        <div class="av av-xl" style="${avColor(i)};margin:0 auto 12px">${initials(name)}</div>
        <div class="font-h fw7" style="font-size:16px;margin-bottom:3px">${name}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${t.email || ''}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:12px">${skills}</div>
        <span class="badge ${activ ? 'b-green badge-dot' : 'b-muted'}" style="width:100%;justify-content:center">${activ ? 'Active' : 'Inactive'}</span>
        <div style="margin-top:10px"><button class="btn btn-ghost btn-sm" onclick="toggleTrainer(${id},'${name.replace(/'/g, "\\'")}')">Toggle Active</button></div>
      </div>`;
        }).join('') + `<div class="card" style="border-style:dashed;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;opacity:.4" onclick="openOverlay('modal-overlay','trainer-modal')">
      <div style="font-size:28px;color:var(--text3);margin-bottom:8px">+</div>
      <div style="font-size:13px;color:var(--text3)">Add Trainer</div>
    </div>`);
    } catch (e) { setHTML('trainers-grid', `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--red)">${e.message}</div>`); }
}
async function toggleTrainer(id, name) {
    try { await Api.toggleTrainer(id); toast(`${name} toggled`, 'ok'); loadTrainers(); }
    catch (e) { toast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
// STAFF
// StaffDto: { staffId, userId, fullName, email, phone, placeOfBirth, dob, salary, isActive }
// ═══════════════════════════════════════════════════════════════
async function loadStaff() {
    setHTML('staff-tbody', skeleton(3, 5));
    try {
        const staff = await Api.getStaff() || [];
        if (!staff.length) { setHTML('staff-tbody', '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:32px">No staff found.</td></tr>'); return; }
        setHTML('staff-tbody', staff.map((s, i) => {
            const name = s.fullName || '—';
            const id = s.staffId;
            const activ = s.isActive;
            return `<tr>
        <td><div class="cell-flex"><div class="av" style="${avColor(i)}">${initials(name)}</div>${name}</div></td>
        <td class="text-muted">${s.phone || '—'}</td>
        <td><span class="badge ${activ ? 'b-green badge-dot' : 'b-red badge-dot'}">${activ ? 'Active' : 'Inactive'}</span></td>
        <td class="text-muted">${s.email || '—'}</td>
        <td><span class="text-muted">${fmtMoney(s.salary)}/mo</span></td>
      </tr>`;
        }).join(''));
    } catch (e) { setHTML('staff-tbody', apiError(e.message, 5)); }
}

// ═══════════════════════════════════════════════════════════════
// CHECK-INS
// CheckInDto: { trackingId, clientId, clientName, checkinDate, amount }
// ═══════════════════════════════════════════════════════════════
async function loadCheckins() {
    setHTML('checkins-tbody', skeleton(6, 4));
    try {
        const ci = await Api.getTodayCheckIns() || [];
        setText('stat-ci-today', ci.length || '0');
        setText('nav-ci-count', ci.length || '0');
        if (!ci.length) {
            setHTML('checkins-tbody', '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:32px">No check-ins today yet.</td></tr>');
        } else {
            setHTML('checkins-tbody', ci.map((c, i) => {
                const name = c.clientName || `Member #${c.clientId || '?'}`;
                return `<tr>
          <td><div class="cell-flex"><div class="av" style="${avColor(i)}">${initials(name)}</div>${name}</div></td>
          <td class="text-muted">${fmtTime(c.checkinDate)}</td>
          <td><span class="badge b-blue">Manual</span></td>
          <td class="text-muted">${fmtMoney(c.amount)}</td>
        </tr>`;
            }).join(''));
        }
        setTimeout(() => {
            mkChart('chart-ci-methods', 'doughnut', {
                labels: ['Today', 'Yesterday', 'Other'],
                datasets: [{ data: [ci.length, Math.max(0, ci.length - 1), 0], backgroundColor: ['rgba(64,136,244,.85)', 'rgba(157,107,245,.85)', 'rgba(255,255,255,.15)'], borderWidth: 0, borderRadius: 4, spacing: 3 }],
            }, { scales: { x: { display: false }, y: { display: false } }, plugins: { legend: { display: true, position: 'bottom', labels: { color: _cp(!document.documentElement.classList.contains('light')).tick, font: { size: 11 }, usePointStyle: true, padding: 14 } } } });
        }, 80);
    } catch (e) { setHTML('checkins-tbody', apiError(e.message, 4)); }
}

// ═══════════════════════════════════════════════════════════════
// COURSES
// CourseDto: { courseId, courseName, trainerName, skillName, price, description, isActive, enrollmentCount }
// ═══════════════════════════════════════════════════════════════
async function loadCourses() {
    setHTML('courses-list', '<div class="text-muted" style="padding:24px">Loading…</div>');
    try {
        const courses = await Api.getCourses() || [];
        if (!courses.length) { setHTML('courses-list', '<div class="text-muted" style="padding:24px">No courses found.</div>'); return; }
        const colors = [['var(--glow)', 'var(--accent)'], ['var(--purple-bg)', 'var(--purple)'], ['var(--green-bg)', 'var(--green)'], ['var(--blue-bg)', 'var(--blue)']];
        setHTML('courses-list', courses.map((c, i) => {
            const [bg, fg] = colors[i % colors.length];
            const filled = c.enrollmentCount || 0;
            const cap = 20; // default capacity
            const pct = Math.min(100, Math.round(filled / cap * 100));
            return `<div style="background:var(--s2);border-radius:var(--r);padding:14px;display:flex;align-items:center;gap:12px;margin-bottom:8px;opacity:${c.isActive ? 1 : .6}">
        <div class="av av-sq" style="background:${bg};color:${fg};width:38px;height:38px;border-radius:var(--r-sm)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500">${c.courseName}</div>
          <div class="text-muted" style="font-size:11px">${c.trainerName || '—'} · ${c.skillName || '—'} · ${fmtMoney(c.price)}</div>
          <div class="progress"><div class="progress-fill" style="width:${pct}%;background:${fg}"></div></div>
        </div>
        <div style="text-align:right;min-width:50px">
          <div class="font-h fw7" style="font-size:18px;color:${fg}">${filled}/${cap}</div>
          <div class="text-muted" style="font-size:10px">${pct}% full</div>
        </div>
        ${c.isActive ? `<button class="btn btn-danger btn-sm" onclick="deactivateCourse(${c.courseId},'${c.courseName.replace(/'/g, "\\'")}')">Deactivate</button>` : `<span class="badge b-muted">Inactive</span>`}
      </div>`;
        }).join(''));
        setTimeout(() => {
            mkChart('chart-courses-enroll', 'bar', {
                labels: courses.slice(0, 6).map(c => (c.courseName || 'Course').slice(0, 12)),
                datasets: [
                    { label: 'Enrolled', data: courses.slice(0, 6).map(c => c.enrollmentCount || 0), backgroundColor: 'rgba(232,98,26,.75)', borderRadius: 5 },
                    { label: 'Capacity', data: courses.slice(0, 6).map(() => 20), backgroundColor: 'rgba(255,255,255,.07)', borderRadius: 5 },
                ],
            }, { plugins: { legend: { display: true, labels: { color: _cp(!document.documentElement.classList.contains('light')).tick, font: { size: 11 }, usePointStyle: true, padding: 16 } } } });
        }, 80);
    } catch (e) { setHTML('courses-list', `<div style="padding:24px;color:var(--red)">${e.message}</div>`); }
}
async function deactivateCourse(id, name) {
    if (!confirm(`Deactivate "${name}"?`)) return;
    try { await Api.deactivateCourse(id); toast(`${name} deactivated`, 'ok'); loadCourses(); }
    catch (e) { toast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
// MEMBERSHIPS
// MembershipDto: { membershipId, clientId, clientName, type, price, startAt, expireAt, isActive }
// ═══════════════════════════════════════════════════════════════
async function loadMemberships() {
    loadPlansManagement();
    setHTML('memb-tbody', skeleton(4, 6));
    try {
        const plans = await Api.getMemberships() || [];
        if (!plans.length) { setHTML('memb-tbody', '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:32px">No memberships found.</td></tr>'); return; }
        setHTML('memb-tbody', plans.map(p => {
            const id = p.membershipId;
            const name = p.clientName || '—';
            const type = p.type || '—';
            const price = p.price ?? 0;
            const activ = p.isActive;
            return `<tr>
        <td><div class="fw5">${name}</div><div class="mono text-muted" style="font-size:10.5px">MEM-${id}</div></td>
        <td><span class="badge ${planBadge(type)}">${type}</span></td>
        <td class="fw6 text-accent">${fmtMoney(price)}</td>
        <td class="text-muted">${fmtDate(p.startAt)}</td>
        <td><span class="badge ${activ ? 'b-green badge-dot' : 'b-red badge-dot'}">${activ ? 'Active' : 'Expired'}</span></td>
        <td><button class="btn btn-danger btn-sm" onclick="deactivateMemb(${id},'${name.replace(/'/g, "\\'")}')">Deactivate</button></td>
      </tr>`;
        }).join(''));
    } catch (e) { setHTML('memb-tbody', apiError(e.message, 6)); }
}
async function deactivateMemb(id, name) {
    if (!confirm(`Deactivate membership for "${name}"?`)) return;
    try { await Api.deactivateMembership(id); toast('Deactivated', 'ok'); loadMemberships(); }
    catch (e) { toast(e.message, 'err'); }
}

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// Built from GET /api/memberships + GET /api/dashboard/stats
// ═══════════════════════════════════════════════════════════════
async function loadPayments() {
    try {
        const [memberships, stats] = await Promise.all([
            Api.getMemberships().catch(() => []),
            Api.getStats().catch(() => null),
        ]);

        // Stat cards
        if (stats) {
            setText('pay-stat-month', fmtMoney(stats.monthlyRevenue));
            const rc = stats.revenueChart || [];
            const ytd = rc.reduce((s, p) => s + Number(p.revenue || 0), 0);
            setText('pay-stat-ytd', '$' + Math.round(ytd).toLocaleString());
            setText('pay-stat-active', stats.activeMemberships ?? '—');
            setText('pay-stat-members', stats.totalMembers ?? '—');
        }

        // Transactions table — MembershipDto sorted by startAt desc
        const rows = [...(memberships || [])].sort((a, b) => new Date(b.startAt || 0) - new Date(a.startAt || 0));
        if (rows.length) {
            setHTML('pay-tbody', rows.slice(0, 20).map(m => `<tr>
        <td>${m.clientName || '—'}</td>
        <td><span class="badge ${planBadge(m.type)}">${m.type || '—'}</span></td>
        <td class="fw6">${fmtMoney(m.price)}</td>
        <td class="text-muted">${fmtDate(m.startAt)}</td>
        <td><span class="badge ${m.isActive ? 'b-green badge-dot' : 'b-muted'}">${m.isActive ? 'Active' : 'Expired'}</span></td>
      </tr>`).join(''));
        } else {
            setHTML('pay-tbody', '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:32px">No transactions found.</td></tr>');
        }

        setTimeout(() => {
            // Revenue split by membership type
            const typeTotals = {};
            (memberships || []).forEach(m => { const t = (m.type || 'Other').trim(); typeTotals[t] = (typeTotals[t] || 0) + Number(m.price || 0); });
            const tKeys = Object.keys(typeTotals);
            mkChart('chart-pay-split', 'doughnut', {
                labels: tKeys.length ? tKeys : ['No data'],
                datasets: [{ data: tKeys.length ? tKeys.map(k => typeTotals[k]) : [1], backgroundColor: ['rgba(232,98,26,.85)', 'rgba(64,136,244,.85)', 'rgba(157,107,245,.85)', 'rgba(29,185,122,.85)'], borderWidth: 0, borderRadius: 4, spacing: 3 }],
            }, { scales: { x: { display: false }, y: { display: false } } });

            // Monthly revenue trend
            const now = new Date();
            const months8 = Array.from({ length: 8 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1); return { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }; });
            const revByMonth = months8.map(m => (memberships || []).reduce((sum, mb) => { const d = new Date(mb.startAt || 0); return (d.getFullYear() === m.year && d.getMonth() === m.month) ? sum + Number(mb.price || 0) : sum; }, 0));
            mkChart('chart-rev-trend', 'line', {
                labels: months8.map(m => m.label),
                datasets: [{ data: revByMonth, fill: true, backgroundColor: 'rgba(29,185,122,.08)', borderColor: '#1db97a', borderWidth: 2, pointRadius: 3, tension: .4 }],
            }, { scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } } });
        }, 80);
    } catch (e) { setHTML('pay-tbody', apiError(e.message, 5)); }
}

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// All real data from API
// ═══════════════════════════════════════════════════════════════
async function loadAnalytics() {
    try {
        const [stats, memberships, checkins, courses] = await Promise.all([
            Api.getStats().catch(() => null),
            Api.getMemberships().catch(() => []),
            Api.getTodayCheckIns().catch(() => []),
            Api.getCourses().catch(() => []),
        ]);

        if (stats) {
            const rc = stats.revenueChart || [];
            const ytd = rc.reduce((s, p) => s + Number(p.revenue || 0), 0);
            if (ytd) setText('kpi-ytd', '$' + Math.round(ytd).toLocaleString());
            const monthly = stats.monthlyRevenue || 0;
            const members = stats.totalMembers || 1;
            setText('kpi-avg-rev', '$' + Math.round(monthly / members).toLocaleString());
            const activeM = stats.activeMemberships || 0;
            setText('kpi-churn', Math.max(0, ((members - activeM) / members * 100)).toFixed(1) + '%');
            setText('kpi-ci-per-member', (checkins.length / members).toFixed(1));
        }
        if (courses?.length) {
            const enrolled = courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0);
            const cap = courses.length * 20;
            setText('kpi-fill-rate', Math.round(enrolled / cap * 100) + '%');
        }

        setTimeout(() => {
            const now = new Date();
            const months8 = Array.from({ length: 8 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - 7 + i, 1); return { label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() }; });

            // Member growth — new memberships per month
            const newPerMonth = months8.map(m => (memberships || []).filter(mb => { const d = new Date(mb.startAt || 0); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length);
            mkChart('chart-growth', 'line', { labels: months8.map(m => m.label), datasets: [{ data: newPerMonth, fill: true, backgroundColor: 'rgba(232,98,26,.08)', borderColor: '#e8621a', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#e8621a', tension: .4 }] }, {});

            // Check-in heatmap by hour
            const hourBuckets = [6, 7, 8, 9, 10, 17, 18, 19, 20];
            const ciByHour = hourBuckets.map(h => (checkins || []).filter(c => new Date(c.checkinDate || 0).getHours() === h).length);
            mkChart('chart-heatmap', 'bar', { labels: ['6AM', '7AM', '8AM', '9AM', '10AM', '5PM', '6PM', '7PM', '8PM'], datasets: [{ data: ciByHour, backgroundColor: 'rgba(64,136,244,.72)', borderRadius: 4 }] }, {});

            // Revenue by plan type
            const typeTotals = {};
            (memberships || []).forEach(m => { const t = (m.type || 'Other').trim(); typeTotals[t] = (typeTotals[t] || 0) + Number(m.price || 0); });
            const tKeys = Object.keys(typeTotals);
            mkChart('chart-plan-rev', 'bar', {
                labels: tKeys.length ? tKeys : ['No data'],
                datasets: [{ data: tKeys.map(k => typeTotals[k]), backgroundColor: ['rgba(64,136,244,.8)', 'rgba(157,107,245,.8)', 'rgba(232,98,26,.8)', 'rgba(29,185,122,.8)'], borderRadius: 8 }],
            }, { scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } } });

            // Monthly revenue trend
            const revByMonth = months8.map(m => (memberships || []).reduce((sum, mb) => { const d = new Date(mb.startAt || 0); return (d.getFullYear() === m.year && d.getMonth() === m.month) ? sum + Number(mb.price || 0) : sum; }, 0));
            mkChart('chart-hours', 'line', { labels: months8.map(m => m.label), datasets: [{ data: revByMonth, fill: true, backgroundColor: 'rgba(29,185,122,.08)', borderColor: '#1db97a', borderWidth: 2, pointRadius: 3, tension: .5 }] }, { scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } } });
        }, 80);
    } catch (e) { console.warn('Analytics:', e.message); }
}

// ── Settings helpers ──────────────────────────────────────────────────────────
function settingsNav(panel, el) {
    document.querySelectorAll('.sn-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.s-panel').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('sp-' + panel)?.classList.add('active');
}
function regenJWT() {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let k = 'GymPro'; for (let i = 0; i < 30; i++) k += c[Math.floor(Math.random() * c.length)];
    const el = document.getElementById('jwt-secret'); if (el) el.textContent = k;
    toast('New secret generated — update appsettings.json!', 'warn');
}
function addCorsOrigin() {
    const inp = document.getElementById('cors-input'), list = document.getElementById('cors-list');
    if (!inp || !list) return;
    const v = inp.value.trim(); if (!v) { toast('Enter a URL', 'warn'); return; }
    const div = document.createElement('div'); div.className = 'api-key-box';
    div.innerHTML = `<span class="api-key-val">${v}</span><button class="copy-btn" onclick="this.closest('.api-key-box').remove();toast('Removed','info')">Remove</button>`;
    list.appendChild(div); inp.value = ''; toast('Origin added', 'ok');
}
function copyText(text) { navigator.clipboard?.writeText(text).then(() => toast('Copied!', 'ok')); }

// ── App init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    // ── Role-based UI setup ─────────────────────────────────────────────────────
    // Login stores: gympro-user = fullName, gympro-role = "Admin"/"Staff"/"Trainer"/"Client"
    const currentUser = localStorage.getItem('gympro-user') || 'User';
    const currentRole = (localStorage.getItem('gympro-role') || 'Client').trim();

    // Update sidebar user tile with real name and role
    const nameEl = document.getElementById('sidebar-name');
    const roleEl = document.getElementById('sidebar-role');
    const avEl = document.getElementById('sidebar-av');
    if (nameEl) nameEl.textContent = currentUser;
    if (roleEl) roleEl.textContent = currentRole;
    if (avEl) avEl.textContent = currentUser.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    // Define what each role can see
    // Pages hidden per role (nav items + their content pages)
    const HIDDEN_PAGES = {
        Admin: [],                                                         // sees everything
        Staff: ['staff', 'settings', 'auditlog'],                         // no staff mgmt or settings
        Trainer: ['members', 'staff', 'checkins', 'memberships', 'payments', 'settings', 'auditlog'],
        Client: ['members', 'trainers', 'staff', 'checkins', 'memberships', 'payments', 'settings', 'auditlog'],
    };
    // Buttons hidden per role
    const HIDDEN_BTNS = {
        Admin: [],
        Staff: ['btn-add-trainer', 'btn-add-staff', 'btn-deactivate-course'],
        Trainer: ['topbar-btn'],
        Client: ['topbar-btn'],
    };

    const hidden = HIDDEN_PAGES[currentRole] || HIDDEN_PAGES.Client;

    // Hide nav items the role can't access
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        if (hidden.includes(el.dataset.page)) {
            el.style.display = 'none';
        }
    });

    // Default start page — if the hash page is forbidden, redirect to dashboard
    const hashPage = location.hash.replace('#', '') || 'dashboard';
    const startPage = hidden.includes(hashPage) ? 'dashboard' : hashPage;

    // For Client role: load their own profile data instead of admin dashboard
    window._userRole = currentRole;
    window._currentUser = currentUser;
    document.getElementById('theme-btn')?.addEventListener('click', () => Theme.toggle());

    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        el.addEventListener('click', () => navigate(el.dataset.page));
    });

    document.getElementById('topbar-btn')?.addEventListener('click', () => {
        const actions = {
            members: () => openMemberModal(),
            dashboard: () => openMemberModal(),
            trainers: () => openOverlay('modal-overlay', 'trainer-modal'),
            staff: () => openOverlay('modal-overlay', 'staff-modal'),
            checkins: () => openCheckInModal(),
            courses: () => openCourseModal(),
            memberships: () => openMembModal(),
            payments: () => openPaymentModal(),
        };
        const action = actions[_currentPage];
        if (action) action();
    });

    document.getElementById('global-search')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('tbody tr[data-name]').forEach(tr => { tr.style.display = tr.dataset.name?.includes(q) ? '' : 'none'; });
    });

    document.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
        if (e.key === 'Escape') closeAll();
    });

    document.getElementById('so-overlay')?.addEventListener('click', closeMember);
    document.getElementById('modal-overlay')?.addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeAll(); });
    document.getElementById('slideover')?.addEventListener('click', e => { const tab = e.target.closest('.so-tab'); if (tab) soTab(tab.dataset.tab); });

    _currentPage = '';
    // Use startPage calculated above (role-aware, falls back to 'dashboard' if page is forbidden)
    try { navigate(startPage, true); } catch (e) { console.error('Navigate failed:', e); }

    window.addEventListener('hashchange', () => {
        try { navigate(location.hash.replace('#', '') || 'dashboard', true); } catch (e) { console.error(e); }
    });
});