import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getParticipants, sendEmail, sendAllEmails } from "../api";
import { Search, Mail, Send, Loader2, CheckCircle, AlertCircle, Users } from "lucide-react";

export default function EmailManager() {
    const [participants, setParticipants] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [sendingAll, setSendingAll] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ text: "", isError: false });

    useEffect(() => {
        getParticipants()
            .then(setParticipants)
            .finally(() => setLoading(false));
    }, []);

    async function handleSendSingle(hid) {
        try {
            await sendEmail(hid);
            showStatus(`Email scheduled for ${hid}`);
        } catch (err) {
            showStatus(err.response?.data?.detail || "Send failed", true);
        }
    }

    async function handleSendAll() {
        if (!window.confirm("Send emails to ALL participants? This cannot be undone.")) return;
        setSendingAll(true);
        try {
            const res = await sendAllEmails();
            showStatus(res.message);
        } catch (err) {
            showStatus(err.response?.data?.detail || "Bulk send failed", true);
        } finally {
            setSendingAll(false);
        }
    }

    function showStatus(text, isError = false) {
        setStatusMsg({ text, isError });
        setTimeout(() => setStatusMsg({ text: "", isError: false }), 4000);
    }

    const filtered = participants.filter((p) => {
        const q = search.toLowerCase();
        return (
            p.hackerrank_id.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            (p.email || "").toLowerCase().includes(q) ||
            (p.lab || "").toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-neo-yellow/10">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-black text-black tracking-tight uppercase mb-2">Email Control</h2>
                        <p className="text-sm font-bold text-black/60 uppercase">Manage Pokédex entry pass dispatch</p>
                    </div>

                    <button
                        onClick={handleSendAll}
                        disabled={sendingAll || loading}
                        className="neo-btn bg-neo-red text-white px-8 py-4 flex items-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                    >
                        {sendingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                        <span className="font-black uppercase tracking-widest">Transmit All Signals</span>
                    </button>
                </div>

                {statusMsg.text && (
                    <div className={`neo-card p-4 mb-8 flex items-center gap-3 border-dashed ${statusMsg.isError ? 'bg-neo-red/20 border-neo-red' : 'bg-neo-green/20 border-neo-green'}`}>
                        {statusMsg.isError ? <AlertCircle className="w-5 h-5 text-neo-red" /> : <CheckCircle className="w-5 h-5 text-neo-green" />}
                        <span className="font-black text-sm uppercase">{statusMsg.text}</span>
                    </div>
                )}

                <div className="neo-card bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b-3 border-black bg-neo-blue/20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-black italic">{filtered.length} Trainers Enrolled</span>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search trainers..."
                                className="w-full pl-10 pr-4 py-3 border-3 border-black rounded-xl font-bold bg-white outline-none focus:shadow-neo transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-black/5 border-b-2 border-black font-black uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Trainer</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left hidden sm:table-cell">Lab / Seat</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">Email</th>
                                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center">Send</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-black/5">
                                {filtered.map((p) => (
                                    <tr key={p.id} className="hover:bg-neo-blue/5">
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <div className="font-black text-sm sm:text-base">{p.name}</div>
                                            <div className="font-mono text-xs opacity-60">@{p.hackerrank_id}</div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                                            <div className="font-bold uppercase text-xs">
                                                <span className="bg-neo-green px-1.5 py-0.5 rounded border-2 border-black mr-2">{p.lab}</span>
                                                <span className="bg-neo-pink px-1.5 py-0.5 rounded border-2 border-black">{p.seat}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                            <span className="text-[11px] font-mono break-all">{p.email || <span className="text-neo-red italic font-black text-xs">NO EMAIL</span>}</span>
                                        </td>
                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                            <button
                                                onClick={() => handleSendSingle(p.hackerrank_id)}
                                                disabled={!p.email}
                                                className="p-3 border-2 border-black rounded-xl bg-neo-yellow hover:bg-black hover:text-white transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-30 disabled:grayscale"
                                                title="Send Entry Pass"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
