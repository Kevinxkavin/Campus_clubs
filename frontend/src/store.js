import { MOCK_USERS, MOCK_CLUBS, MOCK_EVENTS, MOCK_POSTS } from './mockData';

// ── helpers ──────────────────────────────────────────────────────────────────
const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ── initialize store once (v2 — bumped to refresh mock event dates) ─────────
if (!localStorage.getItem('cc_init_v2')) {
  // Clear any old data from previous versions
  localStorage.removeItem('cc_init');
  save('cc_users',  MOCK_USERS);
  save('cc_clubs',  MOCK_CLUBS);
  save('cc_events', MOCK_EVENTS);
  save('cc_posts',  MOCK_POSTS);
  save('cc_init_v2', true);
}

// ── getters ──────────────────────────────────────────────────────────────────
export const getUsers  = () => load('cc_users',  MOCK_USERS);
export const getClubs  = () => load('cc_clubs',  MOCK_CLUBS);
export const getEvents = () => load('cc_events', MOCK_EVENTS);
export const getPosts  = () => load('cc_posts',  MOCK_POSTS);

// ── setters ──────────────────────────────────────────────────────────────────
export const setUsers  = (data) => save('cc_users',  data);
export const setClubs  = (data) => save('cc_clubs',  data);
export const setEvents = (data) => save('cc_events', data);
export const setPosts  = (data) => save('cc_posts',  data);


// ── AUTH ─────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) => {
  const users = getUsers();
  const user  = users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  if (!user.isActive) return null;
  save('cc_current_user', user);
  return user;
};
export const getCurrentUser = () => {
  const current = load('cc_current_user', null);
  if (!current) return null;
  const latest = getUsers().find(u => u._id === current._id);
  if (latest) {
    if (JSON.stringify(latest) !== JSON.stringify(current)) {
      save('cc_current_user', latest);
    }
    return latest;
  }
  return current;
};
export const logoutUser     = () => localStorage.removeItem('cc_current_user');

export const registerUser = (data) => {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) return null;
  const newUser = {
    _id: 'u' + Date.now(),
    name: data.name, email: data.email, password: data.password,
    studentId: data.studentId || '', role: 'student',
    isActive: true, bio: '', avatar: '', joinedClubs: [], managedClub: null,
    createdAt: new Date().toISOString()
  };
  setUsers([...users, newUser]);
  save('cc_current_user', newUser);
  return newUser;
};

export const updateCurrentUser = (updates) => {
  const current = getCurrentUser();
  if (!current) return null;
  const updated = { ...current, ...updates };
  save('cc_current_user', updated);
  const users = getUsers().map(u => u._id === current._id ? { ...u, ...updates } : u);
  setUsers(users);
  return updated;
};

// ── CLUBS ────────────────────────────────────────────────────────────────────
export const joinClub = (clubId, userId, additionalDetails) => {
  const clubs = getClubs();
  const updated = clubs.map(c => {
    if (c._id !== clubId) return c;
    if (c.members.find(m => m._id === userId)) return c;
    if (c.pendingMembers.find(m => m._id === userId)) return c;
    const user = getUsers().find(u => u._id === userId);
    return {
      ...c,
      pendingMembers: [
        ...c.pendingMembers,
        {
          _id: user._id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          avatar: user.avatar || '',
          bio: user.bio || '',
          skills: user.skills || '',
          reasonToJoin: additionalDetails?.reasonToJoin || ''
        }
      ]
    };
  });
  setClubs(updated);
};

export const leaveClub = (clubId, userId) => {
  const clubs = getClubs().map(c => c._id !== clubId ? c : { ...c, members: c.members.filter(m => m._id !== userId) });
  setClubs(clubs);
  const users = getUsers().map(u => u._id !== userId ? u : { ...u, joinedClubs: u.joinedClubs.filter(id => id !== clubId) });
  setUsers(users);
};

export const approveMember = (clubId, userId) => {
  const user = getUsers().find(u => u._id === userId);
  const clubs = getClubs().map(c => {
    if (c._id !== clubId) return c;
    const alreadyMember = c.members.find(m => m._id === userId);
    return {
      ...c,
      pendingMembers: c.pendingMembers.filter(m => m._id !== userId),
      members: alreadyMember ? c.members : [...c.members, { _id: user._id, name: user.name, email: user.email, studentId: user.studentId, avatar: user.avatar || '', bio: user.bio || '', skills: user.skills || '' }]
    };
  });
  setClubs(clubs);
  const users = getUsers().map(u => u._id !== userId ? u : { ...u, joinedClubs: u.joinedClubs.includes(clubId) ? u.joinedClubs : [...u.joinedClubs, clubId] });
  setUsers(users);
};

export const rejectMember = (clubId, userId) => {
  const clubs = getClubs().map(c => c._id !== clubId ? c : { ...c, pendingMembers: c.pendingMembers.filter(m => m._id !== userId) });
  setClubs(clubs);
};

export const removeMember = (clubId, userId) => {
  const clubs = getClubs().map(c => c._id !== clubId ? c : { ...c, members: c.members.filter(m => m._id !== userId) });
  setClubs(clubs);
  const users = getUsers().map(u => u._id !== userId ? u : { ...u, joinedClubs: u.joinedClubs.filter(id => id !== clubId) });
  setUsers(users);
};

// ── EVENTS ────────────────────────────────────────────────────────────────────
export const submitEvent = (data, currentUser) => {
  const clubs = getClubs();
  const club  = clubs.find(c => c._id === data.clubId);
  const newEvent = {
    _id: 'e' + Date.now(),
    title: data.title,
    description: data.description,
    club: { _id: club._id, name: club.name, category: club.category },
    createdBy: { _id: currentUser._id, name: currentUser.name, studentId: currentUser.studentId },
    status: 'pending',
    category: data.category,
    eventDate: data.eventDate,
    venue: data.venue,
    maxParticipants: Number(data.maxParticipants) || 50,
    registrationDeadline: data.registrationDeadline,
    poster: data.poster || '',
    registrationFields: data.registrationFields || [],
    registrations: [],
    coordinatorComment: '',
    registrationUrl: data.registrationUrl || '',
    eventChair: data.eventChair || null, // { _id, name, studentId }
    updates: [],
    createdAt: new Date().toISOString(),
  };
  setEvents([...getEvents(), newEvent]);
  return newEvent;
};

export const reviewEvent = (eventId, status, comment) => {
  const events = getEvents().map(e =>
    e._id !== eventId ? e : { ...e, status, coordinatorComment: comment || '', reviewedAt: new Date().toISOString() }
  );
  setEvents(events);
};

export const deleteEvent = (eventId) => {
  setEvents(getEvents().filter(e => e._id !== eventId));
};

export const registerForEvent = (eventId, userId, userName, studentId, answers) => {
  const events = getEvents().map(e => {
    if (e._id !== eventId) return e;
    if (e.registrations.find(r => r.userId === userId)) return e;
    const reg = { _id: 'r' + Date.now(), userId, userName, studentId, registeredAt: new Date().toISOString(), answers: answers || {} };
    return { ...e, registrations: [...e.registrations, reg] };
  });
  setEvents(events);
};

export const unregisterFromEvent = (eventId, userId) => {
  const events = getEvents().map(e =>
    e._id !== eventId ? e : { ...e, registrations: e.registrations.filter(r => r.userId !== userId) }
  );
  setEvents(events);
};

export const likeEvent = (eventId, userId) => {
  const events = getEvents().map(e => {
    if (e._id !== eventId) return e;
    const liked = (e.likes || []).includes(userId);
    return { ...e, likes: liked ? (e.likes || []).filter(id => id !== userId) : [...(e.likes || []), userId] };
  });
  setEvents(events);
};

export const addComment = (eventId, userId, userName, text) => {
  const events = getEvents().map(e => {
    if (e._id !== eventId) return e;
    const comment = { _id: 'cm' + Date.now(), user: { _id: userId, name: userName }, text, createdAt: new Date().toISOString() };
    return { ...e, comments: [...(e.comments || []), comment] };
  });
  setEvents(events);
};

// ── ADMIN ────────────────────────────────────────────────────────────────────
export const createClub = (data) => {
  const newClub = {
    _id: 'c' + Date.now(), ...data,
    coordinator: null, advisor: null, members: [], pendingMembers: [], isActive: true, socialLinks: {}
  };
  setClubs([...getClubs(), newClub]);
  return newClub;
};

export const updateClub = (clubId, data) => {
  setClubs(getClubs().map(c => c._id !== clubId ? c : { ...c, ...data }));
};

export const deactivateClub = (clubId) => {
  setClubs(getClubs().map(c => c._id !== clubId ? c : { ...c, isActive: false }));
};

export const assignCoordinator = (clubId, userId) => {
  const user = getUsers().find(u => u._id === userId);
  const clubs = getClubs();
  const oldClub = clubs.find(c => c._id === clubId);
  
  if (oldClub?.coordinator) {
    setUsers(getUsers().map(u => u._id !== oldClub.coordinator._id ? u : { ...u, role: 'student', managedClub: null }));
  }
  
  // Clear user from being the coordinator of any other club
  let updatedClubs = getClubs().map(c => c.coordinator?._id === userId ? { ...c, coordinator: null } : c);
  
  // Set user as coordinator of the new club
  updatedClubs = updatedClubs.map(c => c._id !== clubId ? c : { ...c, coordinator: { _id: user._id, name: user.name, email: user.email, avatar: '' } });
  setClubs(updatedClubs);
  
  setUsers(getUsers().map(u => u._id !== userId ? u : { ...u, role: 'coordinator', managedClub: { _id: clubId, name: oldClub ? oldClub.name : '' } }));
};

export const assignAdvisor = (clubId, userId) => {
  const user = getUsers().find(u => u._id === userId);
  setClubs(getClubs().map(c => c._id !== clubId ? c : { ...c, advisor: { _id: user._id, name: user.name, email: user.email, avatar: '' } }));
  setUsers(getUsers().map(u => u._id !== userId ? u : { ...u, role: 'advisor' }));
};

export const addMemberAdmin = (clubId, userId) => { approveMember(clubId, userId); };

export const updateUserRole = (userId, role) => {
  setUsers(getUsers().map(u => u._id !== userId ? u : { ...u, role }));
};

export const toggleUserStatus = (userId) => {
  setUsers(getUsers().map(u => u._id !== userId ? u : { ...u, isActive: !u.isActive }));
};

// ── ADDITIONS FOR POSTS, CHAIR UPDATES, STUDENT CREATION ─────────────────────
export const createPost = (data, author) => {
  const newPost = {
    _id: 'p' + Date.now(),
    type: data.type, // 'achievement' | 'poll' | 'picture'
    clubId: data.clubId || null,
    author: {
      _id: author._id,
      name: author.name,
      role: author.role,
      avatar: author.avatar || ''
    },
    content: data.content,
    achievement: data.achievement || null, // { title, awarder }
    poll: data.poll || null, // { question, options: [ { text, votes: [] } ] }
    pictureUrl: data.pictureUrl || '',
    likes: [],
    comments: [],
    status: author.role === 'coordinator' || author.role === 'admin' || author.role === 'advisor' ? 'approved' : 'pending',
    createdAt: new Date().toISOString()
  };
  setPosts([...getPosts(), newPost]);
  return newPost;
};

export const votePoll = (postId, optionIndex, userId) => {
  const posts = getPosts().map(p => {
    if (p._id !== postId) return p;
    if (!p.poll) return p;
    const updatedOptions = p.poll.options.map((opt, idx) => {
      let votes = opt.votes || [];
      if (votes.includes(userId)) {
        votes = votes.filter(v => v !== userId);
      }
      if (idx === optionIndex) {
        votes = [...votes, userId];
      }
      return { ...opt, votes };
    });
    return { ...p, poll: { ...p.poll, options: updatedOptions } };
  });
  setPosts(posts);
};

export const likePost = (postId, userId) => {
  const posts = getPosts().map(p => {
    if (p._id !== postId) return p;
    const liked = (p.likes || []).includes(userId);
    return {
      ...p,
      likes: liked ? (p.likes || []).filter(id => id !== userId) : [...(p.likes || []), userId]
    };
  });
  setPosts(posts);
};

export const addPostComment = (postId, userId, userName, text) => {
  const posts = getPosts().map(p => {
    if (p._id !== postId) return p;
    const comment = {
      _id: 'pc' + Date.now(),
      user: { _id: userId, name: userName },
      text,
      createdAt: new Date().toISOString()
    };
    return { ...p, comments: [...(p.comments || []), comment] };
  });
  setPosts(posts);
};

export const approvePost = (postId) => {
  const posts = getPosts().map(p =>
    p._id !== postId ? p : { ...p, status: 'approved' }
  );
  setPosts(posts);
};

export const deletePost = (postId) => {
  setPosts(getPosts().filter(p => p._id !== postId));
};

export const addEventUpdate = (eventId, text) => {
  const events = getEvents().map(e => {
    if (e._id !== eventId) return e;
    const newUpdate = {
      _id: 'up' + Date.now(),
      text,
      createdAt: new Date().toISOString()
    };
    return { ...e, updates: [...(e.updates || []), newUpdate] };
  });
  setEvents(events);
};

export const addStudentOrStaff = (data) => {
  const users = getUsers();
  if (users.find(u => u.email === data.email)) return null;
  const newUser = {
    _id: 'u' + Date.now(),
    name: data.name,
    email: data.email,
    password: data.password || 'default123',
    studentId: data.studentId || '',
    role: data.role || 'student',
    isActive: true,
    bio: data.bio || '',
    skills: data.skills || '',
    avatar: '',
    joinedClubs: [],
    managedClub: null,
    createdAt: new Date().toISOString()
  };
  setUsers([...users, newUser]);
  return newUser;
};

export const resetStore = () => {
  localStorage.removeItem('cc_init');
  localStorage.removeItem('cc_users');
  localStorage.removeItem('cc_clubs');
  localStorage.removeItem('cc_events');
  localStorage.removeItem('cc_posts');
  localStorage.removeItem('cc_current_user');
  window.location.reload();
};
