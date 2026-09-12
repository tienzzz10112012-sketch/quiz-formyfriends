/**
 * Dạng câu hỏi hỗ trợ:
 * 1. type: 'mc'    -> Trắc nghiệm 4 đáp án (options: [...], correct: "chuỗi đáp án")
 * 2. type: 'essay' -> Tự luận ngắn (correct: "đáp án đúng dạng chữ/số")
 * 3. type: 'tf'    -> Đúng / Sai 4 ý (items: [{text: "", ans: true/false}])
 */
const db = {
    "6": {
        "math": [
            { type: 'mc', q: "Tập hợp N* bao gồm các số nào?", options: ["Các số tự nhiên khác 0", "Các số nguyên", "Các số tự nhiên bao gồm 0", "Số âm"], correct: "Các số tự nhiên khác 0", hint: "N* là tập hợp số tự nhiên không chứa số 0." },
            { type: 'essay', q: "Kết quả của phép tính 2³ + 5 là bao nhiêu?", correct: "13", hint: "2³ = 8, 8 + 5 = 13." },
            { 
                type: 'tf', 
                q: "Xét tính đúng/sai của các phát biểu sau về số nguyên tố:", 
                items: [
                    { text: "Số 2 là số nguyên tố chẵn duy nhất.", ans: true },
                    { text: "Mọi số lẻ đều là số nguyên tố.", ans: false },
                    { text: "Số 1 là số nguyên tố.", ans: false },
                    { text: "Số 5 là số nguyên tố.", ans: true }
                ],
                hint: "Số nguyên tố là số lớn hơn 1 và chỉ có 2 ước là 1 và chính nó."
            }
        ]
    },
    "7": {
        "math": [
            { type: 'essay', q: "Giá trị tuyệt đối của -7.5 là bao nhiêu?", correct: "7.5", hint: "|-x| = x." },
            { type: 'mc', q: "Tổng ba góc trong một tam giác bằng bao nhiêu độ?", options: ["180°", "90°", "360°", "120°"], correct: "180°", hint: "Định lý tổng 3 góc tam giác." }
        ]
    },
    "8": {
        "math": [
            { type: 'mc', q: "Khai triển (x - y)² ta được:", options: ["x² - 2xy + y²", "x² - y²", "x² + 2xy + y²", "x² + y²"], correct: "x² - 2xy + y²", hint: "Bình phương một hiệu." },
            { type: 'essay', q: "Nghiệm của phương trình 3x - 9 = 0 là x =", correct: "3", hint: "Chuyển 9 sang vế phải rồi chia 3." }
        ]
    },
    "9": {
        "math": [
            { type: 'essay', q: "Căn bậc hai số học của 81 là bao nhiêu?", correct: "9", hint: "9 * 9 = 81." },
            { 
                type: 'tf', 
                q: "Khẳng định đúng/sai về phương trình bậc hai ax² + bx + c = 0 (a ≠ 0):", 
                items: [
                    { text: "Nếu Δ > 0 thì phương trình có 2 nghiệm phân biệt.", ans: true },
                    { text: "Nếu Δ = 0 thì phương trình vô nghiệm.", ans: false },
                    { text: "Nếu Δ < 0 thì phương trình vô nghiệm.", ans: true },
                    { text: "Biệt thức Delta được tính theo công thức Δ = b² - 4ac.", ans: true }
                ],
                hint: "Xem lại công thức và ý nghĩa của Δ."
            }
        ]
    }
};

const subjectNames = { "math": "Môn Toán", "physics": "Vật Lý", "chemistry": "Hóa Học", "english": "Tiếng Anh", "literature": "Ngữ Văn" };
