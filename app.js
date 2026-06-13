// App logic for KU-Matching (Timetable-based Study Matching Service)

// Global State
let state = {
  accounts: [],
  currentUser: null,
  studies: [],
  notifications: [],
  activeView: 'home',
  
  // Drag-to-select states for timetables
  isMouseDown: false,
  dragStartCell: null,
  dragMode: null, // 'select' (mark occupied/blue) or 'deselect' (mark free/white)
  
  // Temporary timetable buffer when creating study or editing own timetable
  editingTimetable: [] // List of cell IDs: e.g. ["Mon-09", "Tue-14"]
};

// Days of the week and Time slots (9:00 to 22:00, 1-hour increments)
const DAYS = [
  { id: 'Mon', label: '월' },
  { id: 'Tue', label: '화' },
  { id: 'Wed', label: '수' },
  { id: 'Thu', label: '목' },
  { id: 'Fri', label: '금' },
  { id: 'Sat', label: '토' },
  { id: 'Sun', label: '일' }
];

const START_HOUR = 9;
const END_HOUR = 22; // 22:00 is the last slot starting time (ends at 23:00)

// Pre-configured Mock Data
const MOCK_ACCOUNTS = [
  {
    email: 'chulsoo@korea.ac.kr',
    password: 'password123',
    nickname: '철수야놀자',
    dept: '컴퓨터학과',
    grade: '3',
    // Timetable contains class times (occupied blocks)
    // Busy on Mon 9-12, Tue 13-15, Wed 9-12, Thu 13-15
    timetable: ['Mon-09', 'Mon-10', 'Mon-11', 'Tue-13', 'Tue-14', 'Wed-09', 'Wed-10', 'Wed-11', 'Thu-13', 'Thu-14']
  },
  {
    email: 'younghee@korea.ac.kr',
    password: 'password123',
    nickname: '영희네도서관',
    dept: '경영학과',
    grade: '4',
    // Busy on Mon 14-17, Wed 14-17, Fri 10-12
    timetable: ['Mon-14', 'Mon-15', 'Mon-16', 'Wed-14', 'Wed-15', 'Wed-16', 'Fri-10', 'Fri-11']
  },
  {
    email: 'tiger1905@korea.ac.kr',
    password: 'password123',
    nickname: '석탑호랑이',
    dept: '통계학과',
    grade: '2',
    // Busy on Tue 9-12, Thu 9-12, Fri 14-16
    timetable: ['Tue-09', 'Tue-10', 'Tue-11', 'Thu-09', 'Thu-10', 'Thu-11', 'Fri-14', 'Fri-15']
  },
  {
    email: 'minsoo@korea.ac.kr',
    password: 'password123',
    nickname: '민수스튜던트',
    dept: '전기전자공학부',
    grade: '3',
    // Busy on Mon 13-16, Tue 10-12, Wed 13-16, Thu 10-12
    timetable: ['Mon-13', 'Mon-14', 'Mon-15', 'Tue-10', 'Tue-11', 'Wed-13', 'Wed-14', 'Wed-15', 'Thu-10', 'Thu-11']
  }
];

const MOCK_STUDIES = [
  {
    id: 'study-1',
    title: '경영통계학 중간고사 대비 기출문제 풀이',
    subject: '통계학',
    maxCapacity: 6,
    location: '도서관',
    contact: 'https://open.kakao.com/o/sMock111',
    description: '경영통계학 단원별 기출문제 풀이와 핵심이론 요약을 함께할 성실한 학우들을 구합니다. 주로 도서관 스터디룸이나 경영관에서 모일 예정입니다.',
    creatorEmail: 'younghee@korea.ac.kr',
    creatorNickname: '영희네도서관',
    creatorDept: '경영학과',
    creatorGrade: '4',
    // Scheduled time blocks for the study
    timeBlocks: ['Mon-10', 'Mon-11', 'Wed-10', 'Wed-11'],
    members: ['younghee@korea.ac.kr'],
    applications: [
      { email: 'chulsoo@korea.ac.kr', nickname: '철수야놀자', dept: '컴퓨터학과', grade: '3', status: 'pending', matchRate: 0 }
    ],
    status: 'open'
  },
  {
    id: 'study-2',
    title: '백준 실버~골드 매일 1문제 코딩 스터디',
    subject: '코딩',
    maxCapacity: 4,
    location: '온라인',
    contact: 'https://open.kakao.com/o/sMock222',
    description: '매일 백준 문제를 풀고 깃허브에 인증하는 스터디입니다. 일주일에 두 번 모여서 코드 리뷰와 피드백을 진행합니다. 디스코드로 온라인 진행합니다.',
    creatorEmail: 'chulsoo@korea.ac.kr',
    creatorNickname: '철수야놀자',
    creatorDept: '컴퓨터학과',
    creatorGrade: '3',
    timeBlocks: ['Tue-19', 'Tue-20', 'Thu-19', 'Thu-20'],
    members: ['chulsoo@korea.ac.kr', 'minsoo@korea.ac.kr'],
    applications: [],
    status: 'open'
  },
  {
    id: 'study-3',
    title: '토익 스피킹 레벨 7+ 실전 스피킹 스터디',
    subject: '토익',
    maxCapacity: 5,
    location: '카페',
    contact: 'https://open.kakao.com/o/sMock333',
    description: '실전 모의고사 세트를 시간 재고 답변하는 강도 높은 스터디입니다. 템플릿 암기와 1:1 피드백 중심입니다. 안암역 근처 스터디 카페에서 진행합니다.',
    creatorEmail: 'tiger1905@korea.ac.kr',
    creatorNickname: '석탑호랑이',
    creatorDept: '통계학과',
    creatorGrade: '2',
    timeBlocks: ['Fri-15', 'Fri-16', 'Fri-17'],
    members: ['tiger1905@korea.ac.kr'],
    applications: [],
    status: 'open'
  },
  {
    id: 'study-4',
    title: '리액트(React.js) 기초 웹 프로젝트 토이개발',
    subject: '코딩',
    maxCapacity: 8,
    location: '스터디룸',
    contact: 'https://open.kakao.com/o/sMock444',
    description: '리액트 공식 문서를 1회독하고 간단한 웹 사이트 개발 프로젝트를 함께 합니다. 웹에 관심 있는 초보자도 대환영입니다!',
    creatorEmail: 'chulsoo@korea.ac.kr',
    creatorNickname: '철수야놀자',
    creatorDept: '컴퓨터학과',
    creatorGrade: '3',
    timeBlocks: ['Mon-16', 'Mon-17', 'Wed-16', 'Wed-17'],
    members: ['chulsoo@korea.ac.kr'],
    applications: [
      { email: 'younghee@korea.ac.kr', nickname: '영희네도서관', dept: '경영학과', grade: '4', status: 'accepted', matchRate: 100 }
    ],
    status: 'open'
  }
];

// Initialize LocalStorage Data if not present
function initializeDatabase() {
  if (!localStorage.getItem('ku_matching_accounts')) {
    localStorage.setItem('ku_matching_accounts', JSON.stringify(MOCK_ACCOUNTS));
  }
  if (!localStorage.getItem('ku_matching_studies')) {
    localStorage.setItem('ku_matching_studies', JSON.stringify(MOCK_STUDIES));
  }
  if (!localStorage.getItem('ku_matching_notifications')) {
    localStorage.setItem('ku_matching_notifications', JSON.stringify([]));
  }
  
  // Load into memory
  state.accounts = JSON.parse(localStorage.getItem('ku_matching_accounts'));
  state.studies = JSON.parse(localStorage.getItem('ku_matching_studies'));
  state.notifications = JSON.parse(localStorage.getItem('ku_matching_notifications'));
  
  // Session Restore
  const sessionUser = sessionStorage.getItem('ku_matching_session');
  if (sessionUser) {
    state.currentUser = JSON.parse(sessionUser);
    updateHeaderUserStatus();
  }
}

// Save back to LocalStorage
function saveAccounts() {
  localStorage.setItem('ku_matching_accounts', JSON.stringify(state.accounts));
}

function saveStudies() {
  localStorage.setItem('ku_matching_studies', JSON.stringify(state.studies));
}

function saveNotifications() {
  localStorage.setItem('ku_matching_notifications', JSON.stringify(state.notifications));
  updateNotificationBadge();
}

// Route manager (SPA)
function showView(viewId) {
  state.activeView = viewId;
  
  // Hide all views, display targeted view
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.remove('active');
  });
  const targetView = document.getElementById(`view-${viewId}`);
  if (targetView) {
    targetView.classList.add('active');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav bar active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.id === `nav-${viewId}`) {
      item.classList.add('active');
    }
  });

  // Dynamic View Setup when switching
  if (viewId === 'explore') {
    renderStudyList();
  } else if (viewId === 'timetable') {
    setupTimetableEditor();
  } else if (viewId === 'mypage') {
    if (!state.currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      showView('auth');
    } else {
      setupMyPage();
    }
  } else if (viewId === 'create') {
    if (!state.currentUser) {
      alert('로그인이 필요한 서비스입니다.');
      showView('auth');
    } else {
      setupCreateStudyView();
    }
  } else if (viewId === 'home') {
    updateHomeStats();
  }

  // Close notification dropdown if open
  document.getElementById('notification-dropdown').style.display = 'none';
}

// Update home statistics
function updateHomeStats() {
  const matchCountEl = document.getElementById('stat-match-count');
  const studyCountEl = document.getElementById('stat-study-count');
  
  if (studyCountEl) {
    studyCountEl.textContent = state.studies.length;
  }
  
  // Calculate total accepted member matches across all studies
  let totalMatches = 1248; // starting dummy base
  state.studies.forEach(s => {
    totalMatches += s.members.length - 1; // excluding creator
  });
  if (matchCountEl) {
    matchCountEl.textContent = totalMatches.toLocaleString();
  }
}

// Manage User Header
function updateHeaderUserStatus() {
  const container = document.getElementById('header-user-status');
  if (!container) return;
  
  if (state.currentUser) {
    container.innerHTML = `
      <div class="user-chip-menu" style="display: flex; align-items: center; gap: 8px; cursor: pointer;" id="header-user-menu-trigger">
        <div class="avatar btn-sm" style="width: 32px; height: 32px; font-size: 11px;">
          ${state.currentUser.nickname.slice(0, 2)}
        </div>
        <span class="user-chip-name" style="font-size: 13px; font-weight:600; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${state.currentUser.nickname}
        </span>
      </div>
    `;
    
    // Clicking user chip routes to My Page
    document.getElementById('header-user-menu-trigger').addEventListener('click', () => {
      showView('mypage');
    });
  } else {
    container.innerHTML = `
      <button class="btn btn-outline btn-sm nav-login-btn" id="btn-header-login">로그인</button>
    `;
    document.getElementById('btn-header-login').addEventListener('click', () => {
      showView('auth');
    });
  }
}

// Modal dialog popups
function showModal({ title, body, showCancel = true, confirmText = '확인', cancelText = '취소', onConfirm }) {
  const backdrop = document.getElementById('modal-container');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');
  
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  
  modalFooter.innerHTML = '';
  if (showCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = cancelText;
    cancelBtn.onclick = () => { backdrop.style.display = 'none'; };
    modalFooter.appendChild(cancelBtn);
  }
  
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.textContent = confirmText;
  confirmBtn.onclick = () => {
    backdrop.style.display = 'none';
    if (onConfirm) onConfirm();
  };
  modalFooter.appendChild(confirmBtn);
  
  backdrop.style.display = 'flex';
}

// Close Modal Binding
document.getElementById('modal-close-btn').addEventListener('click', () => {
  document.getElementById('modal-container').style.display = 'none';
});

// Notifications Engine
function sendSystemNotification(recipientEmail, message) {
  const newNotif = {
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    recipientEmail,
    message,
    timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    read: false
  };
  state.notifications.unshift(newNotif);
  saveNotifications();
}

function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  
  if (state.currentUser) {
    const unreadCount = state.notifications.filter(n => n.recipientEmail === state.currentUser.email && !n.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } else {
    badge.style.display = 'none';
  }
}

function renderNotificationDropdown() {
  const container = document.getElementById('notification-list-container');
  if (!container) return;
  
  if (!state.currentUser) {
    container.innerHTML = `<div class="empty-state">로그인 후 알림을 확인하세요.</div>`;
    return;
  }
  
  const myNotifs = state.notifications.filter(n => n.recipientEmail === state.currentUser.email);
  
  if (myNotifs.length === 0) {
    container.innerHTML = `<div class="empty-state">새로운 알림이 없습니다.</div>`;
    return;
  }
  
  container.innerHTML = '';
  myNotifs.forEach(notif => {
    const item = document.createElement('div');
    item.className = `notification-item ${notif.read ? '' : 'unread'}`;
    item.innerHTML = `
      <div>${notif.message}</div>
      <span class="notification-time">${notif.timestamp}</span>
    `;
    item.addEventListener('click', () => {
      notif.read = true;
      saveNotifications();
      renderNotificationDropdown();
    });
    container.appendChild(item);
  });
}

// Notification bells events
document.getElementById('notification-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('notification-dropdown');
  if (dropdown.style.display === 'none') {
    renderNotificationDropdown();
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
});

document.getElementById('clear-notifications').addEventListener('click', () => {
  if (state.currentUser) {
    state.notifications = state.notifications.filter(n => n.recipientEmail !== state.currentUser.email);
    saveNotifications();
    renderNotificationDropdown();
  }
});

document.addEventListener('click', () => {
  document.getElementById('notification-dropdown').style.display = 'none';
});

document.getElementById('notification-dropdown').addEventListener('click', (e) => {
  e.stopPropagation();
});


// -------------------------------------------------------------
// USER SIGNUP & LOGIN LOGIC
// -------------------------------------------------------------
let simulatedCode = '';

document.getElementById('tab-login-btn').addEventListener('click', () => {
  document.getElementById('tab-login-btn').classList.add('active');
  document.getElementById('tab-signup-btn').classList.remove('active');
  document.getElementById('form-login-container').style.display = 'block';
  document.getElementById('form-signup-container').style.display = 'none';
});

document.getElementById('tab-signup-btn').addEventListener('click', () => {
  document.getElementById('tab-signup-btn').classList.add('active');
  document.getElementById('tab-login-btn').classList.remove('active');
  document.getElementById('form-signup-container').style.display = 'block';
  document.getElementById('form-login-container').style.display = 'none';
});

// Verification Code Mock sending
document.getElementById('btn-send-code').addEventListener('click', () => {
  const emailInput = document.getElementById('signup-email');
  const email = emailInput.value.trim();
  
  if (!email.endsWith('@korea.ac.kr')) {
    alert('고려대학교 이메일(@korea.ac.kr) 형식이어야 합니다.');
    return;
  }
  
  // Generate random code
  simulatedCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Visual Mock Display (Show on screen directly for testing easily)
  const codeGroup = document.getElementById('group-verification-code');
  codeGroup.style.display = 'block';
  
  // Toast alert
  alert(`[이메일 발송 완료] ${email} 주소로 인증코드가 발송되었습니다.\n테스트 인증번호: [ ${simulatedCode} ]`);
});

document.getElementById('btn-verify-code').addEventListener('click', () => {
  const inputCode = document.getElementById('signup-code').value.trim();
  const successMsg = document.getElementById('verification-success');
  const errorMsg = document.getElementById('verification-error');
  
  if (inputCode === simulatedCode && simulatedCode !== '') {
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
    document.getElementById('btn-signup-submit').disabled = false;
    document.getElementById('signup-email').readOnly = true;
    document.getElementById('btn-send-code').disabled = true;
    document.getElementById('btn-verify-code').disabled = true;
  } else {
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
  }
});

// Signup Form Submit
document.getElementById('form-signup').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const nickname = document.getElementById('signup-nickname').value.trim();
  const dept = document.getElementById('signup-dept').value;
  const grade = document.getElementById('signup-grade').value;
  
  // Validate Password: Alphanumeric, 8+ characters
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  if (!passwordRegex.test(password)) {
    showSignupError('비밀번호는 영문+숫자 포함 8자 이상이어야 합니다.');
    return;
  }
  
  if (!nickname || !dept || !grade) {
    showSignupError('모든 필드를 다 채워주세요.');
    return;
  }
  
  // Check if account already exists
  if (state.accounts.some(acc => acc.email === email)) {
    showSignupError('이미 가입된 고려대학교 계정입니다.');
    return;
  }
  
  const newAccount = {
    email,
    password,
    nickname,
    dept,
    grade,
    timetable: [] // starts empty
  };
  
  state.accounts.push(newAccount);
  saveAccounts();
  
  alert('회원가입이 완료되었습니다. 내 시간표를 등록해 주세요!');
  
  // Auto login
  doLogin(newAccount);
  showView('timetable');
});

function showSignupError(msg) {
  const err = document.getElementById('signup-error');
  err.textContent = msg;
  err.style.display = 'block';
}

// Login Form Submit
document.getElementById('form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  
  const account = state.accounts.find(acc => acc.email === email && acc.password === password);
  
  if (account) {
    document.getElementById('login-error').style.display = 'none';
    doLogin(account);
    alert(`${account.nickname} 학우님 환영합니다!`);
    showView('explore');
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
});

function doLogin(account) {
  state.currentUser = account;
  sessionStorage.setItem('ku_matching_session', JSON.stringify(account));
  updateHeaderUserStatus();
  updateNotificationBadge();
}

// Logout
document.getElementById('btn-logout')?.addEventListener('click', () => {
  state.currentUser = null;
  sessionStorage.removeItem('ku_matching_session');
  updateHeaderUserStatus();
  updateNotificationBadge();
  showView('home');
});


// -------------------------------------------------------------
// TIMETABLE UI LOGIC
// -------------------------------------------------------------

// Build a clean, responsive HTML table grid inside targetContainerId
function buildTimetableGrid(containerId, isInteractive, selectedBlocks, onCellToggle) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  const table = document.createElement('table');
  table.className = 'timetable-table';
  
  // Header Row (Time, Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const headerRow = document.createElement('tr');
  const timeHeader = document.createElement('th');
  timeHeader.className = 'time-col';
  timeHeader.textContent = '시간';
  headerRow.appendChild(timeHeader);
  
  DAYS.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day.label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  
  // Hours Rows
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const row = document.createElement('tr');
    
    // Time Column label (e.g. 09:00)
    const timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = `${hour.toString().padStart(2, '0')}:00`;
    row.appendChild(timeCell);
    
    // Day columns for this hour
    DAYS.forEach(day => {
      const td = document.createElement('td');
      const cellId = `${day.id}-${hour.toString().padStart(2, '0')}`;
      td.className = 'timetable-cell';
      td.id = `${containerId}-cell-${cellId}`;
      td.dataset.day = day.id;
      td.dataset.hour = hour;
      td.dataset.cellId = cellId;
      
      // occupied check
      if (selectedBlocks && selectedBlocks.includes(cellId)) {
        td.classList.add('occupied');
      }
      
      if (isInteractive) {
        // Drag interactions mouse/touch
        td.addEventListener('mousedown', (e) => {
          state.isMouseDown = true;
          state.dragStartCell = cellId;
          // toggle initial mode
          const hasOccupied = td.classList.contains('occupied');
          state.dragMode = hasOccupied ? 'deselect' : 'select';
          
          toggleCellInTimetable(td, cellId, state.dragMode);
          if (onCellToggle) onCellToggle(cellId, state.dragMode);
        });
        
        td.addEventListener('mouseenter', () => {
          if (state.isMouseDown) {
            toggleCellInTimetable(td, cellId, state.dragMode);
            if (onCellToggle) onCellToggle(cellId, state.dragMode);
          }
        });
        
        // Touch events for mobile
        td.addEventListener('touchstart', (e) => {
          state.isMouseDown = true;
          state.dragStartCell = cellId;
          const hasOccupied = td.classList.contains('occupied');
          state.dragMode = hasOccupied ? 'deselect' : 'select';
          
          toggleCellInTimetable(td, cellId, state.dragMode);
          if (onCellToggle) onCellToggle(cellId, state.dragMode);
        });
      }
      
      row.appendChild(td);
    });
    table.appendChild(row);
  }
  
  container.appendChild(table);
}

// Global mouse listeners to stop dragging when letting go of mouse button
window.addEventListener('mouseup', () => {
  state.isMouseDown = false;
  state.dragStartCell = null;
  state.dragMode = null;
});

window.addEventListener('touchend', () => {
  state.isMouseDown = false;
  state.dragStartCell = null;
  state.dragMode = null;
});

function toggleCellInTimetable(cellElement, cellId, mode) {
  if (mode === 'select') {
    cellElement.classList.add('occupied');
  } else {
    cellElement.classList.remove('occupied');
  }
}

// Setup Timetable Editor page
function setupTimetableEditor() {
  if (!state.currentUser) return;
  
  // Clone current occupied list
  state.editingTimetable = [...state.currentUser.timetable];
  
  buildTimetableGrid('my-timetable-grid', true, state.editingTimetable, (cellId, mode) => {
    if (mode === 'select') {
      if (!state.editingTimetable.includes(cellId)) {
        state.editingTimetable.push(cellId);
      }
    } else {
      state.editingTimetable = state.editingTimetable.filter(id => id !== cellId);
    }
  });
}

// Save Timetable
document.getElementById('btn-save-timetable').addEventListener('click', () => {
  if (!state.currentUser) return;
  
  // Save edited timetable back to user profile
  const userAcc = state.accounts.find(acc => acc.email === state.currentUser.email);
  userAcc.timetable = [...state.editingTimetable];
  state.currentUser.timetable = [...state.editingTimetable];
  
  saveAccounts();
  sessionStorage.setItem('ku_matching_session', JSON.stringify(state.currentUser));
  
  alert('시간표가 성공적으로 저장되었습니다!');
  showView('explore');
});

// Reset Timetable
document.getElementById('btn-reset-timetable').addEventListener('click', () => {
  state.editingTimetable = [];
  // Rebuild empty grid
  buildTimetableGrid('my-timetable-grid', true, [], (cellId, mode) => {
    if (mode === 'select') {
      if (!state.editingTimetable.includes(cellId)) {
        state.editingTimetable.push(cellId);
      }
    } else {
      state.editingTimetable = state.editingTimetable.filter(id => id !== cellId);
    }
  });
});


// -------------------------------------------------------------
// STUDY SEARCH & MATCHING ALGORITHM
// -------------------------------------------------------------

// Calculate Overlap Matching Rate between current user and a study
// Note: User's Busy times = user.timetable
// User's Free times = All Grid Blocks EXCEPT user.timetable
// Study's Required/Available meeting time = study.timeBlocks
// Overlap = User's Free times INTERSECTION Study's timeBlocks
// That is: study.timeBlocks that DO NOT exist in user.timetable!
function calculateMatchRate(user, study) {
  if (!user || !study || !study.timeBlocks || study.timeBlocks.length === 0) return 0;
  
  // Study meeting times
  const studyTimes = study.timeBlocks;
  // User's busy times
  const userBusyTimes = user.timetable || [];
  
  // Overlapping times (Study meeting times where user is FREE)
  const overlappingSlots = studyTimes.filter(slot => !userBusyTimes.includes(slot));
  
  // Match Rate = (Overlapping slots / Study required slots) * 100
  const rate = (overlappingSlots.length / studyTimes.length) * 100;
  return Math.round(rate);
}

// Render study search card lists
function renderStudyList() {
  const container = document.getElementById('study-list-container');
  if (!container) return;
  
  const searchVal = document.getElementById('search-input').value.toLowerCase().trim();
  const filterDay = document.getElementById('filter-day').value;
  const filterCapacity = document.getElementById('filter-capacity').value;
  const filterLocation = document.getElementById('filter-location').value;
  
  // Process all studies
  let filteredStudies = state.studies.map(study => {
    const rate = state.currentUser ? calculateMatchRate(state.currentUser, study) : 0;
    return { ...study, matchRate: rate };
  });
  
  // 1. Sort: matchRate descending (if logged in). If equal, sort by title or id.
  if (state.currentUser) {
    filteredStudies.sort((a, b) => b.matchRate - a.matchRate);
  }
  
  // 2. Search Keyword Filter
  if (searchVal) {
    filteredStudies = filteredStudies.filter(s => 
      s.title.toLowerCase().includes(searchVal) || 
      s.subject.toLowerCase().includes(searchVal) || 
      s.description.toLowerCase().includes(searchVal)
    );
  }
  
  // 3. Day filter
  if (filterDay !== 'all') {
    filteredStudies = filteredStudies.filter(s => 
      s.timeBlocks.some(block => block.startsWith(filterDay))
    );
  }
  
  // 4. Capacity filter
  if (filterCapacity !== 'all') {
    filteredStudies = filteredStudies.filter(s => {
      const cap = s.maxCapacity;
      if (filterCapacity === '2-4') return cap >= 2 && cap <= 4;
      if (filterCapacity === '5-7') return cap >= 5 && cap <= 7;
      if (filterCapacity === '8-10') return cap >= 8 && cap <= 10;
      return true;
    });
  }
  
  // 5. Location filter
  if (filterLocation !== 'all') {
    filteredStudies = filteredStudies.filter(s => s.location.includes(filterLocation));
  }
  
  if (filteredStudies.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 20px;">
        <i data-lucide="compass" style="width: 40px; height: 40px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <p>검색 조건에 맞는 스터디 모임이 없습니다.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = '';
  filteredStudies.forEach(study => {
    const isFull = study.members.length >= study.maxCapacity;
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'study-card';
    card.onclick = () => showStudyDetail(study.id);
    
    // Match badge template
    let matchBadgeHtml = '';
    if (state.currentUser) {
      const isHigh = study.matchRate >= 70;
      const isLow = study.matchRate < 40;
      const badgeClass = isHigh ? 'high-match' : (isLow ? 'low-match' : '');
      matchBadgeHtml = `<span class="match-badge ${badgeClass}"><i data-lucide="zap"></i>나와 ${study.matchRate}% 일치</span>`;
    } else {
      matchBadgeHtml = `<span class="match-badge low-match">로그인시 매칭율 공개</span>`;
    }
    
    // Convert time blocks list to friendly text format: e.g. Mon-10 -> 월 10:00
    const friendlyTimeText = formatTimeBlocks(study.timeBlocks);
    
    card.innerHTML = `
      <div class="card-top">
        <span class="study-badge">${study.subject}</span>
        ${matchBadgeHtml}
      </div>
      <h3>${study.title}</h3>
      <div class="study-card-details">
        <span><i data-lucide="map-pin"></i>${study.location}</span>
        <span><i data-lucide="clock"></i>${friendlyTimeText}</span>
      </div>
      <div class="card-footer">
        <span class="member-count">
          <i data-lucide="users"></i>${study.members.length} / ${study.maxCapacity} 명
          ${isFull ? '<span style="color: var(--danger); font-size:11px;">(마감)</span>' : ''}
        </span>
        <span class="leader-tag">${study.creatorNickname}</span>
      </div>
    `;
    
    container.appendChild(card);
  });
  
  // Init icons in injected HTML
  lucide.createIcons();
}

// Convert time blocks array into a readable Korean text string
function formatTimeBlocks(blocks) {
  if (!blocks || blocks.length === 0) return '시간 미지정';
  
  // Group by day
  const grouped = {};
  blocks.forEach(b => {
    const parts = b.split('-');
    const day = parts[0];
    const hour = parts[1];
    
    const dayLabel = DAYS.find(d => d.id === day)?.label || day;
    if (!grouped[dayLabel]) grouped[dayLabel] = [];
    grouped[dayLabel].push(parseInt(hour));
  });
  
  const textSegments = [];
  Object.keys(grouped).forEach(day => {
    const hours = grouped[day].sort((a, b) => a - b);
    
    // Find consecutive ranges
    const ranges = [];
    let start = hours[0];
    let prev = hours[0];
    
    for (let i = 1; i <= hours.length; i++) {
      if (i < hours.length && hours[i] === prev + 1) {
        prev = hours[i];
      } else {
        if (start === prev) {
          ranges.push(`${start}시`);
        } else {
          ranges.push(`${start}시~${prev + 1}시`);
        }
        if (i < hours.length) {
          start = hours[i];
          prev = hours[i];
        }
      }
    }
    textSegments.push(`${day}요일(${ranges.join(', ')})`);
  });
  
  return textSegments.join(' / ');
}

// Bind filter change listeners
document.getElementById('search-input').addEventListener('input', renderStudyList);
document.getElementById('filter-day').addEventListener('change', renderStudyList);
document.getElementById('filter-capacity').addEventListener('change', renderStudyList);
document.getElementById('filter-location').addEventListener('change', renderStudyList);

document.getElementById('btn-hero-explore').addEventListener('click', () => showView('explore'));
document.getElementById('btn-hero-start').addEventListener('click', () => {
  if (state.currentUser) {
    showView('timetable');
  } else {
    showView('auth');
  }
});
document.getElementById('btn-goto-create').addEventListener('click', () => showView('create'));


// -------------------------------------------------------------
// STUDY DETAIL VIEW LOGIC
// -------------------------------------------------------------
function showStudyDetail(studyId) {
  const study = state.studies.find(s => s.id === studyId);
  if (!study) return;
  
  showView('detail');
  
  // Render text data
  document.getElementById('detail-subject').textContent = study.subject;
  document.getElementById('detail-title').textContent = study.title;
  document.getElementById('detail-leader-name').textContent = study.creatorNickname;
  document.getElementById('detail-leader-meta').textContent = `${study.creatorDept} · ${study.creatorGrade}학년`;
  document.getElementById('detail-members').textContent = `${study.members.length} / ${study.maxCapacity} 명 (최대 ${study.maxCapacity}명)`;
  document.getElementById('detail-location').textContent = study.location;
  document.getElementById('detail-time-text').textContent = formatTimeBlocks(study.timeBlocks);
  document.getElementById('detail-description').textContent = study.description;
  
  // Match Rate rendering
  const matchRateEl = document.getElementById('detail-match-rate-huge');
  if (state.currentUser) {
    const rate = calculateMatchRate(state.currentUser, study);
    matchRateEl.textContent = `${rate}%`;
  } else {
    matchRateEl.textContent = '- %';
  }
  
  // Render visual overlap comparison grid
  renderComparisonTimetable(study);
  
  // Action Button Setup (Apply, Join Status, Open Chat info, etc.)
  setupDetailActionButtons(study);
}

function renderComparisonTimetable(study) {
  const container = document.getElementById('detail-comparison-grid');
  if (!container) return;
  
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'timetable-table';
  
  // Header row
  const headerRow = document.createElement('tr');
  const timeHeader = document.createElement('th');
  timeHeader.textContent = '시간';
  headerRow.appendChild(timeHeader);
  
  DAYS.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day.label;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  
  // Hour rows
  for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
    const row = document.createElement('tr');
    
    // Time label
    const timeCell = document.createElement('td');
    timeCell.className = 'time-cell';
    timeCell.textContent = `${hour.toString().padStart(2, '0')}:00`;
    row.appendChild(timeCell);
    
    DAYS.forEach(day => {
      const td = document.createElement('td');
      const cellId = `${day.id}-${hour.toString().padStart(2, '0')}`;
      td.className = 'timetable-cell';
      
      const isStudyMeetingTime = study.timeBlocks.includes(cellId);
      
      if (isStudyMeetingTime) {
        // If current user is logged in, check if user is free at this hour
        if (state.currentUser) {
          const isUserBusy = state.currentUser.timetable.includes(cellId);
          if (!isUserBusy) {
            // Match overlap (Study meets & User is free)
            td.classList.add('overlap-match');
          } else {
            // Conflict (Study meets but User is busy/in class)
            td.classList.add('overlap-conflict');
          }
        } else {
          // Just highlight study time if guest
          td.classList.add('occupied');
        }
      } else {
        td.classList.add('overlap-free');
      }
      
      row.appendChild(td);
    });
    table.appendChild(row);
  }
  
  container.appendChild(table);
}

function setupDetailActionButtons(study) {
  const container = document.getElementById('detail-action-container');
  if (!container) return;
  
  if (!state.currentUser) {
    container.innerHTML = `
      <p class="description" style="margin-bottom: 12px;">로그인하시면 스터디 시간표 일치 연산과 참여 신청이 활성화됩니다.</p>
      <button class="btn btn-primary" id="btn-detail-login-redirect">로그인하고 신청하기</button>
    `;
    document.getElementById('btn-detail-login-redirect').onclick = () => showView('auth');
    return;
  }
  
  // 1. User is creator
  if (study.creatorEmail === state.currentUser.email) {
    container.innerHTML = `
      <div style="background-color: var(--primary-light); padding:16px; border-radius: var(--radius-md); text-align: center; border:1px solid rgba(158, 27, 50, 0.2);">
        <p style="color: var(--primary); font-weight:700; margin-bottom: 8px;">내가 개설한 스ner디 모임입니다.</p>
        <button class="btn btn-primary btn-sm" id="btn-detail-manage-redirect">마이페이지에서 신청자 관리하기</button>
      </div>
    `;
    document.getElementById('btn-detail-manage-redirect').onclick = () => {
      showView('mypage');
      document.getElementById('tab-created-btn').click();
    };
    return;
  }
  
  // 2. User is already accepted member
  if (study.members.includes(state.currentUser.email)) {
    container.innerHTML = `
      <div style="border: 2px dashed var(--success); padding:16px; border-radius: var(--radius-md); text-align: center; background-color: var(--success-light); margin-bottom:12px;">
        <h4 style="color: var(--success); margin-bottom: 6px;"><i data-lucide="check-circle" style="vertical-align:middle; width: 18px;"></i> 스터디 참여 중 (승인 완료)</h4>
        <p style="font-size:12px; margin-bottom:10px;">연락처/오픈채팅방 주소: <a href="${study.contact}" target="_blank" style="font-weight:700; color: var(--primary);">${study.contact}</a></p>
      </div>
      <button class="btn btn-outline" id="btn-detail-leave">스터디 탈퇴하기</button>
    `;
    lucide.createIcons();
    
    document.getElementById('btn-detail-leave').onclick = () => {
      showModal({
        title: '스터디 탈퇴',
        body: `정말로 <strong>${study.title}</strong> 스터디에서 탈퇴하시겠습니까?`,
        confirmText: '탈퇴',
        onConfirm: () => {
          study.members = study.members.filter(m => m !== state.currentUser.email);
          saveStudies();
          alert('탈퇴되었습니다.');
          showStudyDetail(study.id);
        }
      });
    };
    return;
  }
  
  // 3. User is pending applicant
  const application = study.applications.find(app => app.email === state.currentUser.email);
  if (application) {
    if (application.status === 'pending') {
      container.innerHTML = `
        <div style="background-color: var(--secondary-light); padding:16px; border-radius: var(--radius-md); text-align: center; margin-bottom:12px;">
          <p style="color: var(--secondary); font-weight:600; margin-bottom: 4px;">스터디장 승인 대기 중...</p>
          <span class="description">가입이 수락되면 오픈채팅 정보와 연락처를 확인할 수 있습니다.</span>
        </div>
        <button class="btn btn-outline" id="btn-detail-cancel-apply">지원 취소하기</button>
      `;
      document.getElementById('btn-detail-cancel-apply').onclick = () => {
        study.applications = study.applications.filter(app => app.email !== state.currentUser.email);
        saveStudies();
        alert('신청이 취소되었습니다.');
        showStudyDetail(study.id);
      };
    } else if (application.status === 'rejected') {
      container.innerHTML = `
        <div style="background-color: var(--danger-light); padding:16px; border-radius: var(--radius-md); text-align: center;">
          <p style="color: var(--danger); font-weight:700;">가입 신청이 반려되었습니다.</p>
        </div>
      `;
    }
    return;
  }
  
  // 4. Study is full
  if (study.members.length >= study.maxCapacity) {
    container.innerHTML = `
      <button class="btn btn-secondary btn-block" disabled>모집 인원 마감</button>
    `;
    return;
  }
  
  // 5. Eligible to apply
  container.innerHTML = `
    <button class="btn btn-primary btn-block btn-lg" id="btn-detail-apply">참여 신청 보내기</button>
  `;
  
  document.getElementById('btn-detail-apply').onclick = () => {
    // Check if user has initialized their own timetable
    if (!state.currentUser.timetable || state.currentUser.timetable.length === 0) {
      alert('스터디 신청 전에 본인의 시간표를 먼저 입력하셔야 합니다.');
      showView('timetable');
      return;
    }
    
    // Add applicant
    const rate = calculateMatchRate(state.currentUser, study);
    study.applications.push({
      email: state.currentUser.email,
      nickname: state.currentUser.nickname,
      dept: state.currentUser.dept,
      grade: state.currentUser.grade,
      status: 'pending',
      matchRate: rate
    });
    
    saveStudies();
    
    // Send Notification to creator
    sendSystemNotification(
      study.creatorEmail,
      `학우 [${state.currentUser.nickname}]님이 회원님의 스터디 [${study.title}]에 가입을 신청했습니다. (매칭율: ${rate}%)`
    );
    
    alert('참여 신청을 성공적으로 보냈습니다!');
    showStudyDetail(study.id);
  };
}

document.getElementById('btn-back-to-explore').onclick = () => showView('explore');
document.getElementById('header-logo-container').onclick = () => showView('home');


// -------------------------------------------------------------
// STUDY CREATION LOGIC
// -------------------------------------------------------------
function setupCreateStudyView() {
  // Reset form inputs
  document.getElementById('form-create-study').reset();
  document.getElementById('create-error').style.display = 'none';
  
  // Reset create time grid selector buffer
  state.editingTimetable = [];
  
  // Render selection grid
  buildTimetableGrid('create-study-timetable-grid', true, [], (cellId, mode) => {
    if (mode === 'select') {
      if (!state.editingTimetable.includes(cellId)) {
        state.editingTimetable.push(cellId);
      }
    } else {
      state.editingTimetable = state.editingTimetable.filter(id => id !== cellId);
    }
  });
}

// Form submit create study
document.getElementById('form-create-study').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const title = document.getElementById('create-title').value.trim();
  const subject = document.getElementById('create-subject').value.trim();
  const maxCapacity = parseInt(document.getElementById('create-max-members').value);
  const location = document.getElementById('create-location').value.trim();
  const contact = document.getElementById('create-contact').value.trim();
  const description = document.getElementById('create-description').value.trim();
  
  if (!title || !subject || !location || !contact || !description) {
    document.getElementById('create-error').style.display = 'block';
    document.getElementById('create-error').textContent = '모든 폼 요소를 성실히 채워주세요.';
    return;
  }
  
  if (state.editingTimetable.length === 0) {
    document.getElementById('create-error').style.display = 'block';
    document.getElementById('create-error').textContent = '모임 예정 시간표를 최소 1시간 이상 드래그해 지정해 주세요.';
    return;
  }
  
  const newStudy = {
    id: 'study-' + Date.now(),
    title,
    subject,
    maxCapacity,
    location,
    contact,
    description,
    creatorEmail: state.currentUser.email,
    creatorNickname: state.currentUser.nickname,
    creatorDept: state.currentUser.dept,
    creatorGrade: state.currentUser.grade,
    timeBlocks: [...state.editingTimetable],
    members: [state.currentUser.email],
    applications: [],
    status: 'open'
  };
  
  state.studies.push(newStudy);
  saveStudies();
  
  alert('스터디 모임이 등록되었습니다!');
  showView('explore');
});


// -------------------------------------------------------------
// MY PAGE & APPLICANT MANAGEMENT LOGIC
// -------------------------------------------------------------
function setupMyPage() {
  if (!state.currentUser) return;
  
  // 1. User Profile Setup
  document.getElementById('mypage-nickname').textContent = state.currentUser.nickname;
  document.getElementById('mypage-meta').textContent = `${state.currentUser.dept} · ${state.currentUser.grade}학년`;
  document.getElementById('mypage-email').textContent = state.currentUser.email;
  
  // 2. Render Tabs
  renderJoinedTab();
  renderCreatedTab();
}

// Joined Studies tab
function renderJoinedTab() {
  const container = document.getElementById('list-joined-studies');
  if (!container) return;
  
  // Find studies where user is member (includes creator but we can separate or show both)
  // Or studies where user applied (either pending, accepted, rejected)
  const joinedList = [];
  
  state.studies.forEach(study => {
    // If user is member but NOT creator
    if (study.members.includes(state.currentUser.email) && study.creatorEmail !== state.currentUser.email) {
      joinedList.push({ study, status: 'accepted' });
    } else {
      // Check application status
      const app = study.applications.find(a => a.email === state.currentUser.email);
      if (app) {
        joinedList.push({ study, status: app.status });
      }
    }
  });
  
  if (joinedList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>신청하거나 참여 중인 스터디 모임이 없습니다.</p>
        <button class="btn btn-primary btn-sm" id="btn-mypage-explore-redirect">스터디 찾으러 가기</button>
      </div>
    `;
    document.getElementById('btn-mypage-explore-redirect').onclick = () => showView('explore');
    return;
  }
  
  container.innerHTML = '';
  joinedList.forEach(({ study, status }) => {
    const card = document.createElement('div');
    card.className = 'vertical-study-card';
    
    let badgeText = '';
    let badgeClass = '';
    let actionButtons = '';
    
    if (status === 'accepted') {
      badgeText = '참여 완료';
      badgeClass = 'accepted';
      actionButtons = `
        <button class="btn btn-outline btn-sm" onclick="showStudyDetail('${study.id}')">소개 & 연락처 보기</button>
      `;
    } else if (status === 'pending') {
      badgeText = '승인 대기 중';
      badgeClass = 'pending';
      actionButtons = `
        <button class="btn btn-secondary btn-sm" onclick="showStudyDetail('${study.id}')">모집 상세 보기</button>
      `;
    } else if (status === 'rejected') {
      badgeText = '반려됨';
      badgeClass = 'rejected';
      actionButtons = `
        <button class="btn btn-secondary btn-sm" onclick="showStudyDetail('${study.id}')">상세 보기</button>
      `;
    }
    
    card.innerHTML = `
      <div class="v-card-header">
        <div>
          <h3>${study.title}</h3>
          <span class="description" style="font-size:11px;">스터디장: ${study.creatorNickname}</span>
        </div>
        <span class="application-status-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="v-card-body">
        <div style="margin-bottom:4px;"><i data-lucide="map-pin" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>${study.location}</div>
        <div><i data-lucide="clock" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>${formatTimeBlocks(study.timeBlocks)}</div>
      </div>
      <div class="v-card-actions">
        ${actionButtons}
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// Created Studies tab (and Applicant Management)
function renderCreatedTab() {
  const container = document.getElementById('list-created-studies');
  if (!container) return;
  
  const createdList = state.studies.filter(s => s.creatorEmail === state.currentUser.email);
  
  if (createdList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>개설하신 스터디 모임이 없습니다.</p>
        <button class="btn btn-primary btn-sm" id="btn-mypage-create-redirect">새 스터디 개설하기</button>
      </div>
    `;
    document.getElementById('btn-mypage-create-redirect').onclick = () => showView('create');
    return;
  }
  
  container.innerHTML = '';
  createdList.forEach(study => {
    const card = document.createElement('div');
    card.className = 'vertical-study-card';
    
    // Check pending applications
    const pendingApps = study.applications.filter(a => a.status === 'pending');
    
    let applicantsHtml = '';
    if (pendingApps.length > 0) {
      applicantsHtml = `
        <div class="applicant-management-box">
          <h4><i data-lucide="user-plus" style="width:14px; height:14px; vertical-align:middle;"></i> 참여 신청자 (${pendingApps.length}명)</h4>
          <div class="applicant-list">
            ${pendingApps.map(app => `
              <div class="applicant-row">
                <div class="applicant-row-info">
                  <span class="app-nickname">${app.nickname}</span>
                  <span class="app-meta">${app.dept} · ${app.grade}학년</span>
                  <span class="app-match-badge">나와 시간 ${app.matchRate}% 일치</span>
                </div>
                <div class="applicant-row-actions">
                  <button class="btn btn-primary btn-sm" onclick="handleApplicantAction('${study.id}', '${app.email}', 'accept')">수락</button>
                  <button class="btn btn-outline btn-sm" onclick="handleApplicantAction('${study.id}', '${app.email}', 'reject')" style="color:var(--danger); border-color:var(--danger-light);">거절</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      applicantsHtml = `
        <div class="applicant-management-box" style="background-color: transparent; border: 1px dashed var(--border-color); text-align:center; padding:12px;">
          <span class="description" style="font-size:12px;">대기 중인 참여 신청자가 없습니다.</span>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="v-card-header">
        <div>
          <h3>${study.title}</h3>
          <span class="description" style="font-size:11px;">연락처: ${study.contact}</span>
        </div>
        <span class="application-status-badge accepted">모집 인원: ${study.members.length} / ${study.maxCapacity} 명</span>
      </div>
      <div class="v-card-body">
        <div style="margin-bottom:4px;"><i data-lucide="map-pin" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>선호 장소: ${study.location}</div>
        <div><i data-lucide="clock" style="width:12px; height:12px; vertical-align:middle; margin-right:4px;"></i>모임 요일: ${formatTimeBlocks(study.timeBlocks)}</div>
      </div>
      
      ${applicantsHtml}
      
      <div class="v-card-actions">
        <button class="btn btn-outline btn-sm" onclick="showStudyDetail('${study.id}')" style="margin-right:auto;">상세보기</button>
        <button class="btn btn-secondary btn-sm" onclick="handleDeleteStudy('${study.id}')">모집 중단 및 삭제</button>
      </div>
    `;
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// Accept/Reject applicant handler
window.handleApplicantAction = function(studyId, applicantEmail, action) {
  const study = state.studies.find(s => s.id === studyId);
  if (!study) return;
  
  const application = study.applications.find(a => a.email === applicantEmail);
  if (!application) return;
  
  if (action === 'accept') {
    // Check if full
    if (study.members.length >= study.maxCapacity) {
      alert('모집 정원이 꽉 차 수락할 수 없습니다.');
      return;
    }
    
    application.status = 'accepted';
    // Add to members list
    if (!study.members.includes(applicantEmail)) {
      study.members.push(applicantEmail);
    }
    
    // Send Notification to applicant
    sendSystemNotification(
      applicantEmail,
      `축하합니다! 스터디 [${study.title}] 가입 신청이 승인되었습니다. 상세 페이지에서 연락처를 확인하세요!`
    );
    
    alert('참여 신청을 수락했습니다.');
  } else {
    application.status = 'rejected';
    
    // Send Notification to applicant
    sendSystemNotification(
      applicantEmail,
      `스터디 [${study.title}] 가입 신청이 반려되었습니다.`
    );
    
    alert('참여 신청을 거절했습니다.');
  }
  
  saveStudies();
  setupMyPage();
};

// Delete Study handler
window.handleDeleteStudy = function(studyId) {
  const study = state.studies.find(s => s.id === studyId);
  if (!study) return;
  
  showModal({
    title: '스터디 삭제',
    body: `정말로 <strong>${study.title}</strong> 스터디를 영구 삭제하시겠습니까? (참여 중인 모든 멤버가 목록에서 제거됩니다)`,
    confirmText: '스터디 삭제',
    onConfirm: () => {
      // Notify all accepted/pending members
      study.members.forEach(memberEmail => {
        if (memberEmail !== study.creatorEmail) {
          sendSystemNotification(memberEmail, `회원님이 참여 중인 스터디 [${study.title}]가 스터디장에 의해 삭제되었습니다.`);
        }
      });
      study.applications.forEach(app => {
        if (app.status === 'pending') {
          sendSystemNotification(app.email, `신청하신 스터디 [${study.title}]의 모집이 취소되었습니다.`);
        }
      });
      
      state.studies = state.studies.filter(s => s.id !== studyId);
      saveStudies();
      alert('스터디가 성공적으로 삭제되었습니다.');
      setupMyPage();
    }
  });
};

// Profile Actions binding
document.getElementById('btn-mypage-edit-timetable').addEventListener('click', () => {
  showView('timetable');
});

// My Page Sub Tabs click bindings
document.getElementById('tab-joined-btn').addEventListener('click', () => {
  document.getElementById('tab-joined-btn').classList.add('active');
  document.getElementById('tab-created-btn').classList.remove('active');
  document.getElementById('content-joined-studies').style.display = 'block';
  document.getElementById('content-created-studies').style.display = 'none';
});

document.getElementById('tab-created-btn').addEventListener('click', () => {
  document.getElementById('tab-created-btn').classList.add('active');
  document.getElementById('tab-joined-btn').classList.remove('active');
  document.getElementById('content-created-studies').style.display = 'block';
  document.getElementById('content-joined-studies').style.display = 'none';
});


// -------------------------------------------------------------
// APP INITIALIZATION & NAV EVENT LISTENERS
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  // Database setup
  initializeDatabase();
  
  // Navigation Bindings
  document.getElementById('nav-home').addEventListener('click', () => showView('home'));
  document.getElementById('nav-explore').addEventListener('click', () => showView('explore'));
  document.getElementById('nav-create').addEventListener('click', () => showView('create'));
  document.getElementById('nav-mypage').addEventListener('click', () => showView('mypage'));
  
  // Initial View
  showView('home');
  updateHeaderUserStatus();
  
  // Render icons
  lucide.createIcons();
});
