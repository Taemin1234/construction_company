require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser");
const cors = require("cors")
const app = express();
const PORT = 3000;

const userRoutes = require("./routes/user")

app.use(cors({
    origin: "http://localhost:5173", // 프론트엔드 주소
    credentials: true, // 쿠기 허용 옵션
}));

// express서버에서 json을 받았지만 json을 해석할 수 없어 해석할 수 있게 하는 코드
// 라우팅 하기 전에 입력
app.use(express.json())
app.use(express.urlencoded())

// 쿠키를 읽는 기능을 express에서 사용가능
app.use(cookieParser());

app.use("/api/auth", userRoutes);

app.get('/', (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT, () => {
    console.log('Server is running')
})

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((error) => console.log('Failed to connect to MongoDB', error));