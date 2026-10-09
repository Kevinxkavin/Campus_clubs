import axios from 'axios';

// ── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({ baseURL: '/api' });

export const encodePassword = (value) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return `cc1:${btoa(binary)}`;
};

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → clear token and redirect to /login (skip if already on auth pages)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRoute = err.config?.url?.includes('/auth/');
      const onAuthPage  = window.location.pathname.startsWith('/login') ||
                          window.location.pathname.startsWith('/register') ||
                          window.location.pathname.startsWith('/verify');
      if (!isAuthRoute && !onAuthPage) {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Rate limiting (FIX 5) ──────────────────────────────────────────────────
// Prevents accidental or spam repeated calls for the same key.
// Usage: await rateLimit('like-postId', 800) → throws if called < 800ms ago
const _rateLimitMap = new Map();
export function rateLimit(key, ms = 1000) {
  const last = _rateLimitMap.get(key) ?? 0;
  if (Date.now() - last < ms) return false;   // too soon
  _rateLimitMap.set(key, Date.now());
  return true;
}

// ── Helpers ────────────────────────────────────────────────────────────────
export const normalizeUser = (u) => {
  if (!u) return null;
  return {
    _id:        String(u.id ?? u._id ?? ''),
    name:       u.name ?? '',
    email:      u.email ?? '',
    studentId:  u.studentId ?? '',
    role:       (u.role ?? 'student').toLowerCase(),
    isActive:   u.active ?? u.isActive ?? true,
    bio:        u.bio ?? '',
    avatar:     u.avatarUrl ?? u.avatar ?? '',
    department: u.department ?? '',
    year:       u.year ?? '',
    phone:      u.phone ?? '',
    skills:     u.skills ?? '',
    joinedClubs: u.joinedClubs ?? [],
    managedClub: u.managedClubMongoId
      ? { _id: u.managedClubMongoId, name: u.managedClubName ?? '' }
      : (u.managedClub ?? null),
    createdAt:  u.createdAt ?? '',
  };
};

export const normalizeClub = (c) => {
  if (!c) return null;
  const normMember = (m) => ({
    _id:       String(m.userId ?? m._id ?? ''),
    name:      m.name ?? '',
    email:     m.email ?? '',
    studentId: m.studentId ?? '',
    phone:     m.phone ?? '',
    avatar:    m.avatarUrl ?? m.avatar ?? '',
    bio:       m.bio ?? '',
    skills:    m.skills ?? '',
  });
  return {
    _id:            c.id ?? c._id ?? '',
    name:           c.name ?? '',
    category:       c.category ?? '',
    foundedYear:    c.foundedYear ?? 0,
    description:    c.description ?? '',
    logoUrl:        c.logoUrl ?? c.logo ?? '',
    bannerUrl:      c.bannerUrl ?? c.banner ?? '',
    isActive:       c.active ?? c.isActive ?? true,
    coordinator:    c.coordinator ? normMember(c.coordinator) : null,
    advisor:        c.advisor     ? normMember(c.advisor)     : null,
    members:        (c.members        ?? []).map(normMember),
    pendingMembers: (c.pendingMembers  ?? []).map((m) => ({
      _id:        String(m.userId ?? m._id ?? ''),
      name:       m.name ?? '',
      email:      m.email ?? '',
      studentId:  m.studentId ?? '',
      bio:        m.bio ?? '',
      skills:     m.skills ?? '',
      reasonToJoin: m.whyJoin ?? m.reasonToJoin ?? '',
    })),
    socialLinks:    c.socialLinks ?? {},
    createdAt:      c.createdAt ?? '',
  };
};

export const normalizeEvent = (e) => {
  if (!e) return null;
  const registrations = (e.registrations ?? []).map((r) => ({
    _id:          r.id ?? r._id ?? '',
    userId:       String(r.userId ?? ''),
    userName:     r.userName ?? r.name ?? '',
    studentId:    r.studentId ?? '',
    registeredAt: r.registeredAt ?? '',
    answers:      r.answers ?? {},
    attended:     r.attended ?? false,
  }));
  const comments = (e.comments ?? []).map((c) => ({
    _id:       c.id ?? c._id ?? '',
    user: {
      _id:  String(c.userId ?? c.user?._id ?? ''),
      name: c.userName ?? c.user?.name ?? 'Unknown',
    },
    text:      c.text ?? '',
    createdAt: c.createdAt ?? '',
  }));
  return {
    _id:                  e.id ?? e._id ?? '',
    title:                e.title ?? '',
    description:          e.description ?? '',
    category:             e.category ?? '',
    venue:                e.venue ?? '',
    eventDate:            e.eventDate ?? '',
    registrationDeadline: e.registrationDeadline ?? '',
    maxParticipants:      e.maxParticipants ?? 0,
    poster:               e.posterUrl ?? e.poster ?? '',
    registrationUrl:      e.registrationUrl ?? '',
    club:                 e.club ?? null,
    createdBy:            e.createdBy ?? null,
    status:               (e.status ?? 'pending').toLowerCase(),
    coordinatorComment:   e.coordinatorComment ?? '',
    registrationFields:   e.registrationFields ?? [],
    registrations,
    registrationCount:    e.registrationCount ?? registrations.length,
    registeredByMe:       e.registeredByMe ?? false,
    likes:                (e.likes ?? []).map(String),
    likedBy:              e.likedBy ?? [],
    comments,
    updates:              e.updates ?? [],
    createdAt:            e.createdAt ?? '',
  };
};

// ✅ FIX 1 – comment name fix: map authorId+authorName → user { _id, name }
export const normalizePost = (p) => {
  if (!p) return null;
  let poll = null;
  if (p.pollQuestion) {
    const options = (p.pollOptions ?? []).map((text, idx) => ({
      text,
      // pollVotes values may be objects {userId, userName} or plain ids – handle both
      votes: (p.pollVotes?.[String(idx)] ?? []).map(v =>
        typeof v === 'object' ? String(v.userId ?? v._id ?? '') : String(v)
      ),
      // store voter names too so PollVotersModal can show them
      voterNames: (p.pollVotes?.[String(idx)] ?? []).map(v =>
        typeof v === 'object' ? (v.userName ?? v.name ?? String(v.userId ?? v)) : String(v)
      ),
    }));
    poll = { question: p.pollQuestion, options };
  }
  return {
    _id:    p.id ?? p._id ?? '',
    type:   p.type ?? 'achievement',
    clubId: p.clubId ?? null,
    clubName: p.clubName ?? null,
    // ✅ author always populated from authorId + authorName fields
    author: {
      _id:       String(p.authorId ?? ''),
      name:      p.authorName    ?? 'Unknown',     // never blank
      role:      (p.authorRole ?? 'student').toLowerCase(),
      avatar:    p.authorAvatarUrl ?? '',
      studentId: p.authorStudentId ?? '',
    },
    content:     p.content ?? '',
    achievement: p.achievementTitle
      ? { title: p.achievementTitle, awarder: '' }
      : null,
    poll,
    pictureUrl:  (p.imageUrls ?? [])[0] ?? '',
    likes:       (p.likes ?? []).map(String),
    likedBy:     p.likedBy ?? [],
    // ✅ FIX 1 – comments: map authorId+authorName to { _id, name }
    comments: (p.comments ?? []).map((c) => ({
      _id:       c.id ?? c._id ?? '',
      user: {
        _id:  String(c.authorId  ?? c.userId ?? c.user?._id ?? ''),
        name: c.authorName ?? c.userName ?? c.user?.name ?? 'Unknown',
      },
      text:      c.text ?? '',
      createdAt: c.createdAt ?? '',
    })),
    status:    'approved',
    createdAt: p.createdAt ?? '',
  };
};

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authLogin = async (email, password) => {
  const res = await api.post('/auth/login', { email, password: encodePassword(password) });
  return res.data.data;
};

export const authRegister = async (data) => {
  const res = await api.post('/auth/register', { ...data, password: encodePassword(data.password) });
  return res.data.data;
};

// ✅ FIX 4 – email verification APIs (separate endpoints)
export const authSendVerification = async (email) => {
  const res = await api.post('/auth/send-verification', { email });
  return res.data;
};

export const authVerifyEmail = async (email, otp) => {
  const res = await api.post('/auth/verify-email', { email, otp });
  return res.data.data;
};

export const authForgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const authResetPassword = async (email, otp, newPassword) => {
  const res = await api.post('/auth/reset-password', { email, otp, newPassword: encodePassword(newPassword) });
  return res.data;
};

export const authLogout = async () => {
  try { await api.post('/auth/logout'); } catch {}
};

export const authMe = async () => {
  const res = await api.get('/auth/me');
  return res.data.data;
};

// ── PROFILE ───────────────────────────────────────────────────────────────
export const getProfile = async () => {
  const res = await api.get('/profile');
  return res.data.data;
};

export const updateProfile = async (updates) => {
  const res = await api.put('/profile', updates);
  return res.data.data;
};

// ── CLUBS ─────────────────────────────────────────────────────────────────
export const fetchClubs = async (category) => {
  const params = category ? { category } : {};
  const res = await api.get('/clubs', { params });
  return (res.data.data ?? []).map(normalizeClub);
};

export const fetchClub = async (id) => {
  const res = await api.get(`/clubs/${id}`);
  return normalizeClub(res.data.data);
};

export const fetchMyClubs = async () => {
  const res = await api.get('/clubs/my');
  return (res.data.data ?? []).map(normalizeClub);
};

export const apiJoinClub = async (clubId, body) => {
  await api.post(`/clubs/${clubId}/join`, body);
};

export const apiLeaveClub = async (clubId) => {
  await api.delete(`/clubs/${clubId}/leave`);
};

export const apiApproveMember = async (clubId, userId) => {
  await api.put(`/clubs/${clubId}/members/${userId}/approve`);
};

export const apiRejectMember = async (clubId, userId) => {
  await api.put(`/clubs/${clubId}/members/${userId}/reject`);
};

export const apiRemoveMember = async (clubId, userId) => {
  await api.delete(`/clubs/${clubId}/members/${userId}`);
};

export const apiCreateClub = async (data) => {
  const res = await api.post('/clubs', data);
  return normalizeClub(res.data.data);
};

export const apiUpdateClub = async (id, data) => {
  const res = await api.put(`/clubs/${id}`, data);
  return normalizeClub(res.data.data);
};

export const apiDeactivateClub = async (id) => {
  await api.delete(`/clubs/${id}`);
};

export const apiAssignCoordinator = async (clubId, userId) => {
  await api.put(`/clubs/${clubId}/coordinator`, { userId: Number(userId) });
};

export const apiAssignAdvisor = async (clubId, userId) => {
  await api.put(`/clubs/${clubId}/advisor`, { userId: Number(userId) });
};

export const apiAssignEventChair = async (clubId, eventId, userId) => {
  await api.put(`/clubs/${clubId}/events/${eventId}/chair`, { userId: Number(userId) });
};

// ── EVENTS ────────────────────────────────────────────────────────────────
export const fetchApprovedEvents = async (page = 0, size = 50) => {
  const res  = await api.get('/events/approved', { params: { page, size } });
  const data = res.data.data;
  const list = Array.isArray(data) ? data : (data?.content ?? []);
  return list.map(normalizeEvent);
};

export const fetchClubEvents = async (clubId) => {
  const res = await api.get(`/events/club/${clubId}`);
  return (res.data.data ?? []).map(normalizeEvent);
};

export const fetchPendingClubEvents = async (clubId) => {
  const res = await api.get(`/events/club/${clubId}/pending`);
  return (res.data.data ?? []).map(normalizeEvent);
};

export const fetchMyEvents = async () => {
  const res = await api.get('/events/mine');
  return (res.data.data ?? []).map(normalizeEvent);
};

export const fetchMyRegistrations = async () => {
  const res = await api.get('/events/registered');
  return (res.data.data ?? []).map(normalizeEvent);
};

export const fetchEvent = async (id) => {
  const res = await api.get(`/events/${id}`);
  return normalizeEvent(res.data.data);
};

export const apiCreateEvent = async (data) => {
  const res = await api.post('/events', data);
  return normalizeEvent(res.data.data);
};

export const apiUpdateEvent = async (id, data) => {
  const res = await api.put(`/events/${id}`, data);
  return normalizeEvent(res.data.data);
};

export const apiReviewEvent = async (id, status, comment) => {
  const res = await api.put(`/events/${id}/review`, { status: status.toUpperCase(), comment });
  return normalizeEvent(res.data.data);
};

export const apiDeleteEvent = async (id) => {
  await api.delete(`/events/${id}`);
};

export const apiRegisterForEvent = async (id, answers) => {
  const res = await api.post(`/events/${id}/register`, { answers: answers ?? {} });
  return normalizeEvent(res.data.data);
};

export const apiUnregisterFromEvent = async (id) => {
  const res = await api.delete(`/events/${id}/register`);
  return normalizeEvent(res.data.data);
};

// ✅ FIX 5 – rate-limited like/vote calls
export const apiLikeEvent = async (id) => {
  if (!rateLimit(`like-event-${id}`, 800)) return;
  await api.post(`/events/${id}/like`);
};

export const apiCommentEvent = async (id, text) => {
  await api.post(`/events/${id}/comments`, { text });
};

// ── POSTS ─────────────────────────────────────────────────────────────────
export const fetchFeedPosts = async (page = 0, size = 50) => {
  const res  = await api.get('/posts', { params: { page, size } });
  const data = res.data.data;
  const list = Array.isArray(data) ? data : (data?.content ?? []);
  return list.map(normalizePost);
};

export const fetchClubPosts = async (clubId) => {
  const res = await api.get(`/posts/club/${clubId}`);
  return (res.data.data ?? []).map(normalizePost);
};

export const apiCreatePost = async (data) => {
  const res = await api.post('/posts', data);
  return normalizePost(res.data.data);
};

export const apiUpdatePost = async (id, data) => {
  const res = await api.put(`/posts/${id}`, data);
  return normalizePost(res.data.data);
};

export const apiDeletePost = async (id) => {
  await api.delete(`/posts/${id}`);
};

// ✅ FIX 5 – rate limited
export const apiLikePost = async (id) => {
  if (!rateLimit(`like-post-${id}`, 800)) return;
  await api.post(`/posts/${id}/like`);
};

export const apiCommentPost = async (id, text) => {
  await api.post(`/posts/${id}/comments`, { text });
};

export const apiVotePoll = async (id, optionIndex) => {
  if (!rateLimit(`vote-${id}`, 1200)) return;
  await api.post(`/posts/${id}/vote`, { optionIndex });
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────
export const fetchNotifications = async (page = 0, size = 20) => {
  const res = await api.get('/notifications', { params: { page, size } });
  return res.data.data;
};

export const fetchUnreadNotifications = async () => {
  const res = await api.get('/notifications/unread');
  return res.data.data ?? [];
};

export const fetchUnreadCount = async () => {
  const res = await api.get('/notifications/unread/count');
  return res.data.data?.count ?? 0;
};

export const apiMarkNotifRead = async (id) => {
  await api.put(`/notifications/${id}/read`);
};

export const apiMarkAllNotifsRead = async () => {
  await api.put('/notifications/read-all');
};

export const apiSendAnnouncement = async (title, message) => {
  await api.post('/notifications/announcement', { title, message });
};

// ── ADMIN ─────────────────────────────────────────────────────────────────
export const adminGetUsers = async () => {
  const res = await api.get('/admin/users');
  return (res.data.data ?? []).map(normalizeUser);
};

export const adminCreateUser = async (data) => {
  const res = await api.post('/admin/users', { ...data, password: encodePassword(data.password) });
  return normalizeUser(res.data.data);
};

export const adminUpdateRole = async (id, role) => {
  const res = await api.put(`/admin/users/${id}/role`, { role: role.toUpperCase() });
  return normalizeUser(res.data.data);
};

export const adminToggleStatus = async (id) => {
  const res = await api.put(`/admin/users/${id}/toggle-status`);
  return normalizeUser(res.data.data);
};

export const adminGetStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data.data;
};

export const adminGetClubAnalytics = async (clubId) => {
  const res = await api.get(`/admin/clubs/${clubId}/analytics`);
  return res.data.data;
};

export const adminGetLogs = async (limit = 50) => {
  const res = await api.get('/admin/logs', { params: { limit } });
  return res.data.data ?? [];
};

export default api;
