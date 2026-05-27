const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// KẾT NỐI MONGODB LOCAL
const MONGO_URI = 'mongodb://127.0.0.1:27017/nofear_tracker'; 

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ DATABASE MANAGER: ĐÃ KẾT NỐI THÀNH CÔNG ĐẾN CƠ SỞ DỮ LIỆU MONGO DB VĨNH VIỄN'))
  .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// --- SỬA LỖI ĐỊNH DẠNG SCHEMA: Dùng type: Array để chấp nhận mọi cấu trúc Object truyền lên ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  
  // Nâng số dư khởi tạo lên 200 triệu (200,000,000 VND) thay vì 200k để bạn có đủ vốn test các coin giá trị lớn như BTC, ETH
  balanceVND: { type: Number, default: 200000000 }, 
  
  transactions: { type: Array, default: [] }, // FIX LỖI CAST ERROR TẠI ĐÂY
  realAssets: { type: Object, default: {} },
  watchlist: { type: Array, default: ['BTC', 'ETH', 'SOL'] }
});

const User = mongoose.model('User', UserSchema);

// API: ĐĂNG KÝ
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || username.trim().length < 3) return res.status(400).json({ success: false, message: 'Tên tài khoản >= 3 ký tự!' });
    if (!password || password.length < 4) return res.status(400).json({ success: false, message: 'Mật khẩu >= 4 ký tự!' });

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, message: 'Tài khoản đã tồn tại!' });

    const newUser = new User({ username: username.trim(), password });
    await newUser.save();
    return res.json({ success: true, message: 'Đăng ký thành công!' });
  } catch (error) {
    console.error('Lỗi Đăng ký:', error);
    return res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
});

// API: ĐĂNG NHẬP
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.trim().toLowerCase() });

    if (!user || user.password !== password) return res.status(400).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });

    return res.json({ 
      success: true, 
      user: {
        username: user.username,
        balanceVND: user.balanceVND,
        transactions: user.transactions,
        realAssets: user.realAssets || {},
        watchlist: user.watchlist
      }
    });
  } catch (error) {
    console.error('Lỗi Đăng nhập:', error);
    return res.status(500).json({ success: false, message: 'Lỗi Server' });
  }
});

// API: ĐỒNG BỘ DỮ LIỆU
app.post('/api/sync-portfolio', async (req, res) => {
  try {
    const { username, balanceVND, transactions, realAssets, watchlist } = req.body;
    
    // Đã fix cảnh báo vàng Deprecated của Mongoose bằng cách thay thế "new: true" thành "returnDocument: 'after'"
    const updatedUser = await User.findOneAndUpdate(
      { username: username.toLowerCase() },
      { $set: { balanceVND, transactions, realAssets, watchlist } },
      { returnDocument: 'after' } 
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });

    return res.json({ success: true, message: 'Đồng bộ thành công!' });
  } catch (error) {
    console.error('Lỗi sập luồng Đồng bộ:', error);
    return res.status(500).json({ success: false, message: 'Lỗi ghi dữ liệu' });
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`================================================================`);
  console.log(`✓ BACKEND SERVER HOẠT ĐỘNG TẠI CỔNG 0.0.0.0:${PORT}`);
  console.log(`================================================================`);
});