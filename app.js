let currentUser = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 0;

// 1. DỰ PHÒNG & TỰ ĐỘNG SAO LƯU TRÊN LOCALSTORAGE
function getStorageData() {
    return JSON.parse(localStorage.getItem('app_data_v2') || '{"users":{}}');
}

function autoSaveData(data) {
    localStorage.setItem('app_data_v2', JSON.stringify(data));
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-user').value.trim();
    if(!username) return;

    currentUser = username;
    const data = getStorageData();
    if(!data.users[currentUser]) {
        data.users[currentUser] = { tests: 0, totalScoreConverted: 0, avgScore: 0 };
        autoSaveData(data);
    }

    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    renderSubjects();
}

function logout() {
    currentUser = null;
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
}

// Export / Import Sao Lưu
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(getStorageData()));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hoc_tap_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importData(e) {
    const fileReader = new FileReader();
    fileReader.onload = function (event) {
        try {
            const importedData = JSON.parse(event.target.result);
            autoSaveData(importedData);
            alert("Khôi phục dữ liệu sao lưu thành công!");
            renderLeaderboard();
        } catch (err) { alert("File sao lưu không hợp lệ!"); }
    };
    fileReader.readAsText(e.target.files[0]);
}

// 2. RENDER VÀ LUYỆN TẬP
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
        renderLeaderboard();
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
        card.innerHTML = `<h3 style="color:var(--primary);">${subjectNames[key] || key}</h3><p style="font-size:0.85rem;">${subjects[key].length} câu khả dụng</p>`;
        container.appendChild(card);
    }
}

function startQuiz(grade, subjectKey) {
    const allQ = db[grade][subjectKey] || [];
    if(allQ.length === 0) return alert("Môn này chưa có câu hỏi!");

    const countOption = document.getElementById('question-count-select').value;
    let limit = countOption === 'all' ? allQ.length : parseInt(countOption);
    
    // Trộn ngẫu nhiên câu hỏi
    let shuffled = [...allQ].sort(() => 0.5 - Math.random());
    currentQuestions = shuffled.slice(0, Math.min(limit, allQ.length));
    
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);
    timeLeft = currentQuestions.length * 90; // 90 giây cho mỗi câu

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

// Render giao diện phù hợp với từng dạng câu hỏi (MC, Essay, TF)
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
            btn.className = `opt-btn ${userAnswers[currentQuestionIndex] === opt ? 'selected' : ''}`;
            btn.innerText = opt;
            btn.onclick = () => { userAnswers[currentQuestionIndex] = opt; renderQuestion(); };
            box.appendChild(btn);
        });
    } else if (q.type === 'essay') {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập đáp án của bạn tại đây...';
        input.value = userAnswers[currentQuestionIndex] || '';
        input.oninput = (e) => { userAnswers[currentQuestionIndex] = e.target.value; };
        box.appendChild(input);
    } else if (q.type === 'tf') {
        if (!userAnswers[currentQuestionIndex]) userAnswers[currentQuestionIndex] = {};
        const tfContainer = document.createElement('div');
        tfContainer.className = 'tf-container';

        q.items.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = 'tf-row';
            const val = userAnswers[currentQuestionIndex][idx];
            row.innerHTML = `
                <span>${idx + 1}) ${item.text}</span>
                <div class="tf-btn-group">
                    <button class="tf-btn ${val === true ? 'active-true' : ''}" onclick="setTFAnswer(${idx}, true)">Đúng</button>
                    <button class="tf-btn ${val === false ? 'active-false' : ''}" onclick="setTFAnswer(${idx}, false)">Sai</button>
                </div>
            `;
            tfContainer.appendChild(row);
        });
        box.appendChild(tfContainer);
    }

    document.getElementById('next-btn').innerText = (currentQuestionIndex === currentQuestions.length - 1) ? 'Nộp Bài' : 'Câu Tiếp Theo';
}

function setTFAnswer(itemIdx, value) {
    userAnswers[currentQuestionIndex][itemIdx] = value;
    renderQuestion();
}

function toggleHint() { document.getElementById('hint-box').classList.toggle('hidden'); }

function submitAnswer() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        if (confirm("Bạn muốn nộp bài chứ?")) finishQuiz();
    }
}

// 3. CHẤM ĐIỂM, XEM LẠI ĐÁP ÁN & CẬP NHẬT BXH
function finishQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0;

    currentQuestions.forEach((q, i) => {
        const uAns = userAnswers[i];
        if (!q.type || q.type === 'mc') {
            if (uAns === q.correct) correctCount++;
        } else if (q.type === 'essay') {
            if (uAns && uAns.trim().toLowerCase() === q.correct.trim().toLowerCase()) correctCount++;
        } else if (q.type === 'tf') {
            let fullCorrect = true;
            q.items.forEach((item, idx) => {
                if (!uAns || uAns[idx] !== item.ans) fullCorrect = false;
            });
            if (fullCorrect) correctCount++;
        }
    });

    // Quy đổi về thang điểm 10 chuẩn hóa cho BXH
    const score10 = parseFloat(((correctCount / currentQuestions.length) * 10).toFixed(1));

    // Cập nhật dữ liệu Local
    const data = getStorageData();
    const u = data.users[currentUser];
    u.tests += 1;
    u.totalScoreConverted += score10;
    u.avgScore = parseFloat((u.totalScoreConverted / u.tests).toFixed(1));
    autoSaveData(data);

    // Mở màn hình xem lại bài làm
    showReviewScreen(correctCount, score10);
}

function showReviewScreen(correctCount, score10) {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('review-screen').classList.remove('hidden');

    document.getElementById('review-summary').innerHTML = `
        Kết quả: <strong>${correctCount}/${currentQuestions.length}</strong> câu đúng.<br>
        Điểm quy đổi (Thang 10): <strong style="color:var(--warning); font-size:1.4rem;">${score10}</strong>
    `;

    const list = document.getElementById('review-list');
    list.innerHTML = '';

    currentQuestions.forEach((q, i) => {
        const card = document.createElement('div');
        const uAns = userAnswers[i];
        let isCorrect = false;
        let displayCorrect = q.correct;

        if (!q.type || q.type === 'mc') {
            isCorrect = (uAns === q.correct);
        } else if (q.type === 'essay') {
            isCorrect = (uAns && uAns.trim().toLowerCase() === q.correct.trim().toLowerCase());
        } else if (q.type === 'tf') {
            isCorrect = q.items.every((item, idx) => uAns && uAns[idx] === item.ans);
            displayCorrect = q.items.map(it => `${it.text}: [${it.ans ? 'Đúng' : 'Sai'}]`).join('<br>');
        }

        card.className = `review-card ${isCorrect ? 'correct' : 'wrong'}`;
        card.innerHTML = `
            <div><strong>Câu ${i + 1}: ${q.q}</strong></div>
            <div style="margin-top:5px; font-size:0.9rem;">
                Bạn chọn: <span style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'}">
                ${q.type === 'tf' ? JSON.stringify(uAns || {}) : (uAns || 'Chưa trả lời')}</span>
            </div>
            ${!isCorrect ? `<div style="margin-top:5px; font-size:0.9rem; color:var(--primary);">Đáp án đúng:<br>${displayCorrect}</div>` : ''}
        `;
        list.appendChild(card);
    });
}

function exitReview() {
    document.getElementById('review-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    switchTab('study');
}

function renderLeaderboard() {
    const data = getStorageData();
    const list = [];
    for (let name in data.users) {
        list.push({ name, avg: data.users[name].avgScore, tests: data.users[name].tests });
    }
    list.sort((a, b) => b.avg - a.avg);

    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    list.forEach((u, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td>${u.name} ${u.name === currentUser ? '(Tôi)' : ''}</td>
            <td style="color:var(--warning); font-weight:bold;">${u.avg}</td>
            <td>${u.tests}</td>
        `;
        tbody.appendChild(tr);
    });
}
