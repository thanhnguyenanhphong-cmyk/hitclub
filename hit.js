const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = 'https://weighted-weapon-spiritual-oklahoma.trycloudflare.com/api/txmd5';

// Mảng lưu trữ lịch sử tối đa 1000 phiên
let history = [];
// Biến lưu trữ phiên mới nhất vừa lấy về
let latestData = null;

// Hàm gọi API và xử lý dữ liệu
async function fetchAndProcessData() {
    try {
        const response = await axios.get(API_URL);
        const data = response.data;

        if (data && data.phien) {
            // Kiểm tra nếu phiên này đã tồn tại trong lịch sử thì bỏ qua (tránh trùng lặp)
            const isDuplicate = history.some(item => item.phien === data.phien);
            if (!isDuplicate) {
                // Tạo một bản sao và xóa 2 trường theo yêu cầu
                const cleanedData = { ...data };
                delete cleanedData.md5_dec;
                delete cleanedData.thoi_gian;

                // Cập nhật dữ liệu mới nhất
                latestData = cleanedData;

                // Thêm vào đầu mảng lịch sử
                history.unshift(cleanedData);

                // Giới hạn lịch sử chỉ giữ lại tối đa 1000 phiên gần nhất
                if (history.length > 1000) {
                    history.pop(); // Xóa phiên cũ nhất ở cuối mảng
                }
                
                console.log(`[${new Date().toLocaleTimeString()}] Đã lưu phiên mới: ${cleanedData.phien}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khi gọi hoặc xử lý dữ liệu API:', error.message);
    }
}

// Tự động gọi API mỗi 2 giây một lần để kiểm tra phiên mới
setInterval(fetchAndProcessData, 2000);

// Endpoint 1: Xem toàn bộ lịch sử 1000 phiên (Truy cập: http://localhost:3000/history)
app.get('/history', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(history);
});

// Endpoint 2: Xem duy nhất phiên mới nhất (Truy cập: http://localhost:3000/)
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(latestData || { message: "Đang khởi tạo dữ liệu, vui lòng ép F5 tải lại trang..." });
});

// Khởi chạy server ở cổng 3000
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Server đang chạy tại đường dẫn: http://localhost:${PORT}`);
    console.log(`Xem lịch sử 1000 phiên tại: http://localhost:${PORT}/history`);
    console.log(`==================================================`);
    // Chạy lượt quét đầu tiên ngay khi mở server
    fetchAndProcessData();
});