import React, { useState } from "react";

const Board = () => {
    // 현재 페이지네이션(처음에는 1)
    const [currentPage, setCurrentPage] = useState(1);
    // 한페이지에 들어올 개수 설정
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const dummyPosts = [
        { _id: 1, number: 1, title: "첫 번째 게시물", createdAt: "2023-11-01T10:00:00", views: 10 },
        { _id: 2, number: 2, title: "두 번째 게시물", createdAt: "2023-11-02T11:30:00", views: 20 },
        { _id: 3, number: 3, title: "세 번째 게시물", createdAt: "2023-11-03T14:00:00", views: 30 },
        { _id: 4, number: 4, title: "네 번째 게시물", createdAt: "2023-11-04T16:45:00", views: 40 },
        { _id: 5, number: 5, title: "다섯 번째 게시물", createdAt: "2023-11-05T09:15:00", views: 50 },
        { _id: 6, number: 6, title: "첫 번째 게시물", createdAt: "2023-11-01T10:00:00", views: 10 },
        { _id: 7, number: 7, title: "두 번째 게시물", createdAt: "2023-11-02T11:30:00", views: 20 },
        { _id: 8, number: 8, title: "세 번째 게시물", createdAt: "2023-11-03T14:00:00", views: 30 },
        { _id: 9, number: 9, title: "네 번째 게시물", createdAt: "2023-11-04T16:45:00", views: 40 },
        { _id: 10, number: 10, title: "다섯 번째 게시물", createdAt: "2023-11-05T09:15:00", views: 50 },
        { _id: 11, number: 11, title: "첫 번째 게시물", createdAt: "2023-11-01T10:00:00", views: 10 },
        { _id: 12, number: 12, title: "두 번째 게시물", createdAt: "2023-11-02T11:30:00", views: 20 },
        { _id: 13, number: 13, title: "세 번째 게시물", createdAt: "2023-11-03T14:00:00", views: 30 },
        { _id: 14, number: 14, title: "네 번째 게시물", createdAt: "2023-11-04T16:45:00", views: 40 },
        { _id: 15, number: 15, title: "다섯 번째 게시물", createdAt: "2023-11-05T09:15:00", views: 50 },
    ];

    // 현재 페이지에서 마지막으로 보여질 게시물의 index
    const indexOfLastPost = currentPage * itemsPerPage;
    // 현재 페이지에서 첫게시물의 인덱스
    const indexOfFirstPost = indexOfLastPost - itemsPerPage;
    // 데이터에서 해당 범위의 게시물을 잘라서 저장
    const currentPosts = dummyPosts.slice(indexOfFirstPost, indexOfLastPost);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto py-32 md:py-32">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 md:mb-8 text-center">
                업무 게시판
            </h1>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                                번호
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-auto">
                                제목
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-[15%]">
                                작성일
                            </th>
                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-[8%]">
                                조회수
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {currentPosts.map((post) => (
                            <tr key={post._id} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap">{post.number}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{post.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {new Date(post.createdAt).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{post.views}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Board;
