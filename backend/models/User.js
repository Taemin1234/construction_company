const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true, //필수적으로 입력
            trim: true, //저장 시 공백 삭제
            minLength: 2, //최소길이
            maxLength: 30, //최대길이
        },
        password: {
            type: String,
            required: true,
            select: false,//query 결과가 포함 x(보안 상 이유로 비밀번호는 조회되지 않게 하기)
        },
        isLoggedIn: {//최초 로그인 시 true로 바꾸고 누군가 같은 id로 로그인을 시도했을때 true라면 로그인 막기, 로그아웃시 false로 변경
            type: Boolean,
            default: false,
        },
        isActive: { // 비밀번호 몇회 오류시 계정 잠김 등 수행 (값이 false 로 바뀜)
            type: Boolean,
            default: true,
        },
        failedLoginAttempts: {//틀린 횟수 저장
            type: Number,
            default: 0,
        },
        lastLoginAttempt: { //로그인 시도 기록 
            type: Date,
        },
        ipAddress: { // 보안을 위해 ip 주소 수집
            type: String,
        },
        createdAt: {//회원가입한 시간
            type: Date,
            default: Date.now,
        }
    },
    {//계정의 필드 값이 생성되거나 수정되었을 때 시간데이터를 생성해서 저장
        timestamps: true,
    }
)
const User = mongoose.model("User", userSchema);

module.exports = User;