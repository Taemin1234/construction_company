const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const jwt = require("jsonwebtoken"); // 토큰인증하여 관리지만 할 수 있는 동작 설정


// 토큰 검증 함수(미들웨어)
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    // 토큰이 유효하지 않으면 오류
    if (!token) {
        return res.status(401).json({ message: "토큰이 없습니다." });
    }

    try {
        // 검증결과 저장
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // 다음 함수 실행
        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// post end point를 생성 후 문의 정보를 전달받아 mongoDB에 저장
// 저장은 외부인도 가능하기 때문에 토큰 추가 X
router.post("/", async (req, res) => {
    try {
        const { name, email, phone, message, status } = req.body;

        // 새로운 모델을 구성해주고 클라이언트로부터 받은 데이터를 전달
        const contact = new Contact({
            name,
            email,
            phone,
            message,
            status,
        });

        await contact.save(); //save로 mongoDB에 저장
        res.status(201).json({ message: "문의가 성공적으로 등록되었습니다." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
});

// get 엔드포인트 생성 후 전체 문의를 mongoDB로부터 가져오기
// authenticateToken를 넣어 관리자만 가져올 수 있도록 미들웨어 넣기
router.get("/", authenticateToken, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 }); // -1은 최신순, 1은 오래된순
        res.json(contacts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
});

// get 엔드포인트 생성 후 개별 문의를 mongoDB로부터 가져오기
// 파라미터를 id로 받아 id 값을 조회해서 가져옴
router.get("/:id", async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id); // id로 탐색

        // 글이 없을때
        if (!contact) {
            return res.status(404).json({ message: "문의를 찾을 수 없습니다." });
        }

        res.json(contact);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
});

// PUT 엔드포인트로 상태변경
// id 값을 받아와 수정할 글만 수정
router.put("/:id", async (req, res) => {
    try {
        const { status } = req.body;

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status }, // status 변경
            { new: true } // 업데이트 진행
        );

        // 내용이 없거나 비어있을 때
        if (!contact) {
            return res.status(404).json({ message: "문의를 찾을 수 없습니다." });
        }

        // 메세지를 보내고 결과를 객체로 보냄
        res.json({ message: "문의 상태가 성공적으로 수정되었습니다.", contact });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
});


// 특정 id을 가진 글 삭제
router.delete("/:id", async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: "문의를 찾을 수 없습니다." });
        }
        res.json({ message: "문의가 성공적으로 삭제되었습니다." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "서버 에러가 발생했습니다." });
    }
});

module.exports = router;