// ==========================================
// 1. BIẾN TOÀN CỤC & KHỞI TẠO TRẠNG THÁI
// ==========================================
let currentUser = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 15 * 60; // 15 phút

// ==========================================
// 2. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ (AUTH)
// ==========================================
let isSignUpMode = false;

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('auth-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');

    if (isSignUpMode) {
        title.innerText = 'Đăng Ký Tài Khoản';
        submitBtn.innerText = 'Đăng Ký';
        toggleBtn.innerText = 'Đã có tài khoản? Đăng nhập ngay';
    } else {
        title.innerText = 'Đăng Nhập';
        submitBtn.innerText = 'Đăng Nhập';
        toggleBtn.innerText = 'Chưa có tài khoản? Đăng ký ngay';
    }
}

function handleAuth(event) {
    event.preventDefault();
    const user = document.getElementById('auth-user').value.trim();
    const pass = document.getElementById('auth-pass').value.trim();

    if (!user || !pass) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    const users = JSON.parse(localStorage.getItem('app_users') || '{}');

    if (isSignUpMode) {
        if (users[user]) {
            alert('Tài khoản này đã tồn tại!');
            return;
        }
        users[user] = { password: pass, tests: 0, totalScore: 0, accuracy: 0, badges: [] };
        localStorage.setItem('app_users', JSON.stringify(users));
        alert('Đăng ký thành công! Hãy đăng nhập.');
        toggleAuthMode();
    } else {
        if (!users[user] || users[user].password !== pass) {
            alert('Sai tên đăng nhập hoặc mật khẩu!');
            return;
        }
        currentUser = user;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
        renderSubjects();
        updateStatsView();
    }
}

function logout() {
    currentUser = null;
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('auth-form').reset();
}

// ==========================================
// 3. ĐIỀU HƯỚNG TAB & RENDER MÔN HỌC
// ==========================================
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab-study').classList.add('hidden');
    document.getElementById('tab-leaderboard').classList.add('hidden');

    if (tabName === 'study') {
        event.target.classList.add('active');
        document.getElementById('tab-study').classList.remove('hidden');
    } else if (tabName === 'leaderboard') {
        event.target.classList.add('active');
        document.getElementById('tab-leaderboard').classList.remove('hidden');
        renderLeaderboard();
        updateStatsView();
    }
}

function renderSubjects() {
    const grade = document.getElementById('grade-select').value;
    const container = document.getElementById('subject-list');
    container.innerHTML = '';

    const subjects = db[grade];
    for (let key in subjects) {
        const count = subjects[key].length;
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => startQuiz(grade, key);
        card.innerHTML = `
            <h3 style="color: var(--primary); margin-bottom: 8px;">${subjectNames[key]}</h3>
            <p style="color: var(--text-muted);">${count} câu hỏi</p>
        `;
        container.appendChild(card);
    }
}

// ==========================================
// 4. LOGIC BÀI THI TRẮC NGHIỆM (QUIZ)
// ==========================================
function startQuiz(grade, subjectKey) {
    currentQuestions = [...db[grade][subjectKey]];
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);
    timeLeft = 15 * 60;

    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('quiz-title').innerText = `${subjectNames[subjectKey]} - Lớp ${grade}`;

    startTimer();
    renderQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    const timerDisplay = document.getElementById('quiz-timer');

    timerInterval = setInterval(() => {
        timeLeft--;
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        timerDisplay.innerText = `Thời gian: ${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert('Đã hết thời gian làm bài!');
            finishQuiz();
        }
    }, 1000);
}

function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = `Câu ${currentQuestionIndex + 1}/${currentQuestions.length}: ${q.q}`;
    
    // Ẩn hộp gợi ý khi chuyển câu
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('hint-text').innerText = q.hint || "Không có gợi ý cho câu hỏi này.";

    const optionsBox = document.getElementById('options-container');
    optionsBox.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        if (userAnswers[currentQuestionIndex] === opt) {
            btn.classList.add('selected');
        }
        btn.innerText = opt;
        btn.onclick = () => selectOption(opt);
        optionsBox.appendChild(btn);
    });

    const nextBtn = document.getElementById('next-btn');
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerText = 'Nộp Bài';
    } else {
        nextBtn.innerText = 'Câu Tiếp Theo';
    }
}

function selectOption(optionText) {
    userAnswers[currentQuestionIndex] = optionText;
    const buttons = document.querySelectorAll('#options-container .opt-btn');
    buttons.forEach(btn => {
        if (btn.innerText === optionText) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function toggleHint() {
    const hintBox = document.getElementById('hint-box');
    hintBox.classList.toggle('hidden');
}

function submitAnswer() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        if (confirm('Bạn có chắc chắn muốn nộp bài?')) {
            finishQuiz();
        }
    }
}

function finishQuiz() {
    clearInterval(timerInterval);

    let score = 0;
    currentQuestions.forEach((q, index) => {
        if (userAnswers[index] === q.correct) {
            score++;
        }
    });

    const finalScore = ((score / currentQuestions.length) * 10).toFixed(1);
    alert(`Hoàn thành bài thi!\nSố câu đúng: ${score}/${currentQuestions.length}\nĐiểm số: ${finalScore}`);

    // Cập nhật dữ liệu người dùng
    saveUserResult(parseFloat(finalScore));

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    switchTab('leaderboard');
}

// ==========================================
// 5. LƯU THÀNH TÍCH & BẢNG XẾP HẠNG
// ==========================================
function saveUserResult(score) {
    const users = JSON.parse(localStorage.getItem('app_users') || '{}');
    if (!users[currentUser]) return;

    const uData = users[currentUser];
    uData.tests = (uData.tests || 0) + 1;
    uData.totalScore = (uData.totalScore || 0) + score;
    uData.avgScore = parseFloat((uData.totalScore / uData.tests).toFixed(1));

    // Cập nhật huy hiệu danh hiệu
    uData.badges = [];
    if (uData.tests >= 1) uData.badges.push('🥇 Khởi Đầu');
    if (uData.tests >= 5) uData.badges.push('🔥 Chăm Chỉ');
    if (uData.avgScore >= 8.0) uData.badges.push('⭐ Học Sinh Giỏi');

    users[currentUser] = uData;
    localStorage.setItem('app_users', JSON.stringify(users));
}

function updateStatsView() {
    const users = JSON.parse(localStorage.getItem('app_users') || '{}');
    const uData = users[currentUser] || { tests: 0, totalScore: 0, avgScore: 0, badges: [] };

    document.getElementById('user-total-tests').innerText = uData.tests || 0;
    document.getElementById('user-avg-score').innerText = uData.avgScore || '0.0';
    document.getElementById('user-accuracy').innerText = uData.tests ? `${Math.round((uData.avgScore / 10) * 100)}%` : '0%';

    const badgeContainer = document.getElementById('user-badges');
    badgeContainer.innerHTML = '';
    if (uData.badges && uData.badges.length > 0) {
        uData.badges.forEach(b => {
            const span = document.createElement('span');
            span.style.cssText = 'display: inline-block; background: rgba(56,189,248,0.2); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; margin-right: 5px; margin-bottom: 5px;';
            span.innerText = b;
            badgeContainer.appendChild(span);
        });
    } else {
        badgeContainer.innerText = 'Chưa có danh hiệu nào.';
    }
}

function renderLeaderboard() {
    const users = JSON.parse(localStorage.getItem('app_users') || '{}');
    const list = [];

    for (let u in users) {
        list.push({
            name: u,
            avg: users[u].avgScore || 0,
            tests: users[u].tests || 0
        });
    }

    // Sắp xếp giảm dần theo điểm trung bình
    list.sort((a, b) => b.avg - a.avg || b.tests - a.tests);

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    list.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>#${idx + 1}</strong></td>
            <td>${user.name} ${user.name === currentUser ? '<span style="color:var(--primary);">(Tôi)</span>' : ''}</td>
            <td style="color: var(--warning); font-weight: bold;">${user.avg}</td>
            <td>${user.tests}</td>
        `;
        tbody.appendChild(tr);
    });
}