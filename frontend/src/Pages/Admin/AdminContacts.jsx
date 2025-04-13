import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

const AdminContacts = () => {
    // 전체 문의글 저장
    const [contacts, setContacts] = useState([]);
    // 한페이지에 들어갈 페이지 수(최대  10개)
    const [pageSize, setPageSize] = useState(10);
    // 현재 페이지 저장
    const [currentPage, setCurrentPage] = useState(1);

    // 선택한 문의글 
    const [selectedContact, setSelectContact] = useState(null);
    // 관리자 검색창에 검색어를 저장하고 상태관리
    const [searchTerm, setSearchTerm] = useState("");
    // 타입선택(셀렉트박스) 데이터 저장
    const [searchType, setSearchType] = useState("name");
    // 문의글 상태 필터
    const [statusFilter, setStatusFilter] = useState("all");

    // 모달창 상태 저장
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 최초 랜더링 시 서버에 요청하여 데이터 블러오기
    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/contact", {
                    withCredentials: true, // 쿠기 송수신 허용
                });

                // useState에 저장
                setContacts(response.data);
            } catch (error) {
                console.log("문의글 가져오기 실패: ", error);
            }
        };

        // 함수 호출
        fetchContacts();
    }, []);

    // 수정
    const handleEdit = (contact) => {
        // 수정 버튼을 누른 정보가 selectedContact에 담김
        setSelectContact(contact);
        // 모달 상태변화
        setIsModalOpen(true);
    };

    // 상태 업데이트
    const handleStatusUpdate = async (newStatus) => { // put요청으로 인해 비동기 통신
        try {
            await axios.put(
                // 해당 문의글에 대해서만 put요청
                `http://localhost:3000/api/contact/${selectedContact._id}`,
                { status: newStatus },
                { withCredentials: true }
            );

            setContacts(
                contacts.map((contact) =>
                    contact._id === selectedContact._id
                        ? { ...contact, status: newStatus } //state 값만 바꾸기
                        : contact
                )
            );

            setIsModalOpen(false);
            Swal.fire("수정완료!", "상태가 성공적으로 수정되었습니다.", "success");
        } catch (error) {
            console.log("수정 실패: ", error);
            Swal.fire("오류 발생", "수정 중 문제가 발생했습니다.", "error");
        }
    };

    // 문의사항 삭제
    const handleDelete = async (id) => {
        // swal 알람창 디자인
        const result = await Swal.fire({
            title: "삭제하시겠습니까?",
            text: "이 작업은 되돌릴 수 없습니다!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "삭제",
            cancelButtonText: "취소",
        });

        if (result.isConfirmed) {
            try {
                // delete 명령
                await axios.delete(`http://localhost:3000/api/contact/${id}`, {
                    withCredentials: true,
                });

                // 삭제될 데이터만 필터링
                setContacts(contacts.filter(contact => contact._id !== id));
                Swal.fire("삭제완료!", "문의가 성공적으로 삭제되었습니다.", "success");
            } catch (error) {
                console.log("삭제 실패: ", error);
                Swal.fire("오류 발생", "삭제 중 문제가 발생했습니다.", "error");
            }
        }
    };

    // 검색 필터 기능
    const filteredContacts = useMemo(() => {
        return contacts.filter((contact) => { // contacts의 개별 게시물 가져오기
            // 속성을 소문자로 변환하여 비교할 준비
            const value = contact[searchType].toLowerCase() || "";
            // 속성과 입력된 searchTerm을 비교해서 일치여부 판단
            const matchesSearch = value.includes(searchTerm.toLowerCase());
            // statusFilter가 "all"이거나, 문의글의 상태가 statusFilter와 일치할 경우를 판단
            const matchesStatus =
                statusFilter === "all" || contact.status === statusFilter;
            // 두 조건 모두 만족할 경우에만 필터링된 결과에 포함
            return matchesSearch && matchesStatus;
        });
        // 아래 의존성 배열이 변경돨때 재실행
    }, [contacts, searchTerm, searchType, statusFilter]);

    // 페이지 네이션 구현
    // 전체 페이지수  =  전체 문의글 길이 / 한페이지당 글 개수
    const totalPages = Math.ceil(filteredContacts.length / pageSize);
    // 페이지 네이션 동작
    const paginatedContacts = useMemo(() => {
        // 현재 페이지에서 표시할 문의글 목록의 시작 인덱스(1페이지는 0, 2페이지는 11 ...)
        const start = (currentPage - 1) * pageSize;
        // 해당 페이지의 전체 인덱스
        return filteredContacts.slice(start, start + pageSize);
        // 의존성 배열의 변화에만 재실행
    }, [filteredContacts, currentPage, pageSize]);

    return (
        <div className="p-4 mx-auto max-w-[1400px]">
            <h1 className="text-4xl font-bold mt-6 mb-4">문의 관리</h1>

            {contacts.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                    <p className="text-2xl font-bold text-gray-800">
                        문의사항이 없습니다.
                    </p>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex w-full md:w-auto gap-2">
                            <select
                                className="border rounded px-3 py-2 text-base"
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                            >
                                <option value="name">이름</option>
                                <option value="email">이메일</option>
                                <option value="phone">전화번호</option>
                                <option value="message">문의내용</option>
                            </select>
                            <div className="flex-1 md:w-80">
                                <input
                                    type="text"
                                    placeholder="검색어를 입력하세요"
                                    className="w-full border rounded px-3 py-2 text-base"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="border rounded px-3 py-2 text-base"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">전체 상태</option>
                                <option value="pending">대기중</option>
                                <option value="in progress">진행중</option>
                                <option value="completed">완료</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <label className="text-base font-bold text-gray-600">
                                페이지당 표시:{" "}
                            </label>
                            <select
                                className="border rounded px-3 py-2"
                                value={pageSize}
                                onChange={(e) => {
                                    // 한페이지에 표시될 개수 지정
                                    setPageSize(Number(e.target.value));
                                    // 1페이지로 가기기
                                    setCurrentPage(1);
                                }}
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>{`${size}개`}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="text-lg font-bold text-gray-600">총 {filteredContacts.length}개의 문의</div>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full bg-white shadow-md rounded-lg overflow-hidden text-sm lg:text-lg font-bold">
                            <colgroup>
                                <col className="w-[8%]" />
                                <col className="w-[12%]" />
                                <col className="w-[20%]" />
                                <col className="w-[15%]" />
                                <col className="w-[25%]" />
                                <col className="w-[10%]" />
                                <col className="w-[10%]" />
                            </colgroup>
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left">번호</th>
                                    <th className="px-4 py-3 text-left">이름</th>
                                    <th className="px-4 py-3 text-left">이메일</th>
                                    <th className="px-4 py-3 text-left">휴대폰</th>
                                    <th className="px-4 py-3 text-left">문의 내용</th>
                                    <th className="px-4 py-3 text-left">상태</th>
                                    <th className="px-4 py-3 text-center">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedContacts.map((contact, index) => (
                                    <tr key={contact.id} className="border-b">
                                        <td className="px-4 py-3">
                                            {(currentPage - 1) * pageSize + index + 1}
                                        </td>
                                        <td className="px-4 py-3">{contact.name}</td>
                                        <td className="px-4 py-3">{contact.email}</td>
                                        <td className="px-4 py-3">{contact.phone}</td>
                                        <td className="px-4 py-3">{contact.message}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`px-2 py-1 rounded-full text-sm ${contact.status === "pending"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : contact.status === "in progress"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-green-100 text-green-800"
                                                    }`}
                                            >
                                                {contact.status === "in progress"
                                                    ? "진행중"
                                                    : contact.status === "pending"
                                                        ? "대기중"
                                                        : "완료"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={() => handleEdit(contact)} className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap writing-normal">
                                                    수정
                                                </button>
                                                <button onClick={() => handleDelete(contact._id)} className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap writing-normal">
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 모바일 버전 */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {paginatedContacts.map((contact, index) => (
                            <div
                                key={contact._id}
                                className="p-4 border rounded-lg bg-white shadow-md text-lg font-bold"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-lg font-bold">
                                        #{(currentPage - 1) * pageSize + index + 1}
                                        <span
                                            className={`px-2 py-1 rounded-full text-base ${contact.status === "pending"
                                                ? "bg-blue-100 text-blue-800"
                                                : contact.status === "in progress"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : "bg-green-100 text-green-800"
                                                }`}
                                        >
                                            {contact.status === "in progress"
                                                ? "진행중"
                                                : contact.status === "pending"
                                                    ? "대기중"
                                                    : "완료"}
                                        </span>
                                    </div>
                                </div>
                                <div>이름: {contact.name}</div>
                                <div>이메일: {contact.email}</div>
                                <div>휴대폰: {contact.phone}</div>
                                <div>내용: {contact.message}</div>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button onClick={() => handleEdit(contact)} className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap writing-normal">
                                        수정
                                    </button>
                                    <button onClick={() => handleDelete(contact._id)} className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 whitespace-nowrap writing-normal">
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex justify-center space-x-2 text-lg font-bold">
                        <button
                            className="px-3 py-1 rounded border disabled:opacity-50"
                            // 현재 페이지에서 1을 뺌
                            onClick={() => setCurrentPage((p) => p - 1)}
                            //현재 페이지가 1이면 막기
                            disabled={currentPage === 1}
                        >
                            이전
                        </button>
                        <span className="px-3 py-1">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="px-3 py-1 rounded border disabled:opacity-50"
                            // 현재 페이지에서 1을 더함
                            onClick={() => setCurrentPage((p) => p + 1)}
                            // 전체 페이지 번호랑 같으면 막기
                            disabled={currentPage === totalPages}
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
            {isModalOpen && selectedContact && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">문의 상태 수정</h2>
                        <div className="mb-4">
                            <p className="font-medium mb-2">
                                현재 상태:{" "}
                                {selectedContact.status === "in progress"
                                    ? "진행중"
                                    : selectedContact.status == "pending"
                                        ? "대기중"
                                        : "완료"}
                            </p>
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleStatusUpdate("pending")}
                                    className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                >
                                    대기중
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate("in progress")}
                                    className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                >
                                    진행중
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate("completed")}
                                    className="w-full px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
                                >
                                    완료
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminContacts;
