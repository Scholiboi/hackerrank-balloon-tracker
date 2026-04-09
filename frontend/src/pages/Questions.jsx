import React, { useEffect, useRef, useState } from "react";
import DataTable from "../components/DataTable";
import Navbar from "../components/Navbar";
import { FileDown, Plus, X, Search, HelpCircle } from "lucide-react";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
  uploadQuestions,
} from "../api";

const COLUMNS = [
  { key: "challenge_name", label: "Challenge Name" },
  { key: "balloon_colour", label: "Balloon Colour" },
];

const EMPTY_FORM = { challenge_name: "", balloon_colour: "" };

export default function Questions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("challenge_name");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getQuestions());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleEdit(id, field, value) {
    const updated = await updateQuestion(id, { [field]: value });
    setData((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this question?")) return;
    await deleteQuestion(id);
    setData((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setFormError("");
    try {
      const created = await createQuestion(form);
      setData((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add question.");
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm(`Upload "${file.name}"? This will REPLACE all existing questions.`)) {
      fileRef.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadQuestions(fd);
      setUploadStatus(`Uploaded: ${res.inserted} questions.`);
      await load();
    } catch (err) {
      setUploadStatus(err.response?.data?.detail || "Upload failed.");
    }
    fileRef.current.value = "";
    setTimeout(() => setUploadStatus(""), 4000);
  }

  const filtered = data.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.challenge_name.toLowerCase().includes(q) ||
      (row.balloon_colour || "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortBy] || "";
    const bVal = b[sortBy] || "";
    const cmp = aVal.toString().localeCompare(bVal.toString());
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const handleSort = (col, order) => {
    setSortBy(col);
    setSortOrder(order);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight uppercase">
              Question Map
            </h2>
            <p className="font-bold text-black/40 text-sm mt-1 uppercase tracking-widest italic decoration-neo-pink decoration-2 underline">
              {data.length} total challenges
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {uploadStatus && (
              <span className="neo-badge bg-neo-green py-2 px-4 shadow-none border-dashed">{uploadStatus}</span>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current.click()}
              className="neo-btn bg-white hover:bg-neo-blue transition-colors group"
            >
              <FileDown className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Import Excel
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className={`neo-btn text-black transition-all ${showForm ? "bg-neo-pink" : "bg-neo-green"}`}
            >
              {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><HelpCircle className="w-4 h-4" /> New Task</>}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <form
            onSubmit={handleAddSubmit}
            className="neo-card p-6 mb-8 bg-white max-w-2xl mx-auto"
          >
            <p className="text-xs font-black text-black/40 uppercase mb-4 tracking-widest">Register New Challenge</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {COLUMNS.map((col) => (
                <div key={col.key}>
                  <label className="text-[10px] text-black font-black uppercase block mb-1.5 ml-1">{col.label}</label>
                  <input
                    value={form[col.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))}
                    required={col.key === "challenge_name"}
                    className="w-full px-3 py-2.5 rounded-xl border-3 border-black text-sm font-bold bg-white outline-none focus:shadow-neo transition-all"
                  />
                </div>
              ))}
            </div>
            {formError && (
              <div className="mt-6 neo-badge bg-neo-red w-full justify-center shadow-none border-dashed border-2">
                {formError}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button type="submit" className="neo-btn bg-black text-white px-10 py-3 uppercase tracking-widest text-xs">
                Link Balloon
              </button>
            </div>
          </form>
        )}

        <div className="neo-card bg-white overflow-hidden max-w-3xl mx-auto">
          <div className="px-6 py-4 border-b-3 border-black bg-neo-yellow/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-black uppercase italic decoration-neo-green decoration-2 underline">
              {sorted.length} active maps
            </span>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tags..."
                className="w-full pl-10 pr-4 py-2 border-3 border-black rounded-xl font-bold bg-white outline-none focus:shadow-neo transition-all text-sm"
              />
            </div>
          </div>
          <DataTable columns={COLUMNS} data={sorted} onDelete={handleDelete} onEdit={handleEdit} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
        </div>
      </div>
    </div>
  );
}

