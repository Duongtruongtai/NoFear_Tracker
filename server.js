const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://duongtruongtailhu:Anhtai123@cluster0.czms6.mongodb.net/nofear_tracker?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ DATABASE CLOUD: ĐÃ KẾT NỐI THÀNH CÔNG'))
  .catch(err => console.log('Lỗi kết nối DB:', err));

// Schema User (Ví dụ cơ bản cho hệ thống)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balanceVND: { type: Number, default: 200000000 },
  transactions: { type: Array, default: [] },
  realAssets: { type: Object, default: {} },
  watchlist: { type: Array, default: ['BTC', 'ETH', 'SOL'] }
});

const User = mongoose.model('User', UserSchema);

// API Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu!' });
  }
});

// API Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.json({ success: true, message: 'Khởi tạo ví thành công!' });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Tài khoản đã tồn tại!' });
  }
});

// API Sync Data
app.post('/api/sync-portfolio', async (req, res) => {
  const { username, balanceVND, transactions, realAssets, watchlist } = req.body;
  await User.findOneAndUpdate({ username }, { balanceVND, transactions, realAssets, watchlist });
  res.json({ success: true });
});

// CẤU HÌNH PORT ĐỘNG CHO RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ BACKEND SERVER HOẠT ĐỘNG TẠI CỔNG ${PORT}`);
});