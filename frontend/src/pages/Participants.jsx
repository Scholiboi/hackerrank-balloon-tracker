import React, { useEffect, useRef, useState } from "react";
import DataTable from "../components/DataTable";
import Navbar from "../components/Navbar";
import {
  createParticipant,
  deleteParticipant,
  getParticipants,
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Participants
            <span className="ml-2 text-sm font-normal text-gray-400">({data.length})</span>
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {uploadStatus && (
              <span className="text-sm text-green-600 font-medium">{uploadStatus}</span>
            )}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current.click()}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Upload Excel
            </button>
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(""); }}
              className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              {showForm ? "Cancel" : "+ Add Participant"}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {COLUMNS.map((col) => (
              <div key={col.key}>
                <label className="text-xs text-gray-500 font-medium block mb-1">{col.label}</label>
                <input
                  value={form[col.key]}
                  onChange={(e) => setForm((f) => ({ ...f, [col.key]: e.target.value }))}
                  required={col.key === "hackerrank_id" || col.key === "name"}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
            {formError && (
              <p className="col-span-full text-sm text-red-500">{formError}</p>
            )}
            <div className="col-span-full flex justify-end gap-2">
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors">
                Save
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {sorted.length} of {data.length} shown
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email, lab, seat…"
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-80 lg:w-96"
            />
          </div>
          <DataTable columns={COLUMNS} data={sorted} onDelete={handleDelete} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
        </div>
      </div>
    </div>
  );
}
