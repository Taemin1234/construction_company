const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        number: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        // 파일 첨부 url (배열로 저장)
        fileUrl: {
            type: [String],
            trim: true,
        },
        // 조회수
        views: {
            type: Number,
            default: 0,
        },
        // 조회수 중복 선별 - 접속한 로그 필드
        viewLogs: [{
            ip: String, // ip
            userAgent: String, // 브라우저 속성
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        // 업데이트된 시간
        updatedAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true, // 생성일과 수정일을 자동저장
    }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;