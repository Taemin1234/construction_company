const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { marked } = require('marked');

// upload.js와 동일
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

// 관리자만 접근할 수 있는 미들웨어
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "토큰이 없습니다." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

// 게시물 작성 post
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content, fileUrl } = req.body;

        // 게시물 번호가 가장 최신인 순으로 가져옴
        const latestPost = await Post.findOne().sort({ number: -1 });
        // 존재하는 게시물의 다음번호의 게시물 index / 없으면 1번번
        const nextNumber = latestPost ? latestPost.number + 1 : 1;

        const post = new Post({
            number: nextNumber,
            title,
            content,
            fileUrl,
        });

        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 전체게시물 가져오기
router.get("/", async (req, res) => {
    try {
        // 마지막으로 작성한 순으로 모든 데이터 가져오기(내림차순)
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 조회수 업데이트
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id); // 특정 아이디를 가져와 조회하기
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // ip 값 가져와서 중복 조회수 방지
        let ip;
        try {
            const response = await axios.get("https://api.ipify.org?format=json");
            ip = response.data.ip;
        } catch (error) {
            console.log("IP 주소를 가져오던 중 오류 발생: ", error.message);
            //서버에 문제 생겼을 경우 req에 ip 추가
            ip = req.ip;
        }

        // 브라우저 정보 저장
        const userAgent = req.headers["user-agent"];

        // 조회 후 하루가 지나면 초기화 (1일 1 조회수)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // 
        const hasRecentView = post.viewLogs.some(
            // 로그를 가져와
            (log) =>
                // db에 저장된 ip와 지금 현재 추출한 ip와 동일하고 
                log.ip === ip &&
                // db의 userAgent가 지금 수집한 userAgent와 동일하고
                log.userAgent === userAgent &&
                // 하루가 지났다면
                new Date(log.timestamp) > oneDayAgo
        );

        // 조회수가 1씩 올라가도록 한다.
        if (!hasRecentView) {
            post.views += 1;
            // post.view에 남아있는 로그들을 새로운 값들로 넣어준다.
            post.viewLogs.push({
                ip,
                userAgent,
                timestamp: new Date(),
            });
            await post.save();
        }

        // 마크다운 형식을 html로 변환
        let htmlContent;
        try {
            htmlContent = marked.parse(post.content || '');
        } catch (error) {
            console.error('마크다운 변환 실패:', error);
            htmlContent = post.content;
        }

        // 변환된 html 콘텐츠를 추가
        const responseData = {
            ...post.toObject(),
            renderedContent: htmlContent,
        };

        // 변환이 된 포스트 전달
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});

// 게시글 수정
router.put("/:id", async (req, res) => {
    try {
        // 수정된 요소 가져오기
        const { title, content, fileUrl } = req.body

        // id로 특정 게시물 찾기
        const post = await Post.findById(req.params.id);
        // 없을 경우
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." })
        }

        // 이미지나 첨부파일이 추가/삭제되었을 때
        // 이미지 URL 추출 정규포현식
        const imgRegex = /https:\/\/[^"']*?\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)/g;
        // 기존과 새 콘텐츠에서 이미지 추출
        const oldContentImages = post.content.match(imgRegex) || []; // 기존 이미지 url 추출
        const newContentImages = content.match(imgRegex) || []; //새롭게 포함된 이미지 url 추출

        //삭제할 이미지 및 첨부파일 식별
        //기존 이미지 목록(oldContentImages) 중 새 콘텐츠에 없는 URL들을 필터링하여 삭제 대상으로 식별
        const deletedImages = oldContentImages.filter(url => !newContentImages.includes(url));
        // 기존 첨부파일 목록(post.fileUrl)과 새 첨부파일 목록(fileUrl)을 비교하여, 더 이상 사용되지 않는 파일 URL들을 식별
        const deletedFiles = (post.fileUrl || []).filter(url => !(fileUrl || []).includes(url));


        // 실제 업로드 진행 - S3 객체 키 추출 함수
        const getS3KeyFromUrl = (url) => {
            try {
                //new URL(url)을 사용하여 URL을 파싱
                const urlObj = new URL(url);
                //urlObj.pathname에서 앞의 /를 제거하기 위해 substring(1)을 사용하고, URL 디코딩을 수행
                return decodeURIComponent(urlObj.pathname.substring(1));
            } catch (error) {
                console.error('URL 파싱 에러:', error);
                return null;
            }
        };

        //삭제할 파일 목록 통합 - 앞에서 식별한 삭제할 이미지와 첨부파일 URL을 하나의 배열로 합침
        const allDeletedFiles = [...deletedImages, ...deletedFiles];
        // 반복문을 통한 S3 삭제 작업
        for (const fileUrl of allDeletedFiles) {
            const key = getS3KeyFromUrl(fileUrl);
            if (key) {
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key
                    }));
                    console.log('파일 삭제 완료:', key);
                } catch (error) {
                    console.error('S3 파일 삭제 에러:', error);
                }
            }
        }

        // 원래 저장되어있던 포스트의 타이틀, 컨텐츠, 파일 수정
        post.title = title;
        post.content = content;
        post.fileUrl = fileUrl;
        // 업데이트 된 시간 수정
        post.updatedAt = Date.now();

        await post.save()
        // 클라이언트에 변경된 포스트 보여주기
        res.json(post)

    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
})

// 게시글 삭제
router.delete("/:id", async (req, res) => {
    try {
        // id로 특정 게시물 찾기
        const post = await Post.findById(req.params.id);
        // 없을 경우
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." })
        }

        // 이미지 삭제 코드(내용과 이미지를 구분하여 이미지만 삭제)
        // 일반 내용과 이미지 구분하는 정규식
        const imgRegex = /https:\/\/[^"']*?\.(?:png|jpg|jpeg|gif|PNG|JPG|JPEG|GIF)/g;
        const contentImages = post.content.match(imgRegex) || [];

        const getS3KeyFromUrl = (url) => {
            try {
                const urlObj = new URL(url);
                return decodeURIComponent(urlObj.pathname.substring(1));
            } catch (error) {
                console.error('URL 파싱 에러:', error);
                return null;
            }
        };

        const allFiles = [...contentImages, ...(post.fileUrl || [])];

        for (const fileUrl of allFiles) {
            const key = getS3KeyFromUrl(fileUrl);
            if (key) {
                console.log('삭제할 파일 키:', key);
                try {
                    await s3Client.send(new DeleteObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key
                    }));
                } catch (error) {
                    console.error('S3 파일 삭제 에러:', error);
                }
            }
        }

        await post.deleteOne();
        // 삭제된 게시글 메세지 클라이언트에 알려주기
        res.json({ message: "게시글이 삭제되었습니다다." })

    } catch (error) {
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
})


module.exports = router;