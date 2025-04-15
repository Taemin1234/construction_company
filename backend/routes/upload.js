// PutObjectCommand : S3 버킷에 객체(파일)를 업로드하는 명령어로, 실제 파일 데이터를 S3에 전송
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
// uuidv4: UUID 버전 4를 생성하는 함수로, 무작위로 생성
const { v4: uuidv4 } = require('uuid');
const router = require('express').Router();

// S3Client : AWS S3 서비스와 통신하기 위한 클라이언트를 생성(업로드, 다운로드 수행) 
const s3Client = new S3Client({
    region: process.env.AWS_REGION, // 지역 담기
    // 엑세스 키
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// 저장공간, 용량 설정
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 //5mb제한
    }
});

const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 //50mb 제한
    }
});

// 토큰 인증 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: '인증되지 않은 요청입니다.' });
    }
    next();
};

// 이미지 업로드 엔드포인트
router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const file = req.file; //클라이언트에서 보낸 파일 받기
        const fileExtension = file.originalname.split('.').pop(); //확장자 추출
        const fileName = `${uuidv4()}.${fileExtension}`; //파일일명이 중복되지 않게 설정

        // s3 버컷 이미지 업로드를 위한 파라미터 구성 (json으로 작성)
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME, // 버킷 이름 작성
            Key: `post-images/${fileName}`, // 버킷 내부 폴더에 저장
            Body: file.buffer, // 파일 버퍼 크기 입력
            ContentType: file.mimetype, // 콘텐츠 타입 설정
        };

        // 버킷에다가 업로드해주는 커맨드
        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // 업로드된 파일의 경로 설정
        const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-images/${fileName}`;
        res.json({ imageUrl }); //클라이언트에 url 전달
    } catch (error) {
        console.error('S3 upload error:', error);
        res.status(500).json({ error: "Failed to upload image" });
    }
});

// 파일 업로드 엔드포인트
router.post('/file', verifyToken, fileUpload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const originalName = req.body.originalName; // 원본 파일 이름 보존
        const decodedFileName = decodeURIComponent(originalName); // 인코딩 상태를 디코딩딩

        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `post-files/${decodedFileName}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            // 첨부파일에 대한 내용 명시 - 다시 인코딩
            ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(decodedFileName)}`,
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/post-files/${decodedFileName}`;
        res.json({
            fileUrl,
            originalName: decodedFileName
        });
    } catch (error) {
        console.error('S3 upload error:', error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

module.exports = router;