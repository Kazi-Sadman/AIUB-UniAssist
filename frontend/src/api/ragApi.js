import axiosClient from "./axiosClient";

// Reuses the existing shared axios client (same baseURL, same error
// normalization interceptor as studentApi/courseApi/etc.)
const ragApi = {
  sendChatMessage: (message) =>
    axiosClient.post("/api/chat", { message }).then((res) => res.data),
};

export default ragApi;
