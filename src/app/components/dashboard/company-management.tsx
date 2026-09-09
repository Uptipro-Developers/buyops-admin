import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { companiesApi } from "../../../utils/api-service";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth-provider";
import { formatDate } from "../../../utils/format";

type CompanyForm = {
  name: string;
  type: string;
  registrationNumber: string;
  status: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  // activeAssets: string;
  // totalTransactions: string;
  agreementStartDate: string;
  agreementExpiryDate: string;
  commissionRate: string;
  paymentTerms: string;
  notes: string;
  bankAccountName: string;
  bankName: string;
  accountNumber: string;
};

const EMPTY_FORM: CompanyForm = {
  name: "",
  type: "",
  registrationNumber: "",
  status: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  // activeAssets: "0",
  // totalTransactions: "0",
  agreementStartDate: "",
  agreementExpiryDate: "",
  commissionRate: "",
  paymentTerms: "",
  notes: "",
  bankAccountName: "",
  bankName: "",
  accountNumber: "",
};

const REQUIRED_FIELDS: Array<keyof CompanyForm> = [
  "name",
  "type",
  "contactPerson",
  "email",
  "phone",
  "agreementStartDate",
  "agreementExpiryDate",
  "commissionRate",
];

const normalizeDateInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const normalizeStatus = (status?: string) => (status || "").toLowerCase();

const getCompanyFormErrors = (form: CompanyForm) => {
  const errors: Partial<Record<keyof CompanyForm, string>> = {};
  const isEmpty = (value: string) => value.trim().length === 0;
  const email = form.email.trim();
  const phoneDigits = form.phone.replace(/\D/g, "");
  const accountDigits = form.accountNumber.replace(/\D/g, "");
  const commissionValue = Number(form.commissionRate);
  const startDate = form.agreementStartDate.trim();
  const expiryDate = form.agreementExpiryDate.trim();

  REQUIRED_FIELDS.forEach((field) => {
    if (isEmpty(String(form[field] || ""))) {
      errors[field] = "This field is required.";
    }
  });

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (
    form.commissionRate &&
    (!Number.isFinite(commissionValue) || commissionValue <= 0)
  ) {
    errors.commissionRate = "Enter a commission rate greater than 0.";
  }

  if (form.commissionRate && commissionValue > 100) {
    errors.commissionRate = "Commission rate cannot exceed 100%.";
  }

  if (accountDigits && accountDigits.length !== 10) {
    errors.accountNumber = "Account number must be 10 digits.";
  }

  if (startDate && expiryDate) {
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(expiry.getTime())) {
      if (start > expiry) {
        errors.agreementExpiryDate = "Expiry date must be after start date.";
      }
    }
  }

  return errors;
};

const buildPayload = (form: CompanyForm) => ({
  ...form,
  status: String(form.status || ""),
  // activeAssets: Number(form.activeAssets || 0),
  // totalTransactions: Number(form.totalTransactions || 0),
  commissionRate: Number(form.commissionRate || 0),
  accountName: form.bankAccountName,
});

const toForm = (company: any): CompanyForm => ({
  name: company?.name || "",
  type: company?.type || "",
  registrationNumber: company?.registrationNumber || "",
  status: String(company?.status || ""),
  contactPerson: company?.contactPerson || "",
  email: company?.email || "",
  phone: company?.phone || "",
  address: company?.address || "",
  // activeAssets: String(company?.activeAssets ?? 0),
  // totalTransactions: String(company?.totalTransactions ?? 0),
  agreementStartDate: normalizeDateInput(
    company?.agreementStartDate || company?.agreementDate,
  ),
  agreementExpiryDate: normalizeDateInput(
    company?.agreementExpiryDate || company?.agreementExpiry,
  ),
  commissionRate: String(company?.commissionRate ?? ""),
  paymentTerms: company?.paymentTerms || "",
  notes: company?.notes || "",
  // Backward-compatible key from backend model
  bankName: company?.bankName || "",
  accountNumber: company?.accountNumber || "",
  bankAccountName: company?.bankAccountName || company?.accountName || "",
});

const extractError = (error: any) => {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || error?.message || "Request failed";
};

export function CompanyManagement() {
  const { data: user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewCompany, setViewCompany] = useState<any | null>(null);
  const [editCompany, setEditCompany] = useState<any | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyForm>(EMPTY_FORM);
  const [editFormData, setEditFormData] = useState<CompanyForm>(EMPTY_FORM);
  const [editBaseline, setEditBaseline] = useState<CompanyForm>(EMPTY_FORM);
  const [createAttempted, setCreateAttempted] = useState(false);

  const createErrors = useMemo(
    () => getCompanyFormErrors(formData),
    [formData],
  );

  const isCreateValid = useMemo(
    () => Object.keys(createErrors).length === 0,
    [createErrors],
  );

  const isEditValid = useMemo(
    () =>
      REQUIRED_FIELDS.every(
        (field) => String(editFormData[field]).trim().length > 0,
      ),
    [editFormData],
  );

  const isEditDirty = useMemo(
    () => JSON.stringify(editFormData) !== JSON.stringify(editBaseline),
    [editFormData, editBaseline],
  );

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll();
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.companies)
          ? data.companies
          : Array.isArray(data?.items)
            ? data.items
            : [];
      setCompanies(rows);
    } catch (error: any) {
      toast.error(extractError(error));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async () => {
    if (!isCreateValid) {
      setCreateAttempted(true);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      const created = await companiesApi.create(buildPayload(formData));
      setCompanies((prev) => [...prev, created]);
      setCreateDialogOpen(false);
      setFormData(EMPTY_FORM);
      setCreateAttempted(false);
      toast.success("Company created successfully");
    } catch (error: any) {
      toast.error(extractError(error));
    }
  };

  const openEdit = (company: any) => {
    const next = toForm(company);
    setEditCompany(company);
    setEditBaseline(next);
    setEditFormData(next);
    setViewCompany(null);
    setEditDialogOpen(true);
  };

  const handleUpdateCompany = async () => {
    if (!editCompany || !isEditValid || !isEditDirty) return;
    try {
      const updated = await companiesApi.update(
        editCompany.id,
        buildPayload(editFormData),
      );
      setCompanies((prev) =>
        prev.map((c) => (c.id === editCompany.id ? updated : c)),
      );
      setEditDialogOpen(false);
      setEditCompany(null);
      toast.success("Company updated successfully");
    } catch (error: any) {
      toast.error(extractError(error));
    }
  };

  const confirmDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      await companiesApi.delete(companyToDelete);
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete));
      toast.success("Company deleted successfully");
    } catch (error: any) {
      toast.error(extractError(error));
    } finally {
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const statusBadge = (rawStatus?: string) => {
    const status = normalizeStatus(rawStatus);
    if (status === "active") return "bg-accent text-accent-foreground";
    if (status === "inactive")
      return "bg-destructive text-destructive-foreground";
    if (status === "pending") return "bg-warning text-warning-foreground";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-2">
        <Button
          variant="default"
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading companies...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Total Assets</TableHead>
                    <TableHead>Total Transactions</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-mono text-sm">
                        {company.serialId || company.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {company.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{company.contactPerson}</TableCell>
                      <TableCell className="text-center">
                        {company._count.assets ?? 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {company.totalTransactions ?? 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        {company.commissionRate}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusBadge(company.status)}
                          variant="outline"
                        >
                          {String(company.status || "UNKNOWN").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewCompany(company)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(company)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCompanyToDelete(company.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setFormData(EMPTY_FORM);
            setCreateAttempted(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Add a new company partner to the platform
            </DialogDescription>
          </DialogHeader>
          <CompanyFormFields
            formData={formData}
            setFormData={setFormData}
            prefix="create"
            errors={createErrors}
            showErrors={createAttempted}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCompany}>Create Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company partner details
            </DialogDescription>
          </DialogHeader>
          <CompanyFormFields
            formData={editFormData}
            setFormData={setEditFormData}
            prefix="edit"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCompany}
              disabled={!isEditValid || !isEditDirty}
            >
              Update Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCompany}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!viewCompany} onOpenChange={() => setViewCompany(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {viewCompany && (
            <>
              <SheetHeader>
                <SheetTitle>{viewCompany.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <Detail
                  label="Company ID"
                  value={viewCompany.serialId || viewCompany.id}
                  mono
                />
                <Detail label="Type" value={viewCompany.type.toUpperCase()} />
                <Detail
                  label="Status"
                  value={String(viewCompany.status || "UNKNOWN").toUpperCase()}
                />
                <Detail
                  label="Registration Number"
                  value={viewCompany.registrationNumber}
                />
                <Detail
                  label="Contact Person"
                  value={viewCompany.contactPerson}
                />
                <Detail label="Email" value={viewCompany.email} />
                <Detail label="Phone" value={viewCompany.phone} />
                <Detail label="Address" value={viewCompany.address} />
                <Detail
                  label="Payment Terms"
                  value={viewCompany.paymentTerms}
                />
                <Detail label="Bank Name" value={viewCompany.bankName} />
                <Detail
                  label="Account Name"
                  value={viewCompany.bankAccountName || viewCompany.accountName}
                />
                <Detail
                  label="Account Number"
                  value={viewCompany.accountNumber}
                />
                <Detail
                  label="Agreement Start Date"
                  value={formatDate(
                    viewCompany.agreementStartDate || viewCompany.agreementDate,
                    user?.dateFormat,
                    user?.timezone,
                  )}
                />
                <Detail
                  label="Agreement Expiry Date"
                  value={formatDate(
                    viewCompany.agreementExpiryDate ||
                      viewCompany.agreementExpiry,
                    user?.dateFormat,
                    user?.timezone,
                  )}
                />
                <Detail label="Notes" value={viewCompany.notes} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? "font-mono" : ""}>{value || "—"}</div>
    </div>
  );
}

function CompanyFormFields({
  formData,
  setFormData,
  prefix,
  errors,
  showErrors,
}: {
  formData: CompanyForm;
  setFormData: Dispatch<SetStateAction<CompanyForm>>;
  prefix: string;
  errors?: Partial<Record<keyof CompanyForm, string>>;
  showErrors?: boolean;
}) {
  const update = (field: keyof CompanyForm, value: string) =>
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "commissionRate"
          ? String(value).replace(/^0+(?=\d)/, "")
          : value,
    }));

  const fieldError = (field: keyof CompanyForm) =>
    showErrors ? errors?.[field] : undefined;

  return (
    <div className="grid gap-6 py-4">
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Company ID</Label>
          <Input
            value="Auto-generated"
            disabled
            className="bg-muted text-muted-foreground"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-company-name`}>
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${prefix}-company-name`}
            value={formData.name}
            onChange={(e) => update("name", e.target.value)}
          />
          {fieldError("name") && (
            <p className="text-sm text-destructive">{fieldError("name")}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-company-type`}>
              Company Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => update("type", value)}
            >
              <SelectTrigger id={`${prefix}-company-type`}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="realtor">Realtor</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
              </SelectContent>
            </Select>
            {fieldError("type") && (
              <p className="text-sm text-destructive">{fieldError("type")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-registration`}>
              Registration Number
            </Label>
            <Input
              id={`${prefix}-registration`}
              value={formData.registrationNumber}
              onChange={(e) => update("registrationNumber", e.target.value)}
            />
            {fieldError("registrationNumber") && (
              <p className="text-sm text-destructive">
                {fieldError("registrationNumber")}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-status`}>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => update("status", value)}
          >
            <SelectTrigger id={`${prefix}-status`}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">ACTIVE</SelectItem>
              <SelectItem value="pending">PENDING</SelectItem>
              <SelectItem value="inactive">INACTIVE</SelectItem>
            </SelectContent>
          </Select>
          {fieldError("status") && (
            <p className="text-sm text-destructive">{fieldError("status")}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-contact`}>
              Contact Person <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${prefix}-contact`}
              value={formData.contactPerson}
              onChange={(e) => update("contactPerson", e.target.value)}
            />
            {fieldError("contactPerson") && (
              <p className="text-sm text-destructive">
                {fieldError("contactPerson")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-email`}>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${prefix}-email`}
              type="email"
              value={formData.email}
              onChange={(e) => update("email", e.target.value)}
            />
            {fieldError("email") && (
              <p className="text-sm text-destructive">{fieldError("email")}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-phone`}>
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${prefix}-phone`}
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
          {fieldError("phone") && (
            <p className="text-sm text-destructive">{fieldError("phone")}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-address`}>Address</Label>
          <Textarea
            id={`${prefix}-address`}
            rows={2}
            value={formData.address}
            onChange={(e) => update("address", e.target.value)}
          />
          {fieldError("address") && (
            <p className="text-sm text-destructive">{fieldError("address")}</p>
          )}
        </div>
        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`${prefix}-assets`}>Total Assets</Label>
            <Input
              id={`${prefix}-assets`}
              type="number"
              value={formData.activeAssets}
              onChange={(e) => update("activeAssets", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${prefix}-transactions`}>Total Transactions</Label>
            <Input
              id={`${prefix}-transactions`}
              type="number"
              value={formData.totalTransactions}
              onChange={(e) => update("totalTransactions", e.target.value)}
            />
          </div>
        </div> */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-start-date`}>
              Agreement Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${prefix}-start-date`}
              type="date"
              value={formData.agreementStartDate}
              onChange={(e) => update("agreementStartDate", e.target.value)}
            />
            {fieldError("agreementStartDate") && (
              <p className="text-sm text-destructive">
                {fieldError("agreementStartDate")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-expiry-date`}>
              Agreement Expiry Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${prefix}-expiry-date`}
              type="date"
              value={formData.agreementExpiryDate}
              onChange={(e) => update("agreementExpiryDate", e.target.value)}
            />
            {fieldError("agreementExpiryDate") && (
              <p className="text-sm text-destructive">
                {fieldError("agreementExpiryDate")}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-commission`}>
              Commission Rate (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${prefix}-commission`}
              type="number"
              step="0.1"
              value={formData.commissionRate}
              onChange={(e) => update("commissionRate", e.target.value)}
            />
            {fieldError("commissionRate") && (
              <p className="text-sm text-destructive">
                {fieldError("commissionRate")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-terms`}>Payment Terms</Label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => update("paymentTerms", value)}
            >
              <SelectTrigger id={`${prefix}-terms`}>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full payment within the next 30 days">
                  Next 30 days
                </SelectItem>
                <SelectItem value="Full payment within the next 60 days">
                  Next 60 days
                </SelectItem>
                <SelectItem value="Full payment within the next 90 days">
                  Next 90 days
                </SelectItem>
                <SelectItem value="Full payment immediately">
                  Immediate
                </SelectItem>
              </SelectContent>
            </Select>
            {fieldError("paymentTerms") && (
              <p className="text-sm text-destructive">
                {fieldError("paymentTerms")}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-notes`}>Notes</Label>
          <Textarea
            id={`${prefix}-notes`}
            rows={2}
            value={formData.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
          {fieldError("notes") && (
            <p className="text-sm text-destructive">{fieldError("notes")}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-bank-name`}>Bank Name</Label>
            <Input
              id={`${prefix}-bank-name`}
              value={formData.bankName}
              onChange={(e) => update("bankName", e.target.value)}
            />
            {fieldError("bankName") && (
              <p className="text-sm text-destructive">
                {fieldError("bankName")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-account-name`}>Account Name</Label>
            <Input
              id={`${prefix}-account-name`}
              value={formData.bankAccountName}
              onChange={(e) => update("bankAccountName", e.target.value)}
            />
            {fieldError("bankAccountName") && (
              <p className="text-sm text-destructive">
                {fieldError("bankAccountName")}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${prefix}-account-number`}>Account Number</Label>
            <Input
              id={`${prefix}-account-number`}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.accountNumber}
              onChange={(e) =>
                update("accountNumber", e.target.value.replace(/\D/g, ""))
              }
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  ![
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "ArrowUp",
                    "ArrowDown",
                    "Tab",
                    "Enter",
                  ].includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text");
                update("accountNumber", text.replace(/\D/g, ""));
              }}
            />
            {fieldError("accountNumber") && (
              <p className="text-sm text-destructive">
                {fieldError("accountNumber")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
