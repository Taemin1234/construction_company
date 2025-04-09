const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const axios = require("axios")
const jwt = require('jsonwebtoken')

router.post("/signup", async (req, res) => { // 회원가입시 post 요청, 회원가입을 알 수 있게 signup, 클라이언트에서 받은 정보를 req에 저장, 클라이언트에 보낼 정보를 res에 저장
    try {
        // 회원가입 진행 시 클라이언트에게서 받은 username과 password를 저장
        const { username, password } = req.body;

        // 위 내용을 mongoDB에서 검색, User 모델 가져오기
        const existingUser = await User.findOne({ username });
        // existingUser가 false라면 통과
        if (existingUser) {
            return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
        }

        //패스워드 암호화 (third party package 사용), 10진수 암호화 진행
        const hashedPassword = await bcrypt.hash(password, 10);

        // 스키마 틀에 맞춰 값 제공
        const user = new User({
            username,
            password: hashedPassword,
        });

        // mongoDB의 기능인 save 함수를 사용해 mongoDB에 저장
        await user.save();
        // 성공코드 : 201
        res.status(201).json({ message: "회원가입이 완료되었습니다." });
    } catch (error) {
        // 서버오류 코드 : 500
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
        console.log(error);
    }
});

// post 요청을 받아 로그인 진행, 비동기로 클라이언트의 request와 response선언
router.post("/login", async (req, res) => {
    try {
        // json(클라이언트)에서 key 값을 가져오기
        const { username, password } = req.body;

        // username이 존재하는 지 확인
        // 보안상 패스워드는 빠져있음
        // 그래서 select로 패스워드도 가져오기
        const user = await User.findOne({ username }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if (!user.isActive) {
            return res
                .status(401)
                .json({ message: "비활성화된 계정입니다. 관리자에게 문의하세요." });
        }

        if (user.isLoggedIn) {
            return res
                .status(401)
                .json({ message: "이미 다른 기기에서 로그인되어 있습니다." });
        }

        //패스워드가 동일한지 확인
        //bcrypt에서 동일한지 확인 (클라이언트로 받은 pw, db에 저장된 pw)
        const isValidPassword = await bcrypt.compare(password, user.password);

        // 검증실패 5번의 기회제공
        if (!isValidPassword) {
            user.failedLoginAttempts += 1;
            user.lastLoginAttempt = new Date();

            //5번 이상 실패했을 때
            if (user.failedLoginAttempts >= 5) {
                //계정 비활성화
                user.isActive = false;
                // 비활성화를 업데이트
                await user.save();
                return res.status(401).json({
                    message: "비밀번호를 5회 이상 틀려 계정이 비활성화되었습니다.",
                });
            }

            // 5번 이하 실패 사항 서버에 저장
            await user.save();
            return res.status(401).json({
                message: "비밀번호가 일치하지 않습니다.",
                remainingAttempts: 5 - user.failedLoginAttempts,
            });
        }

        // 비밀번호 입력에 성공했을 시
        // 시도 횟수, 마지막 로그인 시도는 초기화
        // 중복 로그인 방지를 위해 isLoggedIn을 true로 변경
        user.failedLoginAttempts = 0;
        user.lastLoginAttempt = new Date();
        user.isLoggedIn = true;


        // 로그인을 시도하는 ip 주소의 계정 저장
        try {
            // axios 패키지 사용
            // 아래 주소는 json 형식으로 공인 ip 추출
            const response = await axios.get("https://api.ipify.org?format=json");
            const ipAddress = response.data.ip;

            // ip 업데이트
            user.ipAddress = ipAddress;
        } catch (ipError) {
            console.error("IP 주소를 가져오는 중 오류 발생:", ipError.message);
        }

        // 위 값을 서버에 저장
        await user.save();

        // JWT(json web token) 발급
        // 패키지 설치하기
        // 토큰 발급
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET, // 시크릿 키 생성 (변수 이름으로 설정)
            { expiresIn: "24h" } //JWT 유효기간 설정 (설정 시간 이후 로그아웃)
        );

        // 클라이언트에게 토큰 전달
        // 클라이언트 쿠키에 저장
        res.cookie("token", token, {
            httpOnly: true, //js로는 토큰을 가져오지 못하도록 설정
            secure: false,
            sameSite: "strict",
            maxAge: 24 * 60 * 60 * 1000, // 쿠키에서 토큰이 삭제되는 시간 (24시간)
        });

        // 클라이언트에 서버에서 비밀번호를 빼고 보내기
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        // 클라이언트에게 전송
        res.json({ user: userWithoutPassword });
    } catch (error) {
        console.error("서버 오류:", error.message);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 로그아웃
router.post("/logout", async (req, res) => {
    try {
        // 토큰 추출
        const token = req.cookies.token;

        // 토큰이 없거나 문제가 있으면 로그아웃으로 판단
        if (!token) {
            return res.status(400).json({ message: "이미 로그아웃된 상태입니다." });
        }

        // jwt 검증
        try {
            // db의 토큰 값과 jwt의 키로 인증 결과 저장
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // mongoDB에서 해당 유저의 id를 가져오기
            const user = await User.findById(decoded.userId);

            // 유저가 있다면 해당 유저만 로그아웃
            if (user) {
                user.isLoggedIn = false;
                await user.save();
            }
        } catch (error) {
            console.log("토큰 검증 오류: ", error.message);
        }

        // 쿠키의 토큰 삭제요청(clearCookie)
        res.clearCookie("token", {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
        });

        res.json({ message: "로그아웃되었습니다." });
    } catch (error) {
        console.log("로그아웃 오류: ", error.message);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

//계정 삭제
// post가 아닌 delete 사용
router.delete("/delete/:userId", async (req, res) => { //userId 변수로 받음
    try {
        // findByIdAndDelete 함수 사용(mongoDB에서 스키마 지원)
        const user = await User.findByIdAndDelete(req.params.userId);
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.json({ message: "사용자가 성공적으로 삭제되었습니다." });
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});


// 토큰 인증 코드
router.post("/verify-token", (req, res) => {
    const token = req.cookies.token //쿠키에 저장된 토큰 가져오기

    //토큰이 없을 때
    if (!token) {
        return res.status(400).json({ isValid: false, message: "토큰이 존재하지 않습니다." })
    }

    // 유효한 토큰인지 인증
    try {
        // 유효한 토큰인지 결과 값 저장
        // jwt의 verify 사용 - 토큰, jwt 시크릿 키 가져오기
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({ isValid: true, user: decoded });
    } catch (error) {
        return res.status(401).json({ isValid: false, message: "유효하지 않은 토큰입니다." });
    }
})

module.exports = router;