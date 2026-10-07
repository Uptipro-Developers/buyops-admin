import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Download,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildKycChecklist,
  calculateKycCompletion,
  displayKycValue,
  KYC_DECLARATION_FIELDS,
  KYC_ENTITY_LABELS,
  KYC_PROFILE_FIELDS,
  KYC_STATUS_LABELS,
  requiredDocumentNames,
  type KycDocumentStatus,
  type KycInvestor,
  type KycStatus,
} from "../../lib/kyc";
import { kycApi } from "../../../utils/api-service";
import { formatDate } from "../../../utils/format";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";

const STATUS_STYLES: Record<KycStatus, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400",
  under_review: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400",
  remediation_required: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-400",
  failed: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400",
  pending: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
};

const DOCUMENT_STYLES: Record<KycDocumentStatus, string> = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  missing: "border-slate-200 bg-slate-50 text-slate-500",
};

const DOCUMENT_LABELS: Record<KycDocumentStatus, string> = {
  approved: "Approved",
  pending: "Awaiting review",
  rejected: "Rejected",
  missing: "Not uploaded",
};

function adaptKycCase(record: any): KycInvestor {
  const statusMap: Record<string, KycStatus> = {
    EMAIL_PENDING: "pending",
    PROFILE_PENDING: "pending",
    KYC_PENDING: "pending",
    UNDER_REVIEW: "under_review",
    REMEDIATION_REQUIRED: "remediation_required",
    VERIFIED: "verified",
    REJECTED: "failed",
  };
  return {
    id: record.id,
    name: record.investor.name,
    email: record.investor.email,
    entityType: record.investor.entityType === "FAMILY_OFFICE" ? "family-office" : record.investor.entityType === "INSTITUTION" ? "institution" : "individual",
    investorTrack: record.investor.track === "HARBOR" ? "harbor" : "foundry",
    kycStatus: statusMap[record.investor.onboardingStatus] || "pending",
    kycSubmittedAt: record.submittedAt || null,
    kycVerifiedAt: record.investor.onboardingStatus === "VERIFIED" ? record.reviewedAt : null,
    kycLastRemindedAt: record.lastRemindedAt || null,
    kycRemediationItems: (record.remediationItems || []).map((item: any) => `${item.label} — ${item.reason}`),
    kycProfile: record.profile || {},
    kycDeclarations: record.declarations || {},
    kycDocuments: (record.documents || []).map((document: any) => ({
      id: document.id,
      name: document.label,
      fileUrl: document.downloadUrl,
      fileName: document.originalName,
      status: String(document.status).toLowerCase() as KycDocumentStatus,
      rejectReason: document.rejectionReason || undefined,
    })),
    profileRequirements: (record.requirements?.profileFields || []).map((field: any) => ({ key: field.code, label: field.label })),
    declarationRequirements: (record.requirements?.declarationFields || []).map((field: any) => ({ key: field.code, label: field.label })),
    documentRequirements: (record.requirements?.documents || []).filter((document: any) => document.required).map((document: any) => document.label),
    optionalDocumentRequirements: (record.requirements?.documents || []).filter((document: any) => !document.required).map((document: any) => document.label),
  };
}

export function KycManagement() {
  const [investors, setInvestors] = useState<KycInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"main" | "remediate" | "reject">("main");
  const [remediationSelection, setRemediationSelection] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectedDocumentId, setRejectedDocumentId] = useState<string | null>(null);
  const [documentRejectionReason, setDocumentRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const records = await kycApi.list();
      setInvestors((Array.isArray(records) ? records : []).map(adaptKycCase));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the KYC queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const selected = useMemo(
    () => investors.find((investor) => investor.id === selectedId) || null,
    [investors, selectedId],
  );

  const summary = useMemo(() => {
    const count = (status: KycStatus) => investors.filter((investor) => investor.kycStatus === status).length;
    const average = investors.length
      ? Math.round(investors.reduce((total, investor) => total + calculateKycCompletion(investor).percent, 0) / investors.length)
      : 0;
    return {
      total: investors.length,
      verified: count("verified"),
      underReview: count("under_review"),
      remediation: count("remediation_required"),
      rejected: count("failed"),
      pending: count("pending"),
      average,
    };
  }, [investors]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return investors.filter((investor) => {
      if (statusFilter !== "all" && investor.kycStatus !== statusFilter) return false;
      if (entityFilter !== "all" && investor.entityType !== entityFilter) return false;
      return !search || investor.name.toLowerCase().includes(search) || investor.email.toLowerCase().includes(search);
    });
  }, [entityFilter, investors, query, statusFilter]);

  const completion = selected ? calculateKycCompletion(selected) : null;
  const checklist = selected ? buildKycChecklist(selected) : [];
  const documentRows = selected
    ? [
        ...(selected.documentRequirements || requiredDocumentNames(selected.entityType, selected.investorTrack)),
        ...(selected.optionalDocumentRequirements || []),
      ].map(
        (name) =>
          selected.kycDocuments.find((document) => document.name === name) || {
            id: `missing:${name}`,
            name,
            fileUrl: null,
            status: "missing" as const,
          },
      )
    : [];

  const replaceCase = (record: any) => {
    const adapted = adaptKycCase(record);
    setInvestors((current) => current.map((investor) => investor.id === adapted.id ? adapted : investor));
  };

  const closeReview = () => {
    setSelectedId(null);
    setPanel("main");
    setRemediationSelection([]);
    setRejectionReason("");
    setRejectedDocumentId(null);
    setDocumentRejectionReason("");
  };

  const remind = async (investor: KycInvestor) => {
    setActionLoading(`remind:${investor.id}`);
    try {
      await kycApi.remind(investor.id);
      setInvestors((current) => current.map((item) => item.id === investor.id ? { ...item, kycLastRemindedAt: new Date().toISOString() } : item));
      toast.success(`KYC reminder sent to ${investor.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send the reminder");
    } finally {
      setActionLoading("");
    }
  };

  const approveKyc = async () => {
    if (!selected) return;
    setActionLoading("approve");
    try {
      replaceCase(await kycApi.approve(selected.id));
      toast.success(`KYC verified for ${selected.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve KYC");
    } finally {
      setActionLoading("");
    }
  };

  const startRemediation = () => {
    setRemediationSelection(checklist.filter((item) => !item.done).map((item) => item.id));
    setPanel("remediate");
  };

  const requestRemediation = async () => {
    if (!selected || remediationSelection.length === 0) {
      toast.error("Select at least one remediation item");
      return;
    }
    const items = checklist
      .filter((item) => remediationSelection.includes(item.id))
      .map((item) => ({
        requirementCode: item.id.split(":").slice(1).join(":"),
        category: item.group.toUpperCase() as "PROFILE" | "DOCUMENT" | "DECLARATION",
        label: item.label,
        reason: "Please correct or replace this item and resubmit it for review.",
      }));
    setActionLoading("remediation");
    try {
      replaceCase(await kycApi.remediate(selected.id, items));
      setPanel("main");
      toast.success(`Remediation requested from ${selected.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request remediation");
    } finally {
      setActionLoading("");
    }
  };

  const rejectKyc = async () => {
    if (!selected || !rejectionReason.trim()) {
      toast.error("Provide a rejection reason");
      return;
    }
    setActionLoading("reject");
    try {
      replaceCase(await kycApi.reject(selected.id, rejectionReason.trim()));
      setPanel("main");
      setRejectionReason("");
      toast.success(`KYC rejected for ${selected.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject KYC");
    } finally {
      setActionLoading("");
    }
  };

  const decideDocument = async (documentId: string, status: "approved" | "rejected", reason?: string) => {
    if (documentId.startsWith("missing:")) return;
    setActionLoading(`document:${documentId}`);
    try {
      await kycApi.decideDocument(documentId, status === "approved" ? "APPROVED" : "REJECTED", reason);
      if (selected) replaceCase(await kycApi.detail(selected.id));
      setRejectedDocumentId(null);
      setDocumentRejectionReason("");
      toast.success(status === "approved" ? "Document approved" : "Document rejected for re-upload");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review document");
    } finally {
      setActionLoading("");
    }
  };

  const downloadDocument = async (documentId: string, name: string) => {
    try {
      const blob = await kycApi.downloadDocument(documentId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download document");
    }
  };

  const renderFields = (investor: KycInvestor, type: "profile" | "declarations") => {
    const definitions = type === "profile"
      ? investor.profileRequirements || KYC_PROFILE_FIELDS[investor.entityType]
      : investor.declarationRequirements || KYC_DECLARATION_FIELDS[investor.entityType];
    const values = type === "profile" ? investor.kycProfile : investor.kycDeclarations;
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {definitions.map(({ key, label }) => {
          const value = displayKycValue(key, values[key]);
          return (
            <div key={key}>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className={value ? "text-sm" : "text-sm font-medium text-red-500"}>{value || "Not provided"}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-primary" /> KYC Review
          </h1>
          <p className="text-sm text-muted-foreground">Review, verify and chase incomplete investor KYC / KYB submissions</p>
        </div>
        <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadQueue()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loadError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</div>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard label="Total Records" value={summary.total} note={`${summary.rejected} rejected · ${summary.remediation} remediation`} />
        <SummaryCard label="Verified" value={summary.verified} note="fully approved" valueClass="text-emerald-600" />
        <SummaryCard label="Under Review" value={summary.underReview} note="awaiting decision" valueClass="text-amber-600" />
        <SummaryCard label="Action Needed" value={summary.remediation + summary.rejected} note="remediate or re-submit" valueClass="text-orange-600" />
        <SummaryCard label="Not Submitted" value={summary.pending} note="nudge to finish" valueClass="text-slate-500" />
        <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">Avg. Completion</p><p className="text-2xl font-bold">{summary.average}%</p><Progress value={summary.average} className="mt-1 h-1.5" /></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email…" className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.entries(KYC_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}><SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All entity types</SelectItem>{Object.entries(KYC_ENTITY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading KYC review queue…</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No investors match your filters.</div> : (
          <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Investor</TableHead><TableHead>Entity Type</TableHead><TableHead>Track</TableHead><TableHead>Status</TableHead><TableHead>Completion</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map((investor) => {
            const progress = calculateKycCompletion(investor);
            const canRemind = ["pending", "failed", "remediation_required"].includes(investor.kycStatus);
            return <TableRow key={investor.id}>
              <TableCell><p className="font-medium">{investor.name}</p><p className="text-xs text-muted-foreground">{investor.email}</p></TableCell>
              <TableCell><Badge variant="outline">{KYC_ENTITY_LABELS[investor.entityType]}</Badge></TableCell>
              <TableCell><Badge variant="outline" className={investor.investorTrack === "harbor" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{investor.investorTrack === "harbor" ? "Urbco Harbor" : "Urbco Foundry"}</Badge></TableCell>
              <TableCell><Badge variant="outline" className={STATUS_STYLES[investor.kycStatus]}>{KYC_STATUS_LABELS[investor.kycStatus]}</Badge></TableCell>
              <TableCell><div className="flex items-center gap-2"><Progress value={progress.percent} className="h-1.5 w-24" /><span className="text-xs font-medium tabular-nums">{progress.percent}%</span></div></TableCell>
              <TableCell className="text-sm text-muted-foreground">{investor.kycSubmittedAt ? formatDate(investor.kycSubmittedAt) : "—"}</TableCell>
              <TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setPanel("main"); setSelectedId(investor.id); }}>Review</Button>{canRemind && <Button size="sm" variant="ghost" disabled={actionLoading === `remind:${investor.id}`} onClick={() => void remind(investor)}><Mail className="mr-1 h-4 w-4" /> Remind</Button>}</div></TableCell>
            </TableRow>;
          })}</TableBody></Table></div>
        )}
      </CardContent></Card>

      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) closeReview(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{panel === "remediate" ? `Request Remediation — ${selected?.name || ""}` : panel === "reject" ? `Reject KYC — ${selected?.name || ""}` : `KYC Review — ${selected?.name || ""}`}</DialogTitle><DialogDescription>{selected ? `${selected.email} · ${KYC_ENTITY_LABELS[selected.entityType]} · ${selected.investorTrack === "harbor" ? "Urbco Harbor" : "Urbco Foundry"}${selected.kycSubmittedAt ? ` · submitted ${formatDate(selected.kycSubmittedAt)}` : ""}` : ""}</DialogDescription></DialogHeader>

          {selected && completion && <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            {panel === "main" && <>
              <div className="flex items-center justify-between"><Badge variant="outline" className={STATUS_STYLES[selected.kycStatus]}>{KYC_STATUS_LABELS[selected.kycStatus]}</Badge><div className="text-right"><p className="text-2xl font-bold">{completion.percent}%</p><p className="text-xs text-muted-foreground">complete</p></div></div>
              <div className="grid grid-cols-3 gap-3"><CompletionCard label="Profile" {...completion.profile} /><CompletionCard label="Documents" {...completion.documents} /><CompletionCard label="Declarations" {...completion.declarations} /></div>
              {selected.kycRemediationItems.length > 0 && <div className={`rounded-lg border p-3 text-sm ${selected.kycStatus === "failed" ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}`}><p className="flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />{selected.kycStatus === "failed" ? "Rejected — investor must fix:" : "Remediation required — investor must fix:"}</p><ul className="mt-1 list-inside list-disc text-xs">{selected.kycRemediationItems.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              <ReviewSection title="Profile" icon={User}>{renderFields(selected, "profile")}</ReviewSection>
              {(selected.declarationRequirements || KYC_DECLARATION_FIELDS[selected.entityType]).length > 0 && <ReviewSection title="Declarations" icon={ClipboardCheck}>{renderFields(selected, "declarations")}</ReviewSection>}
              <ReviewSection title={`Documents (${completion.documents.done}/${completion.documents.total} uploaded)`} icon={FileText}>
                <div className="space-y-2">{documentRows.map((document) => <div key={document.id} className="rounded-lg border"><div className="flex flex-wrap items-center justify-between gap-2 p-3"><div className="min-w-0"><p className="text-sm font-medium">{document.name}</p><p className="truncate text-xs text-muted-foreground">{document.fileName || (document.fileUrl ? "Uploaded document" : "Not uploaded")}{document.status === "rejected" && document.rejectReason ? ` · ${document.rejectReason}` : ""}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={DOCUMENT_STYLES[document.status]}>{document.status === "approved" && <CheckCircle2 className="mr-1 h-3 w-3" />}{document.status === "pending" && <Clock className="mr-1 h-3 w-3" />}{document.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}{DOCUMENT_LABELS[document.status]}</Badge>{document.fileUrl && <Button size="sm" variant="ghost" className="h-7" onClick={() => void downloadDocument(document.id, document.fileName || document.name)}><Download className="mr-1 h-3.5 w-3.5" />View</Button>}{document.status === "pending" && <><Button size="sm" variant="ghost" className="h-7 text-emerald-600" disabled={actionLoading === `document:${document.id}`} onClick={() => void decideDocument(document.id, "approved")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Approve</Button><Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => setRejectedDocumentId(document.id)}><XCircle className="mr-1 h-3.5 w-3.5" />Reject</Button></>}{document.status === "missing" && <span className="text-xs text-muted-foreground">Awaiting upload</span>}</div></div>
                {rejectedDocumentId === document.id && <div className="border-t p-3"><Label className="text-xs">Rejection reason shown to the investor</Label><Textarea value={documentRejectionReason} onChange={(event) => setDocumentRejectionReason(event.target.value)} className="mt-1 h-16 text-sm" placeholder="Explain what must be corrected" /><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setRejectedDocumentId(null)}>Cancel</Button><Button size="sm" variant="destructive" disabled={!documentRejectionReason.trim() || actionLoading === `document:${document.id}`} onClick={() => void decideDocument(document.id, "rejected", documentRejectionReason.trim())}>Confirm Reject</Button></div></div>}</div>)}</div>
              </ReviewSection>
            </>}

            {panel === "remediate" && <div className="space-y-4"><p className="text-sm text-muted-foreground">Select everything the investor must correct. These items will appear in the investor remediation notice.</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setRemediationSelection(checklist.filter((item) => !item.done).map((item) => item.id))}>Select incomplete</Button><Button size="sm" variant="outline" onClick={() => setRemediationSelection(checklist.map((item) => item.id))}>Select all</Button><Button size="sm" variant="outline" onClick={() => setRemediationSelection([])}>Clear</Button></div>{(["Profile", "Document", "Declaration"] as const).map((group) => { const items = checklist.filter((item) => item.group === group); return items.length ? <div key={group}><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{group}</p><div className="space-y-2">{items.map((item) => <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"><Checkbox checked={remediationSelection.includes(item.id)} onCheckedChange={(checked) => setRemediationSelection((current) => checked === true ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} /><span className="flex-1">{item.label}</span><span className={item.done ? "text-xs text-emerald-600" : "text-xs font-medium text-red-500"}>{item.done ? "Done" : "Incomplete"}</span></label>)}</div></div> : null; })}</div>}

            {panel === "reject" && <div className="space-y-3"><div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm"><p className="flex items-center gap-2 font-medium text-red-700"><AlertTriangle className="h-4 w-4" />The investor will see this reason and may resubmit.</p></div><Label htmlFor="kyc-rejection-reason">Rejection reason</Label><Textarea id="kyc-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="h-24" placeholder="Explain why the submission cannot be accepted" /></div>}
          </div>}

          <DialogFooter className="gap-2 sm:justify-between">
            {panel === "main" && <><p className="order-2 text-xs text-muted-foreground sm:order-1">{selected?.kycLastRemindedAt ? `Last reminder: ${formatDate(selected.kycLastRemindedAt)}` : "No reminder sent yet"}</p><div className="order-1 flex flex-wrap justify-end gap-2 sm:order-2"><Button variant="ghost" size="sm" disabled={!!actionLoading} onClick={() => { if (selected) void remind(selected); }}><Mail className="mr-1 h-4 w-4" />Remind</Button><Button variant="outline" size="sm" disabled={!!actionLoading || selected?.kycStatus === "failed"} onClick={() => setPanel("reject")}>Reject KYC</Button><Button variant="secondary" size="sm" disabled={!!actionLoading} onClick={startRemediation}>Request Remediation</Button><Button size="sm" disabled={!!actionLoading || selected?.kycStatus !== "under_review"} onClick={() => void approveKyc()}>{actionLoading === "approve" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}Approve KYC</Button></div></>}
            {panel === "remediate" && <><Button variant="ghost" size="sm" disabled={!!actionLoading} onClick={() => setPanel("main")}>Back</Button><Button size="sm" disabled={!!actionLoading} onClick={() => void requestRemediation()}>{actionLoading === "remediation" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Send Remediation Request ({remediationSelection.length})</Button></>}
            {panel === "reject" && <><Button variant="ghost" size="sm" disabled={!!actionLoading} onClick={() => setPanel("main")}>Back</Button><Button variant="destructive" size="sm" disabled={!!actionLoading} onClick={() => void rejectKyc()}>{actionLoading === "reject" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Confirm Rejection</Button></>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, note, valueClass = "" }: { label: string; value: number; note: string; valueClass?: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className={`text-2xl font-bold ${valueClass}`}>{value}</p><p className="text-[11px] text-muted-foreground">{note}</p></CardContent></Card>;
}

function CompletionCard({ label, done, total }: { label: string; done: number; total: number }) {
  return <div className="rounded-lg border p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-sm font-semibold">{done}/{total}</p><Progress value={(done / Math.max(total, 1)) * 100} className="mt-1 h-1.5" /></div>;
}

function ReviewSection({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return <section><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h3>{children}</section>;
}
