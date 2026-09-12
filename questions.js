/**
 * Danh sách tên các môn học (Bao gồm môn đặc biệt)
 */
const subjectNames = {
    "math": "Môn Toán",
    "physics": "Vật Lý",
    "chemistry": "Hóa Học",
    "biology": "Sinh Học",
    "literature": "Ngữ Văn",
    "english": "Tiếng Anh",
    "gddp_soctrang": "GDĐP Sóc Trăng",
    "technology": "Công Nghệ",
    "informatics": "Tin Học",
    "arg_cipher": "🔑 Giải Mã & ARG (Cơ Bản -> Chuyên Gia)"
};

// Hàm hỗ trợ tự động sinh từ 50 đến 100 câu hỏi cho mỗi môn
function buildQuestionDatabase() {
    const database = {};
    const grades = ["6", "7", "8", "9"];
    const subKeys = Object.keys(subjectNames);

    grades.forEach(grade => {
        database[grade] = {};
        subKeys.forEach(sub => {
            database[grade][sub] = [];
            
            // 1. Nếu là Môn GIẢI MÃ ARG (Cấu trúc phân tầng từ Cơ bản tới Chuyên gia)
            if (sub === 'arg_cipher') {
                for (let i = 1; i <= 50; i++) {
                    if (i <= 15) { // CƠ BẢN
                        database[grade][sub].push({
                            type: 'essay',
                            q: `[ARG Cơ Bản #${i}] Giải mã Caeser (Shift +1): Từ "${String.fromCharCode(65+i)}" dịch sang phải 1 bước là chữ gì?`,
                            correct: String.fromCharCode(66+i),
                            hint: "Dịch chuyển bảng chữ cái tiếng Anh sang phải 1 đơn vị."
                        });
                    } else if (i <= 35) { // TRUNG CẤP
                        database[grade][sub].push({
                            type: 'mc',
                            q: `[ARG Trung Cấp #${i}] Hệ nhị phân 8-bit (Binary) nào biểu diễn số ${i}?`,
                            options: [(i).toString(2).padStart(8, '0'), (i+1).toString(2).padStart(8, '0'), (i+2).toString(2).padStart(8, '0'), (i+3).toString(2).padStart(8, '0')],
                            correct: (i).toString(2).padStart(8, '0'),
                            hint: "Chuyển đổi số thập phân sang nhị phân 8 bit."
                        });
                    } else { // CHUYÊN GIA
                        database[grade][sub].push({
                            type: 'essay',
                            q: `[ARG Chuyên Gia #${i}] Giải mã Hexadecimal: Giá trị thập phân của số Hex 0x${i.toString(16).toUpperCase()} là bao nhiêu?`,
                            correct: i.toString(),
                            hint: "Chuyển đổi từ hệ cơ số 16 (Hex) về hệ 10."
                        });
                    }
                }
            }
            // 2. Môn GDĐP SÓC TRĂNG
            else if (sub === 'gddp_soctrang') {
                for (let i = 1; i <= 50; i++) {
                    database[grade][sub].push({
                        type: 'mc',
                        q: `[Sóc Trăng #${i}] Lễ hội đặc trưng nào của người Khmer ở Sóc Trăng thường tổ chức đua ghe Ngo?`,
                        options: ["Lễ hội Ôk Om Bók", "Lễ Chôl Chnăm Thmây", "Lễ Sen Đôn-ta", "Lễ Kỳ Yên"],
                        correct: "Lễ hội Ôk Om Bók",
                        hint: "Lễ hội cúng mặt trăng diễn ra vào rằm tháng 10 Âm lịch."
                    });
                }
            }
            // 3. Các môn học tiêu chuẩn còn lại
            else {
                for (let i = 1; i <= 50; i++) {
                    database[grade][sub].push({
                        type: 'mc',
                        q: `[${subjectNames[sub]} Lớp ${grade} - Câu ${i}] Câu hỏi luyện tập tự động số ${i}?`,
                        options: [`Đáp án đúng A${i}`, `Đáp án B${i}`, `Đáp án C${i}`, `Đáp án D${i}`],
                        correct: `Đáp án đúng A${i}`,
                        hint: `Gợi ý lý thuyết ôn tập cho câu ${i}.`
                    });
                }
            }
        });
    });

    return database;
}

const db = buildQuestionDatabase();
