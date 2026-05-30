import { useState } from "react";
import { students as mockStudents, type Student } from "@/data/mockData";
import { useTrainees } from "@/hooks/useTrainees";
import { useInbox, useSendMessage, useMarkRead, useReplyMessage, type InboxMessage } from "@/hooks/useMessages";
import { Send, CheckCircle, Search, Filter, MessageSquare, Inbox, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const units = ["All", "Anesthesia", "Surgery", "Internal Medicine", "Advanced Practice Providers"];

const coordinators = [
  { name: "Dr. Sarah Miller", areas: ["Anesthesia", "Surgery"] },
  { name: "Dr. John Adams", areas: ["Surgery", "Emergency Medicine"] },
  { name: "Nancy Drew, RN", areas: ["Internal Medicine", "Critical Care"] },
];

const statusFilters = [
  { value: "All", label: "All Students" },
  { value: "Needs Practice", label: "Needs More Practice" },
  { value: "Not Started", label: "Hasn't Started" },
  { value: "Overdue", label: "Overdue" },
  { value: "Due Soon", label: "Due Soon (≤7 days)" },
];

const templates = [
  { label: "📋 Complete Course", text: "This is a reminder to please complete your CVC training course before your deadline of {deadline}. Log in to Medulate Sync to continue your progress." },
  { label: "🔄 Additional Practice", text: "You have been identified as needing additional practice. Please log in and complete the assigned practice modules before {deadline}." },
  { label: "⏰ Deadline Approaching", text: "Your training deadline of {deadline} is approaching. Please make sure to complete all required modules before the due date." },
  { label: "✅ Verification Reminder", text: "Please complete your Verification of Proficiency assessment by {deadline}. This is required to finish the training program." },
];

// Mock received messages (fallback)
const mockReceivedMessages: InboxMessage[] = [
  { id: "1", from: "James Rodriguez", subject: "Re: Complete Course Reminder", body: "Thank you for the reminder. I'll finish Module 3 this week.", time: "2 hrs ago", read: false },
  { id: "2", from: "Emily Thompson", subject: "Question about ultrasound module", body: "Can I have additional time for Module 2? I've been having technical issues with the simulation.", time: "5 hrs ago", read: false },
  { id: "3", from: "Ryan Foster", subject: "Re: Deadline Approaching", body: "I understand. I will complete the remaining modules by the deadline.", time: "1 day ago", read: true },
  { id: "4", from: "David Kim", subject: "Help with login", body: "I'm unable to access the training platform. Could you please reset my credentials?", time: "2 days ago", read: true },
];

const InboxPage = () => {
  const { data: apiStudents } = useTrainees();
  const { data: apiMessages } = useInbox();
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkRead();
  const replyMutation = useReplyMessage();
  const students = apiStudents ?? mockStudents;
  const receivedMessages = apiMessages ?? mockReceivedMessages;

  const [tab, setTab] = useState("send");
  const [statusFilter, setStatusFilter] = useState("All");
  const [unitFilter, setUnitFilter] = useState("All");
  const [coordFilter, setCoordFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [inboxSearch, setInboxSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<typeof receivedMessages[0] | null>(null);
  const [replyText, setReplyText] = useState("");

  let filtered = [...students];
  if (search) filtered = filtered.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  if (unitFilter !== "All") filtered = filtered.filter((s) => s.unit === unitFilter);
  if (statusFilter === "Needs Practice") filtered = filtered.filter((s) => s.needsPractice);
  else if (statusFilter === "Not Started") filtered = filtered.filter((s) => s.walkthroughComplete === 0);
  else if (statusFilter === "Overdue") filtered = filtered.filter((s) => s.daysRemaining < 0);
  else if (statusFilter === "Due Soon") filtered = filtered.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 7);
  if (coordFilter !== "All") {
    const coord = coordinators.find((c) => c.name === coordFilter);
    if (coord) filtered = filtered.filter((s) => coord.areas.includes(s.unit));
  }

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s.id)));
  };

  const getDeadlineText = () => {
    const selectedStudents = students.filter((s) => selected.has(s.id));
    if (selectedStudents.length === 0) return "";
    if (selectedStudents.length === 1) return selectedStudents[0].deadline;
    const earliest = selectedStudents.reduce((min, s) => s.deadline < min ? s.deadline : min, selectedStudents[0].deadline);
    return earliest;
  };

  const applyTemplate = (text: string) => {
    const deadline = getDeadlineText() || "[deadline]";
    setMessage(text.replace(/\{deadline\}/g, deadline));
  };

  const handleSend = () => {
    const recipientIds = Array.from(selected).map(Number);
    sendMessageMutation.mutate(
      { subject: "Training Message", body: message, recipient_ids: recipientIds },
      { onSuccess: () => { setSent(true); setTimeout(() => { setSent(false); setMessage(""); setSelected(new Set()); }, 2000); } }
    );
  };

  const filteredInbox = receivedMessages.filter((m) =>
    !inboxSearch || m.from.toLowerCase().includes(inboxSearch.toLowerCase()) || m.subject.toLowerCase().includes(inboxSearch.toLowerCase()) || m.body.toLowerCase().includes(inboxSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Inbox</h2>
        <p className="text-sm text-muted-foreground">Send messages and view student replies</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="send" className="gap-1.5"><Send className="h-3.5 w-3.5" /> Send Messages</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> Received
            {receivedMessages.filter((m) => !m.read).length > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {receivedMessages.filter((m) => !m.read).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Student selection */}
            <div className="lg:col-span-2 rounded-xl bg-card p-5 shadow-card space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelected(new Set()); }}>
                    <SelectTrigger className="h-9 text-xs flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusFilters.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={unitFilter} onValueChange={(v) => { setUnitFilter(v); setSelected(new Set()); }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter by unit" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={coordFilter} onValueChange={(v) => { setCoordFilter(v); setSelected(new Set()); }}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter by coordinator" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Coordinators</SelectItem>
                    {coordinators.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
              </div>

              <div className="flex items-center justify-between">
                <button onClick={selectAll} className="text-[10px] font-semibold text-primary hover:underline">
                  {selected.size === filtered.length ? "Deselect All" : "Select All"} ({filtered.length})
                </button>
                <span className="text-[10px] text-muted-foreground">{selected.size} selected</span>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {filtered.map((s) => (
                  <label key={s.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${selected.has(s.id) ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                    <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{s.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.unit} · Due: {s.deadline}</p>
                    </div>
                    {s.needsPractice && <span className="text-[9px] text-destructive font-semibold">⚠</span>}
                    {s.daysRemaining < 0 && <span className="text-[9px] text-destructive font-semibold">Overdue</span>}
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No students match this filter.</p>
                )}
              </div>
            </div>

            {/* Message composition */}
            <div className="lg:col-span-3 rounded-xl bg-card p-5 shadow-card space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Compose Message</h3>
              </div>

              {sent ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <CheckCircle className="h-12 w-12 text-success" />
                  <p className="text-sm font-semibold text-foreground">Messages sent to {selected.size} student{selected.size !== 1 ? "s" : ""}!</p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">Quick Templates</p>
                    <p className="text-[10px] text-muted-foreground mb-2">Deadlines auto-populate based on selected students</p>
                    <div className="grid grid-cols-2 gap-2">
                      {templates.map((t) => (
                        <Button key={t.label} variant="outline" size="sm" className="text-[10px] h-auto py-2 text-left justify-start" onClick={() => applyTemplate(t.text)}>
                          {t.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Message</p>
                    <Textarea placeholder="Type your message here…" value={message} onChange={(e) => setMessage(e.target.value)} className="text-sm min-h-[140px]" />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Sending to <strong>{selected.size}</strong> student{selected.size !== 1 ? "s" : ""}</p>
                    <Button onClick={handleSend} disabled={!message.trim() || selected.size === 0} className="gap-2">
                      <Send className="h-4 w-4" /> Send Message
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className={`${selectedMessage ? "lg:col-span-2" : "lg:col-span-5"} rounded-xl bg-card shadow-card overflow-hidden`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search messages…" value={inboxSearch} onChange={(e) => setInboxSearch(e.target.value)} className="pl-9 h-9 text-sm" />
                </div>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {filteredInbox.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => { if (!msg.read) markReadMutation.mutate(msg.id); setSelectedMessage(msg); }}
                    className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${selectedMessage?.id === msg.id ? "bg-primary/5" : ""} ${!msg.read ? "bg-primary/[0.03]" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-xs ${!msg.read ? "font-bold" : "font-medium"} text-foreground`}>{msg.from}</p>
                      <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-xs text-foreground truncate">{msg.subject}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{msg.body}</p>
                  </button>
                ))}
                {filteredInbox.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">No messages found.</p>
                )}
              </div>
            </div>

            {selectedMessage && (
              <div className="lg:col-span-3 rounded-xl bg-card p-5 shadow-card space-y-4">
                <button onClick={() => setSelectedMessage(null)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back to inbox
                </button>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedMessage.subject}</p>
                  <p className="text-xs text-muted-foreground">From: {selectedMessage.from} · {selectedMessage.time}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm text-foreground">{selectedMessage.body}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Reply</p>
                  <Textarea placeholder="Type your reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} className="text-sm min-h-[80px]" />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" disabled={!replyText.trim()} className="gap-1.5" onClick={() => {
                      replyMutation.mutate(
                        { messageId: selectedMessage!.id, body: replyText },
                        { onSuccess: () => { setReplyText(""); } }
                      );
                    }}>
                      <Send className="h-3.5 w-3.5" /> Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InboxPage;
