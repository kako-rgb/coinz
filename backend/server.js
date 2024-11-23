const express = require('express');
const mongoose = require('./config/db');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');
const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI,
     { useNewUrlParser: true, useUnifiedTopology: true });
     module.exports = mongoose;