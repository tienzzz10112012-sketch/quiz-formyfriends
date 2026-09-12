// ==========================================
// 1. CẤU HÌNH FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCPeganWPl0YKBL6gccnlJniYn7OLFY5M4",
  authDomain: "appontap-ae318.firebaseapp.com",
  projectId: "appontap-ae318",
  storageBucket: "appontap-ae318.firebasestorage.app",
  messagingSenderId: "1048552244725",
  appId: "1:1048552244725:web:48c4c68b16abf825574cbc",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const dbStore = firebase.firestore();

let currentUser = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 0;
let isSignUpMode = false;

// Tự động lắng nghe trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
    if (user) {
        // Lấy dữ liệu user từ Firestore
        dbStore.collection("users").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                currentUser = doc.data();
                currentUser.uid = user.uid;
                loginSuccess();
            } else {
                // Nếu chưa có profile trong Firestore, tạo mới
                const displayName = user.displayName || user.email.split('@')[0];
                const newUser = {
                    username: displayName,
                    tests: 0,
                    totalScoreConverted: 0,
                    avgScore: 0
                };
                dbStore.collection("users").doc(user.uid).set(newUser).then(() => {
                    currentUser = newUser;
                    currentUser.uid = user.uid;
                    loginSuccess();
                });
            }
        });
    }
});

// ==========================================
// 2. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ BẰNG FIREBASE AUTH
// ==========================================
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    document.getElementById('auth-title').innerText = isSignUpMode ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập';
    document.getElementById('auth-submit-btn').innerText = isSignUpMode ? 'Đăng Ký' : 'Đăng Nhập';
    document.getElementById('auth-toggle-btn').innerText = isSignUpMode ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay';
}

function handleAuth(e) {
    if (e) e.preventDefault();

    const userInput = document.getElementById('auth-user').value.trim();
    const password = document.getElementById('auth-pass').value.trim();

    if (!userInput || !password) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return false;
    }

    if (password.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên!");
        return false;
    }

    // Nếu nhập tên thường, chuyển thành email ảo hệ thống để qua Firebase Auth
    let email = userInput;
    if (!userInput.includes('@')) {
        const cleanName = userInput.toLowerCase().replace(/[^a-z0-9@!\-_]/g, '_');
        email = `${cleanName}@system.app`;
    }

    if (isSignUpMode) {
        // Đăng ký qua Firebase Auth
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const uid = userCredential.user.uid;
                return dbStore.collection("users").doc(uid).set({
                    username: userInput.includes('@') ? userInput.split('@')[0] : userInput,
                    tests: 0,
                    totalScoreConverted: 0,
                    avgScore: 0
                });
            })
            .then(() => {
                alert("Đăng ký thành công!");
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    alert("Tên tài khoản/Email này đã được sử dụng!");
                } else {
                    alert("Lỗi đăng ký: " + error.message);
                }
            });
    } else {
        // Đăng nhập qua Firebase Auth
        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => {
                alert("Đăng nhập thất bại: Sai tài khoản hoặc mật khẩu!");
            });
    }

    return false;
}

// Đăng nhập bằng tài khoản Google
function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
        alert("Lỗi đăng nhập Google: " + error.message);
    });
}

function loginSuccess() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('user-display').innerText = currentUser.username;
    renderSubjects();
}

function logout() {
    auth.signOut().then(() => {
        currentUser = null;
        document.getElementById('main-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('review-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    });
}

// ==========================================
// 3. ĐIỀU HƯỚNG & LUYỆN TẬP
// ==========================================
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-study').classList.add('hidden');
    document.getElementById('tab-leaderboard').classList.add('hidden');

    if (tab === 'study') {
        event.target.classList.add('active');
        document.getElementById('tab-study').classList.remove('hidden');
    } else {
        event.target.classList.add('active');
        document.getElementById('tab-leaderboard').classList.remove('hidden');
        renderGlobalLeaderboard();
    }
}

function renderSubjects() {
    const grade = document.getElementById('grade-select').value;
    const container = document.getElementById('subject-list');
    container.innerHTML = '';
    const subjects = db[grade] || {};

    for (let key in subjects) {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.onclick = () => startQuiz(grade, key);
        card.innerHTML = `<h3 style="color:var(--primary);">${subjectNames[key]}</h3><p style="font-size:0.85rem;">${subjects[key].length} câu ngân hàng</p>`;
        container.appendChild(card);
    }
}

function startQuiz(grade, subjectKey) {
    const allQ = db[grade][subjectKey] || [];
    const countOption = parseInt(document.getElementById('question-count-select').value);
    
    let shuffled = [...allQ].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(countOption, allQ.length));
    
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);
    timeLeft = currentQuestions.length * 90;

    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    document.getElementById('quiz-title').innerText = `${subjectNames[subjectKey]} (${currentQuestions.length} câu)`;

    startTimer();
    renderQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    const timerDisplay = document.getElementById('quiz-timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        timerDisplay.innerText = `${m < 10 ? '0':''}${m}:${s < 10 ? '0':''}${s}`;
        if(timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(); }
    }, 1000);
}

function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    document.getElementById('question-text').innerText = `Câu ${currentQuestionIndex + 1}/${currentQuestions.length}: ${q.q}`;
    document.getElementById('hint-box').classList.add('hidden');
    document.getElementById('hint-text').innerText = q.hint || "Không có gợi ý.";

    const box = document.getElementById('answer-box');
    box.innerHTML = '';

    if (!q.type || q.type === 'mc') {
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `opt-btn ${userAnswers[currentQuestionIndex] === opt ? 'selected' : ''}`;
            btn.innerText = opt;
            btn.onclick = () => { userAnswers[currentQuestionIndex] = opt; renderQuestion(); };
            box.appendChild(btn);
        });
    } else if (q.type === 'essay') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập kết quả giải mã / đáp án...';
        input.value = userAnswers[currentQuestionIndex] || '';
        input.oninput = (e) => { userAnswers[currentQuestionIndex] = e.target.value; };
        box.appendChild(input);
    }

    document.getElementById('next-btn').innerText = (currentQuestionIndex === currentQuestions.length - 1) ? 'Nộp Bài' : 'Câu Tiếp Theo';
}

function toggleHint() { document.getElementById('hint-box').classList.toggle('hidden'); }

function submitAnswer() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        if (confirm("Xác nhận nộp bài?")) finishQuiz();
    }
}

// ==========================================
// 4. CHẤM ĐIỂM & ĐỒNG BỘ BẢNG XẾP HẠNG REALTIME
// ==========================================
function finishQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0;

    currentQuestions.forEach((q, i) => {
        const uAns = userAnswers[i];
        if (!q.type || q.type === 'mc') {
            if (uAns === q.correct) correctCount++;
        } else if (q.type === 'essay') {
            if (uAns && uAns.trim().toLowerCase() === q.correct.trim().toLowerCase()) correctCount++;
        }
    });

    const score10 = parseFloat(((correctCount / currentQuestions.length) * 10).toFixed(1));

    const userRef = dbStore.collection("users").doc(currentUser.uid);
    dbStore.runTransaction((transaction) => {
        return transaction.get(userRef).then((sfDoc) => {
            if (!sfDoc.exists) return;
            const newTests = (sfDoc.data().tests || 0) + 1;
            const newTotal = (sfDoc.data().totalScoreConverted || 0) + score10;
            const newAvg = parseFloat((newTotal / newTests).toFixed(1));

            transaction.update(userRef, {
                tests: newTests,
                totalScoreConverted: newTotal,
                avgScore: newAvg
            });
        });
    }).then(() => {
        showReviewScreen(correctCount, score10);
    }).catch(err => alert("Lỗi lưu điểm: " + err.message));
}

function showReviewScreen(correctCount, score10) {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');

    document.getElementById('review-summary').innerHTML = `
        Số câu đúng: <strong>${correctCount}/${currentQuestions.length}</strong><br>
        Điểm số (Thang 10): <strong style="color:var(--warning); font-size:1.4rem;">${score10}</strong>
    `;

    const list = document.getElementById('review-list');
    list.innerHTML = '';

    currentQuestions.forEach((q, i) => {
        const card = document.createElement('div');
        const uAns = userAnswers[i];
        let isCorrect = (!q.type || q.type === 'mc') ? (uAns === q.correct) : (uAns && uAns.trim().toLowerCase() === q.correct.trim().toLowerCase());

        card.className = `review-card ${isCorrect ? 'correct' : 'wrong'}`;
        card.innerHTML = `
            <div><strong>Câu ${i + 1}: ${q.q}</strong></div>
            <div style="margin-top:5px; font-size:0.9rem;">Bạn làm: <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">${uAns || 'Bỏ trống'}</span></div>
            ${!isCorrect ? `<div style="margin-top:5px; font-size:0.9rem; color:var(--primary);">Đáp án đúng: ${q.correct}</div>` : ''}
        `;
        list.appendChild(card);
    });
}

function exitReview() {
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    switchTab('study');
}

function renderGlobalLeaderboard() {
    dbStore.collection("users").orderBy("avgScore", "desc").limit(20).get()
        .then((querySnapshot) => {
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = '';
            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>#${rank++}</td>
                    <td>${data.username} ${currentUser && data.username === currentUser.username ? '(Tôi)' : ''}</td>
                    <td style="color:var(--warning); font-weight:bold;">${data.avgScore}</td>
                    <td>${data.tests}</td>
                `;
                tbody.appendChild(tr);
            });
        }).catch(err => console.log("Lỗi tải BXH: ", err));
}
