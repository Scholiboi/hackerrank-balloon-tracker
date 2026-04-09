import React, { useEffect, useRef, useState } from "react";
import DataTable from "../components/DataTable";
import Navbar from "../components/Navbar";
import { FileDown, Plus, X, Search, UserPlus } from "lucide-react";
import {
  createParticipant,
  deleteParticipant,
  getParticipants,
  updateParticipant,
  uploadParticipants,
} from "../api";

const COLUMNS = [
  { key: "hackerrank_id", label: "HackerRank ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "lab", label: "Lab" },
  { key: "seat", label: "Seat" },
];

const EMPTY_FORM = {
  hackerrank_id: "",
  name: "",
  email: "",
  mobile: "",
  lab: "",
  seat: "",
};

export default function Participants() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      setData(await getParticipants());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleEdit(id, field, value) {
    const updated = await updateParticipant(id, { [field]: value });
    setData((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this participant?")) return;
    await deleteParticipant(id);
    setData((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    setFormError("");
    try {
      const created = await createParticipant(form);
      setData((prev) => [...prev, created]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add participant.");
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm(`Upload "${file.name}"? This will REPLACE all existing participants.`)) {
      fileRef.current.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadParticipants(fd);
      setUploadStatus(`Uploaded: ${res.inserted} participants.`);
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
      row.hackerrank_id.toLowerCase().includes(q) ||
      (row.name || "").toLowerCase().includes(q) ||
      (row.email || "").toLowerCase().includes(q) ||
      (row.lab || "").toLowerCase().includes(q) ||
      (row.seat || "").toLowerCase().includes(q)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight uppercase">
              Contestants
            </h2>
            <p className="font-bold text-black/40 text-sm mt-1 uppercase tracking-widest italic decoration-neo-green decoration-2 underline">
              {data.length} registered users
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
              <FileDown className="w-4 h-4 group-hover:animate-bounce" />
              Import Excel
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className={`neo-btn text-black transition-all ${showForm ? "bg-neo-pink" : "bg-neo-green"}`}
            >
              {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><UserPlus className="w-4 h-4" /> Add Manually</>}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <form
            onSubmit={handleAddSubmit}
            className="neo-card p-6 mb-8 bg-white"
          >
            <p className="text-xs font-black text-black/40 uppercase mb-4 tracking-widest">New Participant Registration</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {COLUMNS.map((col) => (
                <div key={col.key}>
                  <label className="text-[10px] text-black font-black uppercase block mb-1.5 ml-1">{col.label}</label>
                  <input
                    value={form[col.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))}
                    required={col.key === "hackerrank_id" || col.key === "name"}
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
                Save Participant
              </button>
            </div>
          </form>
        )}

        <div className="neo-card bg-white overflow-hidden">
          <div className="px-6 py-4 border-b-3 border-black bg-neo-yellow/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-black uppercase italic decoration-neo-pink decoration-2 underline">
              Showing {sorted.length} results
            </span>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, ID, lab, seat..."
                className="w-full pl-10 pr-4 py-2 border-3 border-black rounded-xl font-bold bg-white outline-none focus:shadow-neo transition-all"
              />
            </div>
          </div>
          <DataTable columns={COLUMNS} data={sorted} onDelete={handleDelete} onEdit={handleEdit} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
        </div>
      </div>
    </div>
  );
}

