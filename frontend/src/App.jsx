import './App.css'
import Navbar from './Components/Navbar/Navbar'
import Footer from './Components/Footer/Footer'
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import axios from "axios";

import MainPage from "./Pages/MainPage/MainPage";
import About from "./Pages/About/About";
import Leadership from "./Pages/Leadership/Leadership";
import Board from "./Pages/Board/Board";
import Services from "./Pages/Services/Services.jsx";
import Contact from "./Pages/Contact/Contact";
import AdminLogin from './Pages/Admin/AdminLogin.jsx';

function AuthRedirectRoute() {
  // 인증 정보 저장
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // 토큰의 유뮤 확인
    const verifyToken = async () => {
      try {
        // 백엔드의 토큰 인증 코드로 post 요청
        const response = await axios.post(
          "http://localhost:3000/api/auth/verify-token", // 백엔드 주소의 토큰 라우터 주소
          {}, // request의 body가 보내질 곳
          { withCredentials: true } // 쿠키 보내기
        );

        //성공값 전송
        setIsAuthenticated(true);
      } catch (error) {
        console.log("토큰 인증 실패: ", error);

        //실패값 전송
        setIsAuthenticated(false);
      }
    };

    //함수 호출
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  // 인증이 통과가 되면 로그인을 이중으로 하는 것을 방지하기 위해 navigate로 이동
  // replace는 현재 페이지를 새로운 페이지로 대체 해서 이전 페이지로 돌아갈 수 없게 함
  // 통과가 되지 않으면 admin 로그인 페이지로 이동 - outlet 컴포넌트를 사용
  return isAuthenticated ? <Navigate to="/admin/posts" replace /> : <Outlet />;
}


function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <MainPage />
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/leadership",
        element: <Leadership />,
      },
      {
        path: "/board",
        element: <Board />,
      },
      {
        path: "/our-services",
        element: <Services />,
      },
      {
        path: "/contact",
        element: <Contact />,
      }
    ]
  },
  {
    path: "/admin",
    element: <AuthRedirectRoute />, // 리다이렉트 되는 페이지지
    children: [{ index: true, element: <AdminLogin /> }],
  }
])

function App() {

  return <RouterProvider router={router} />;
}

export default App
