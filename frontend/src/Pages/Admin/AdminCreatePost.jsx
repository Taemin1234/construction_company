import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";

const AdminCreatePost = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        files: [],
        fileList: [],
    });
    const editorRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [currentUpload, setCurrentUpload] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const UploadModal = ({ progress, fileName }) => (
        showUploadModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">파일 업로드 중...</h3>
                    <p className="text-sm text-gray-600 mb-4">{fileName}</p>
                    <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200">
                            <div
                                style={{ width: `${progress}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                            />
                        </div>
                        <div className="text-center text-sm text-gray-600">
                            {progress.toFixed(0)}%
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    // 포스트 요청을 보내 게시글을 업로드
    const handleSubmit = async (e) => {
        e.preventDefault();
        // 현재 에디터 저장 = 에디터 내부 게시물 가져오기
        const editorContent = editorRef.current.getContent();
        // 업로드 중 업로드 모달 보여주기
        setShowUploadModal(true);

        try {
            // 모든 파일 업로드
            const uploadedFiles = await Promise.all(// promise로 모든 상황에 대처
                formData.files.map(async (file) => {
                    setCurrentUpload(file.name);
                    const fileFormData = new FormData();
                    const encodedFileName = encodeURIComponent(file.name);
                    fileFormData.append("file", file);
                    // 로컬 파일 이름은 유지
                    fileFormData.append("originalName", encodedFileName);

                    const response = await axios.post(
                        "http://localhost:3000/api/upload/file",
                        fileFormData,
                        {
                            withCredentials: true,
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                            // 업로드 되고 있는 상황
                            onUploadProgress: (progressEvent) => {
                                const percentCompleted = Math.round(
                                    (progressEvent.loaded * 100) / progressEvent.total
                                );
                                setUploadProgress((prev) => ({
                                    ...prev,
                                    [file.name]: percentCompleted,
                                }));
                            },
                        }
                    );
                    // s3 bucket의 주소 반환
                    return response.data.fileUrl;
                })
            );

            // 게시물 내용 업로드
            const postData = {
                title: formData.title,
                content: editorContent,
                fileUrl: uploadedFiles,
            };

            await axios.post(
                "http://localhost:3000/api/post",
                postData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            setShowUploadModal(false);
            navigate("/admin/posts");
        } catch (error) {
            console.error("Error creating post:", error);
            setShowUploadModal(false);
        }
    };

    // 파일 수정 & 업데이트
    const handleFileChange = (e) => {
        // 새로운 파일 정보
        const newFiles = Array.from(e.target.files);

        //새로운 파일 리스트
        const newFileList = newFiles.map((file) => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            file: file,
        }));

        setFormData((prev) => ({
            ...prev,
            files: [...prev.files, ...newFiles],
            fileList: [...prev.fileList, ...newFileList],
        }));
    };

    // 파일 삭제 함수
    const handleFileDelete = (fileId) => {
        setFormData((prev) => ({
            ...prev,
            files: prev.files.filter((_, index) => prev.fileList[index].id !== fileId),
            fileList: prev.fileList.filter((file) => file.id !== fileId),
        }));
    };

    // 파일 크기 구하는 함수
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-gray-800">
                    새 게시물 작성
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-lg sm:text-xl font-medium text-gray-700 mb-2"
                        >
                            제목
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-lg p-2 sm:p-3"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-lg sm:text-xl font-medium text-gray-700 mb-2">
                            내용
                        </label>
                        <Editor
                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                            onInit={(evt, editor) => (editorRef.current = editor)}
                            initialValue={formData.content}
                            init={{
                                height: 500,
                                menubar: true,
                                toolbar_mode: "scrolling",
                                toolbar_sticky: true,
                                toolbar_location: "top",
                                plugins: [
                                    "advlist",
                                    "autolink",
                                    "lists",
                                    "link",
                                    "image",
                                    "charmap",
                                    "preview",
                                    "anchor",
                                    "searchreplace",
                                    "visualblocks",
                                    "code",
                                    "fullscreen",
                                    "insertdatetime",
                                    "media",
                                    "table",
                                    "code",
                                    "help",
                                    "wordcount",
                                    "image",
                                ],
                                toolbar:
                                    "undo redo | blocks | " +
                                    "bold italic | alignleft aligncenter " +
                                    "alignright | bullist numlist | " +
                                    "image | help",
                                content_style:
                                    "body { font-family:Helvetica,Arial,sans-serif; font-size:14px } @media (max-width: 768px) { body { font-size: 16px; } }",
                                images_upload_handler: async (blobInfo, progress) => {
                                    try {
                                        const formData = new FormData();
                                        formData.append("image", blobInfo.blob());

                                        const response = await axios.post(
                                            "http://localhost:3000/api/upload/image",
                                            formData,
                                            {
                                                withCredentials: true,
                                                headers: {
                                                    "Content-Type": "multipart/form-data",
                                                },
                                            }
                                        );

                                        return response.data.imageUrl;
                                    } catch (error) {
                                        console.error("Image upload failed:", error);
                                        throw error;
                                    }
                                },
                                file_picker_types: "image",
                                automatic_uploads: true,
                                file_picker_callback: function (cb, value, meta) {
                                    const input = document.createElement("input");
                                    input.setAttribute("type", "file");
                                    input.setAttribute("accept", "image/*");

                                    input.onchange = function () {
                                        const file = this.files[0];
                                        const reader = new FileReader();
                                        reader.onload = function () {
                                            const id = "blobid" + new Date().getTime();
                                            const blobCache =
                                                editorRef.current.editorUpload.blobCache;
                                            const base64 = reader.result.split(",")[1];
                                            const blobInfo = blobCache.create(id, file, base64);
                                            blobCache.add(blobInfo);
                                            cb(blobInfo.blobUri(), { title: file.name });
                                        };
                                        reader.readAsDataURL(file);
                                    };
                                    input.click();
                                },
                            }}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="files"
                            className="block text-lg sm:text-xl font-medium text-gray-700 mb-2"
                        >
                            첨부파일
                        </label>
                        <input
                            type="file"
                            id="files"
                            multiple
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-base sm:text-lg text-gray-500
                file:mr-2 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-4 sm:file:px-6
                file:rounded-lg file:border-0
                file:text-base sm:file:text-lg file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                cursor-pointer"
                        />

                        {formData.fileList.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="font-medium text-gray-700">첨부된 파일 목록:</p>
                                <ul className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                                    {formData.fileList.map((file) => (
                                        <li
                                            key={file.id}
                                            className="flex items-center justify-between px-4 py-3"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <svg
                                                    className="w-6 h-6 text-gray-400"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleFileDelete(file.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <svg
                                                    className="w-5 h-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-white bg-indigo-600 border-2 border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                        >
                            저장
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/posts")}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
                        >
                            취소
                        </button>
                    </div>
                </form>
            </div>
            <UploadModal
                progress={uploadProgress[currentUpload] || 0}
                fileName={currentUpload || ""}
            />
        </div>
    );
};

export default AdminCreatePost;