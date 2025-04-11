const mongoose = require("mongoose"); //mongoDB에 관려된 패키시 함수 사용하기 위해 불러옴

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['in progress', 'pending', 'completed'], // 배열로 셋중하나만 선택
            default: 'in progress', // 최초 값
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

const Contact = mongoose.model("Contact", contactSchema); // 모델명 : Contact , 인자값 전달

module.exports = Contact;
