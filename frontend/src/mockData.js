// ─── MOCK USERS ───────────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { _id: 'u1', name: 'Admin User',      email: 'admin@campus.edu',   password: 'admin123',   role: 'admin',       studentId: 'ADMIN001', isActive: true, bio: 'System administrator', avatar: '', joinedClubs: [], managedClub: null, createdAt: '2024-01-01' },
  { _id: 'u2', name: 'Thor Coord',      email: 'coord@campus.edu',   password: 'coord123',   role: 'coordinator', studentId: 'COORD001', isActive: true, bio: 'Coding Club Coordinator', avatar: '', joinedClubs: ['c1'], managedClub: { _id: 'c1', name: 'Coding Club' }, createdAt: '2024-01-02' },
  { _id: 'u3', name: 'Dr. Advisor',     email: 'advisor@campus.edu', password: 'advisor123', role: 'advisor',     studentId: 'FAC001',   isActive: true, bio: 'Senior Faculty Advisor', avatar: '', joinedClubs: [], managedClub: null, createdAt: '2024-01-03' },
  { _id: 'u4', name: 'Kavin',           email: 'kavin@campus.edu',   password: 'student123', role: 'student',     studentId: '2024CS001', isActive: true, bio: 'CS student passionate about IoT', avatar: '', joinedClubs: ['c1', 'c2'], managedClub: null, createdAt: '2024-02-01' },
  { _id: 'u5', name: 'Priya',           email: 'priya@campus.edu',   password: 'student123', role: 'student',     studentId: '2024CS002', isActive: true, bio: 'Full-stack developer in the making', avatar: '', joinedClubs: ['c1', 'c3'], managedClub: null, createdAt: '2024-02-05' },
  { _id: 'u6', name: 'Arjun',           email: 'arjun@campus.edu',   password: 'student123', role: 'student',     studentId: '2024EC001', isActive: true, bio: 'Electronics & AI enthusiast', avatar: '', joinedClubs: ['c1', 'c4'], managedClub: null, createdAt: '2024-02-10' },
  { _id: 'u7', name: 'Divya',           email: 'divya@campus.edu',   password: 'student123', role: 'student',     studentId: '2024IT001', isActive: true, bio: 'UI/UX designer and photographer', avatar: '', joinedClubs: ['c2', 'c4'], managedClub: null, createdAt: '2024-03-01' },
  { _id: 'u8', name: 'Ravi Kumar',      email: 'ravi@campus.edu',    password: 'student123', role: 'student',     studentId: '2024ME001', isActive: true, bio: 'Mechanical meets software', avatar: '', joinedClubs: ['c3', 'c4', 'c5'], managedClub: null, createdAt: '2024-03-10' },
];

// ─── MOCK CLUBS ───────────────────────────────────────────────────────────────
export const MOCK_CLUBS = [
  {
    _id: 'c1', name: 'Coding Club', category: 'Technical', foundedYear: 2019,
    description: 'A hub for passionate coders. We build projects, host hackathons, and upskill together through workshops and collaborative builds.',
    coordinator: { _id: 'u2', name: 'Thor Coord', email: 'coord@campus.edu', avatar: '' },
    advisor: { _id: 'u3', name: 'Dr. Advisor', email: 'advisor@campus.edu', avatar: '' },
    members: [
      { _id: 'u4', name: 'Kavin',      studentId: '2024CS001', email: 'kavin@campus.edu', avatar: '' },
      { _id: 'u5', name: 'Priya',      studentId: '2024CS002', email: 'priya@campus.edu', avatar: '' },
      { _id: 'u6', name: 'Arjun',      studentId: '2024EC001', email: 'arjun@campus.edu', avatar: '' },
    ],
    pendingMembers: [
      { _id: 'u7', name: 'Divya', studentId: '2024IT001', email: 'divya@campus.edu', avatar: '' },
    ],
    isActive: true,
    socialLinks: { github: 'https://github.com', instagram: '', linkedin: '', website: '' }
  },
  {
    _id: 'c2', name: 'Photography Guild', category: 'Cultural', foundedYear: 2020,
    description: 'Capturing stories through the lens. Weekly photowalks, workshops and exhibitions for all skill levels.',
    coordinator: null, advisor: null,
    members: [
      { _id: 'u4', name: 'Kavin', studentId: '2024CS001', email: 'kavin@campus.edu', avatar: '' },
      { _id: 'u7', name: 'Divya', studentId: '2024IT001', email: 'divya@campus.edu', avatar: '' },
    ],
    pendingMembers: [], isActive: true, socialLinks: {}
  },
  {
    _id: 'c3', name: 'Chess Society', category: 'Sports', foundedYear: 2021,
    description: 'Strategy, patience, and intellect. Open to all skill levels from beginners to tournament players.',
    coordinator: null, advisor: null,
    members: [
      { _id: 'u5', name: 'Priya',      studentId: '2024CS002', email: 'priya@campus.edu', avatar: '' },
      { _id: 'u8', name: 'Ravi Kumar', studentId: '2024ME001', email: 'ravi@campus.edu', avatar: '' },
    ],
    pendingMembers: [], isActive: true, socialLinks: {}
  },
  {
    _id: 'c4', name: 'BioTech Society', category: 'Technical', foundedYear: 2022,
    description: 'Exploring the intersection of biology and technology through research, innovation and industry collaboration.',
    coordinator: null, advisor: null,
    members: [
      { _id: 'u6', name: 'Arjun',      studentId: '2024EC001', email: 'arjun@campus.edu', avatar: '' },
      { _id: 'u7', name: 'Divya',      studentId: '2024IT001', email: 'divya@campus.edu', avatar: '' },
      { _id: 'u8', name: 'Ravi Kumar', studentId: '2024ME001', email: 'ravi@campus.edu', avatar: '' },
    ],
    pendingMembers: [], isActive: true, socialLinks: {}
  },
  {
    _id: 'c5', name: 'Fine Arts Collective', category: 'Cultural', foundedYear: 2018,
    description: 'A creative space for painters, sculptors, and digital artists. Monthly exhibitions and inter-college competitions.',
    coordinator: null, advisor: null,
    members: [
      { _id: 'u4', name: 'Kavin',      studentId: '2024CS001', email: 'kavin@campus.edu', avatar: '' },
      { _id: 'u8', name: 'Ravi Kumar', studentId: '2024ME001', email: 'ravi@campus.edu', avatar: '' },
    ],
    pendingMembers: [], isActive: true, socialLinks: {}
  },
];

// Placeholder poster images using picsum (deterministic by seed)
const POSTERS = {
  hackathon:  'https://picsum.photos/seed/hackathon2025/800/450',
  webdev:     'https://picsum.photos/seed/webdevworkshop/800/450',
  photo:      'https://picsum.photos/seed/photoguild/800/450',
  chess:      'https://picsum.photos/seed/chesscomp/800/450',
  biotech:    'https://picsum.photos/seed/biotechsymp/800/450',
  ainight:    'https://picsum.photos/seed/ainight2025/800/450',
};

// ─── MOCK EVENTS ─────────────────────────────────────────────────────────────
export const MOCK_EVENTS = [
  {
    _id: 'e1', title: 'Hackathon 2026',
    description: '24-hour coding hackathon open to all members. Build innovative solutions for real campus problems. Cash prizes and internship referrals for winners.',
    club: { _id: 'c1', name: 'Coding Club', category: 'Technical' },
    createdBy: { _id: 'u4', name: 'Kavin', studentId: '2024CS001' },
    status: 'approved', category: 'Hackathon',
    eventDate: '2026-08-15T09:00:00Z', venue: 'Main Auditorium, Block A',
    maxParticipants: 100, registrationDeadline: '2026-08-10T23:59:00Z',
    poster: POSTERS.hackathon,
    registrationFields: [
      { label: 'Team Name',              type: 'text',     required: true  },
      { label: 'Team Size',              type: 'select',   required: true,  options: ['1','2','3','4'] },
      { label: 'Project Idea (brief)',   type: 'textarea', required: false  },
    ],
    registrations: [
      { _id: 'r1', userId: 'u5', userName: 'Priya',     studentId: '2024CS002', registeredAt: '2026-06-02T10:00:00Z', answers: { 'Team Name': 'Code Warriors', 'Team Size': '3', 'Project Idea (brief)': 'Smart campus IoT' } },
      { _id: 'r2', userId: 'u6', userName: 'Arjun',     studentId: '2024EC001', registeredAt: '2026-06-03T11:00:00Z', answers: { 'Team Name': 'AI Squad',      'Team Size': '2', 'Project Idea (brief)': '' } },
    ],
    coordinatorComment: 'Great event! Approved for all members.',
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    _id: 'e2', title: 'Web Dev Workshop',
    description: 'Hands-on workshop covering modern React, Tailwind CSS, and deployment to Vercel. Bring your laptop. Beginners welcome.',
    club: { _id: 'c1', name: 'Coding Club', category: 'Technical' },
    createdBy: { _id: 'u5', name: 'Priya', studentId: '2024CS002' },
    status: 'approved', category: 'Workshop',
    eventDate: '2026-07-20T14:00:00Z', venue: 'CS Lab 3, Block B',
    maxParticipants: 40, registrationDeadline: '2026-07-18T23:59:00Z',
    poster: POSTERS.webdev,
    registrationFields: [
      { label: 'Experience Level',   type: 'select', required: true,  options: ['Beginner','Intermediate','Advanced'] },
      { label: 'Laptop Available?',  type: 'select', required: true,  options: ['Yes','No'] },
    ],
    registrations: [
      { _id: 'r3', userId: 'u4', userName: 'Kavin', studentId: '2024CS001', registeredAt: '2026-06-06T09:00:00Z', answers: { 'Experience Level': 'Intermediate', 'Laptop Available?': 'Yes' } },
    ],
    coordinatorComment: 'Approved. Please arrange projector.',
    createdAt: '2026-06-04T08:00:00Z',
  },
  // ── PENDING EVENT FOR CODING CLUB (coordinator u2 will see this) ──
  {
    _id: 'e6', title: 'AI Night 2026',
    description: 'An evening of AI demos, lightning talks, and networking. Members showcase their ML projects. Open to all branches.',
    club: { _id: 'c1', name: 'Coding Club', category: 'Technical' },
    createdBy: { _id: 'u6', name: 'Arjun', studentId: '2024EC001' },
    status: 'pending', category: 'Exhibition',
    eventDate: '2026-09-05T17:00:00Z', venue: 'Seminar Hall 2, Block A',
    maxParticipants: 60, registrationDeadline: '2026-09-01T23:59:00Z',
    poster: POSTERS.ainight,
    registrationFields: [
      { label: 'Are you presenting a demo?', type: 'select',   required: true,  options: ['Yes — presenting','No — attending only'] },
      { label: 'Project / Demo Title',       type: 'text',     required: false },
    ],
    registrations: [],
    coordinatorComment: '',
    createdAt: '2026-06-01T08:00:00Z',
  },
  {
    _id: 'e3', title: 'Annual Photography Exhibition',
    description: "Showcase your best shots! This year's theme is 'Everyday Moments'. Open for all Photography Guild members to exhibit.",
    club: { _id: 'c2', name: 'Photography Guild', category: 'Cultural' },
    createdBy: { _id: 'u7', name: 'Divya', studentId: '2024IT001' },
    status: 'approved', category: 'Exhibition',
    eventDate: '2026-09-01T10:00:00Z', venue: 'Gallery Hall, Arts Block',
    maxParticipants: 200, registrationDeadline: '2026-08-25T23:59:00Z',
    poster: POSTERS.photo,
    registrationFields: [
      { label: 'Number of Photos to Exhibit', type: 'text',   required: true },
      { label: 'Photography Style',           type: 'select', required: false, options: ['Portrait','Landscape','Street','Wildlife','Abstract'] },
    ],
    registrations: [],
    coordinatorComment: 'Approved.',
    createdAt: '2026-06-02T08:00:00Z',
  },
  {
    _id: 'e4', title: 'Inter-College Chess Tournament',
    description: 'Open tournament for all skill levels. Swiss-system format, 5 rounds. Trophies for top 3. Register as individual or team of 2.',
    club: { _id: 'c3', name: 'Chess Society', category: 'Sports' },
    createdBy: { _id: 'u8', name: 'Ravi Kumar', studentId: '2024ME001' },
    status: 'approved', category: 'Competition',
    eventDate: '2026-08-05T10:00:00Z', venue: 'Student Activity Centre',
    maxParticipants: 64, registrationDeadline: '2026-08-01T23:59:00Z',
    poster: POSTERS.chess,
    registrationFields: [
      { label: 'Chess Rating (if any)',  type: 'text',   required: false },
      { label: 'Participation Type',     type: 'select', required: true, options: ['Individual','Team of 2'] },
    ],
    registrations: [
      { _id: 'r4', userId: 'u5', userName: 'Priya', studentId: '2024CS002', registeredAt: '2026-06-08T10:00:00Z', answers: { 'Chess Rating (if any)': '1200', 'Participation Type': 'Individual' } },
    ],
    coordinatorComment: 'Approved.',
    createdAt: '2026-06-03T08:00:00Z',
  },
  {
    _id: 'e5', title: 'BioTech Research Symposium',
    description: 'Present your research, hear from industry speakers, and network with faculty and biotech professionals. Lightning talks and panel discussion.',
    club: { _id: 'c4', name: 'BioTech Society', category: 'Technical' },
    createdBy: { _id: 'u6', name: 'Arjun', studentId: '2024EC001' },
    status: 'approved', category: 'Seminar',
    eventDate: '2026-09-10T09:00:00Z', venue: 'Seminar Hall 1',
    maxParticipants: 80, registrationDeadline: '2026-09-05T23:59:00Z',
    poster: POSTERS.biotech,
    registrationFields: [
      { label: 'Presenting a Paper?',              type: 'select', required: true,  options: ['Yes','No — Attending Only'] },
      { label: 'Research Topic (if presenting)',   type: 'text',   required: false },
    ],
    registrations: [
      { _id: 'r5', userId: 'u7', userName: 'Divya',     studentId: '2024IT001', registeredAt: '2026-06-10T10:00:00Z', answers: { 'Presenting a Paper?': 'No — Attending Only', 'Research Topic (if presenting)': '' } },
      { _id: 'r6', userId: 'u8', userName: 'Ravi Kumar', studentId: '2024ME001', registeredAt: '2026-06-10T11:00:00Z', answers: { 'Presenting a Paper?': 'Yes', 'Research Topic (if presenting)': 'CRISPR applications in agriculture' } },
    ],
    coordinatorComment: 'Excellent initiative!',
    createdAt: '2026-06-04T08:00:00Z',
  },
];

// ─── MOCK POSTS ──────────────────────────────────────────────────────────────
export const MOCK_POSTS = [
  {
    _id: 'p1',
    type: 'achievement',
    clubId: 'c1',
    author: { _id: 'u4', name: 'Kavin', role: 'student', avatar: '' },
    createdAt: '2026-06-05T12:00:00Z',
    content: 'Thrilled to announce that I have won the first prize in the national level hackathon! Thanks to our Coding Club for the support and mentoring.',
    achievement: { title: '1st Prize - National Hackathon', awarder: 'TechFest India' },
    likes: ['u5', 'u6'],
    comments: [
      { _id: 'pc1', user: { _id: 'u5', name: 'Priya' }, text: 'Congratulations Kavin! Well deserved!', createdAt: '2026-06-05T12:30:00Z' }
    ],
    status: 'approved'
  },
  {
    _id: 'p2',
    type: 'poll',
    clubId: 'c1',
    author: { _id: 'u2', name: 'Thor Coord', role: 'coordinator', avatar: '' },
    createdAt: '2026-06-05T09:00:00Z',
    content: 'Which topics should we cover in our upcoming developer workshop series? Please vote!',
    poll: {
      question: 'Next Workshop Topic?',
      options: [
        { text: 'TypeScript & Advanced React', votes: ['u4', 'u5'] },
        { text: 'Docker & Kubernetes Basics', votes: ['u6'] },
        { text: 'Introduction to Web3/Solidity', votes: [] }
      ]
    },
    likes: ['u4'],
    comments: [],
    status: 'approved'
  },
  {
    _id: 'p3',
    type: 'picture',
    clubId: 'c2',
    author: { _id: 'u7', name: 'Divya', role: 'student', avatar: '' },
    createdAt: '2026-06-05T02:00:00Z',
    content: 'Captured this beautiful sunset during last weeks photowalk near the lake. The lighting was absolutely perfect!',
    pictureUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    likes: ['u4', 'u5', 'u8'],
    comments: [
      { _id: 'pc2', user: { _id: 'u8', name: 'Ravi Kumar' }, text: 'Stunning shot, Divya! The reflections look amazing.', createdAt: '2026-06-05T04:00:00Z' }
    ],
    status: 'approved'
  }
];

