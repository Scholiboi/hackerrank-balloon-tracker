import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== "/admin/login") {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (password) =>
  api.post("/auth/login", { password }).then((r) => r.data.access_token);

// Portal (public)
export const lookupPortal = (q) =>
  api.get("/portal/lookup", { params: { q } }).then((r) => r.data);

// Participants
export const getParticipants = () => api.get("/participants").then((r) => r.data);
export const getLabs = () => api.get("/participants/labs").then((r) => r.data.labs);
export const createParticipant = (data) => api.post("/participants", data).then((r) => r.data);
export const deleteParticipant = (id) => api.delete(`/participants/${id}`);
export const uploadParticipants = (formData) =>
  api.post("/participants/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

// Questions
export const getQuestions = () => api.get("/questions").then((r) => r.data);
export const createQuestion = (data) => api.post("/questions", data).then((r) => r.data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
export const uploadQuestions = (formData) =>
  api.post("/questions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

// Balloons
export const getPendingBalloons = () => api.get("/balloons/pending").then((r) => r.data);
export const tickBalloon = (submissionId) =>
  api.post("/balloons/tick", { submission_id: submissionId }).then((r) => r.data);

// Attendance
export const getAttendance = () => api.get("/attendance").then((r) => r.data);
export const getAttendanceStats = () => api.get("/attendance/stats").then((r) => r.data);
export const checkIn = (hackerrank_id, check_in_type) =>
  api.post("/attendance/checkin", { hackerrank_id, check_in_type }).then((r) => r.data);
export const qrScan = (payload) =>
  api.post("/attendance/qr-scan", payload).then((r) => r.data);
export const undoCheckIn = (id) => api.delete(`/attendance/${id}`);
