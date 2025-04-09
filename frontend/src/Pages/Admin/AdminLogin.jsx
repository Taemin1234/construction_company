import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value, // input에 지정한 name과 value 값
        });

        console.log(formData);
    };

    const handleSubmit = async (e) => { // 비동기 지원 필요 - async
        e.preventDefault(); // 기본 제출 동작(새로고침)을 막고 비동기적으로 서버에 제출

        // 에러에 대처
        try {
            // 로그인 후 post 요청을 보냈을 때 받는 결과 값을 저장
            const response = await axios.post( //axios의 post 활용
                "http://localhost:3000/api/auth/login",
                formData, // 인자값 전송
                {
                    withCredentials: true, // 프론트 - 백엔드 간 쿠키값 전달 옵션 허용
                }
            );

            // 로그인 성공시 admin/posts로 이동
            if (response.data.user) {
                navigate("/admin/posts");
            }
        } catch (error) {
            const errorMessage =
                error.response.data.message || "로그인에 실패했습니다.";
            const remainingAttempts = error.response.data.remainingAttempts;

            // 에러메세지를 state에 저장
            setError({
                message: errorMessage,
                remainingAttempts: remainingAttempts,
            });
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-semibold text-gray-900">
                        관리자 로그인
                    </h2>
                    <p className="mt-2 text-center text-lg text-gray-600">
                        관리자 전용 페이지입니다.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-xm font-medium text-gray-700"
                            >
                                관리자 아이디
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                                placeholder="관리자 아이디"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-xm font-medium text-gray-700"
                            >
                                관리자 비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-300"
                                placeholder="관리자 비밀번호"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-lg text-base font-bold text-center">
                            {typeof error === "string" ? error : error.message}
                            {error.remainingAttempts !== undefined && (
                                <div className="mt-1">
                                    남은 시도 횟수: {error.remainingAttempts}회
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full items-center px-4 py-3 border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-medium transition-colors duration-300"
                    >
                        로그인
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;