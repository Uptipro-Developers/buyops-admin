import { useState, useEffect, useRef } from "react";
import { formatDate } from "../../../utils/format";
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
import {
  assetsApi,
  companiesApi,
  resolveMediaUrl,
} from "../../../utils/api-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Plus,
  Star,
  Upload,
  FileText,
  Video,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Filter,
  X,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { toast } from "sonner";

export function AssetManagement() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [viewAsset, setViewAsset] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [assets, setAssets] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const extractError = (err: any) => {
    const message = err?.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message || err?.message || "Request failed";
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [a, c] = await Promise.all([
          assetsApi.getAll(),
          companiesApi.getAll(),
        ]);
        setAssets(a);
        setCompanies(c);
      } catch (error) {
        // handle error
      }
    }
    fetchData();
  }, []);

  // Form state
  const INITIAL_FORM_DATA = {
    // Step 1
    name: "",
    referenceCode: "",
    type: "",
    projectStatus: "",
    location: "",
    address: "",
    company: "",
    landSize: "",
    builtSize: "",
    constructionStart: "",
    constructionEnd: "",
    // Step 2
    propertyCategory: "",
    totalUnits: "",
    availableUnits: "",
    unitConfiguration: [] as string[],
    furnishingStatus: "",
    sharedFacilities: [] as string[],
    facilityManagement: true,
    // Step 3
    ownershipType: "Full",
    fractionTotal: "",
    costPerFraction: "",
    landUnitType: "",
    landUnitCount: "",
    // Step 4
    basePrice: "",
    markup: "",
    paymentOptions: [] as string[],
    installmentPeriods: [] as string[],
    downPaymentAmount: "",
    offPlanDiscount: "",
    stageBasedDiscount: "",
    // Step 5
    projectedRentalIncome: "",
    rentalFrequency: "Annual",
    operatingCost: "",
    capitalAppreciation: "",
    firstPayoutDate: "",
    rentalYieldMin: "",
    rentalYieldMax: "",
    capitalAppreciationMin: "",
    capitalAppreciationMax: "",
    totalReturnsMin: "",
    totalReturnsMax: "",
    // Step 6
    constructionProgress: "",
    riskLevel: "Low",
    riskFactors: [] as string[],
    customRiskFactor: "",
    offPlanSecurity: "",
    exitLiquidity: "High",
    managementMode: "BuyOps-managed",
    // Step 7
    images: 0,
    documents: 0,
    virtualTours: 0,
    // Step 8
    leadCommission: "",
    closerCommission: "",
    // Step 9
    status: "draft",
  };

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [customFacilityInput, setCustomFacilityInput] = useState("");
  const [customUnitInput, setCustomUnitInput] = useState("");
  const [markupPct, setMarkupPct] = useState("");
  const [customPctInput, setCustomPctInput] = useState("");

  const handleMarkupPctChange = (pct: string) => {
    setMarkupPct(pct);
    if (pct !== "CUSTOM" && pct) {
      const base = parseFloat(formData.basePrice) || 0;
      const amount = ((parseFloat(pct) / 100) * base).toFixed(0);
      updateFormData("markup", amount);
    } else if (pct === "CUSTOM") {
      setCustomPctInput("");
      updateFormData("markup", "");
    }
  };

  const handleCustomPctChange = (pct: string) => {
    setCustomPctInput(pct);
    const base = parseFloat(formData.basePrice) || 0;
    const num = parseFloat(pct);
    updateFormData(
      "markup",
      !pct || isNaN(num) ? "" : ((num / 100) * base).toFixed(0),
    );
  };

  const locations = Array.from(new Set(assets.map((a) => a.location)));

  const filteredAssets = assets.filter((asset) => {
    const typeMatch =
      filterType === "all" ||
      asset.type.toLowerCase() === filterType.toLowerCase();
    const statusMatch =
      filterStatus === "all" ||
      String(asset.status || "").toLowerCase() ===
        String(filterStatus).toLowerCase();
    const locationMatch =
      filterLocation === "all" || asset.location === filterLocation;
    const sourceMatch =
      filterSource === "all" ||
      (filterSource === "urbco"
        ? !!asset.urbcoPropertyId
        : !asset.urbcoPropertyId);
    return typeMatch && statusMatch && locationMatch && sourceMatch;
  });

  const totalSteps = 9;

  const validateStep1 = () => {
    const requiredFields = [
      { field: "name", label: "Asset Name" },
      { field: "referenceCode", label: "Asset Reference Code" },
      { field: "type", label: "Asset Type" },
      { field: "projectStatus", label: "Project Status" },
      { field: "location", label: "Location" },
      { field: "address", label: "Full Address" },
      { field: "company", label: "Company" },
    ];

    const missingFields = requiredFields.filter(
      ({ field }) => !formData[field as keyof typeof formData],
    );

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map((f) => f.label).join(", ");
      toast.error(`Please fill in all required fields: ${fieldNames}`);
      return false;
    }

    // Validate end date is not before start date
    if (formData.constructionStart && formData.constructionEnd) {
      const start = new Date(formData.constructionStart);
      const end = new Date(formData.constructionEnd);
      if (end < start) {
        toast.error("End date cannot be before start date.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    // Skip step 2 (Physical & Functional Details) for Land type
    if (currentStep === 1 && formData.type === "Land") {
      setCurrentStep(3);
      return;
    }
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    // Skip step 2 when going back if type is Land
    if (currentStep === 3 && formData.type === "Land") {
      setCurrentStep(1);
      return;
    }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      const [a, c] = await Promise.all([
        assetsApi.getAll(),
        companiesApi.getAll(),
      ]);
      setAssets(a);
      setCompanies(c);
    } catch (err) {
      // handle error
    }
  };

  const buildAssetPayload = (data: typeof formData) => {
    const {
      company,
      sharedFacilities,
      costPerFraction,
      basePrice,
      furnishingStatus,
      constructionProgress,
      ...rest
    } = data as any;

    return {
      ...rest,
      companyId: company,
      // Map frontend field names to backend field names
      facilities: sharedFacilities,
      fractionCost: costPerFraction,
      price: basePrice,
      furnished: furnishingStatus,
      constructionStage: constructionProgress,
      unitConfiguration: Array.isArray(data.unitConfiguration)
        ? (data.unitConfiguration as string[]).join(", ")
        : data.unitConfiguration || "",
    };
  };

  const handleSubmit = async (statusOverride?: string) => {
    if (!formData.company) {
      const message = "Please select a company";
      setError(message);
      toast.error(message);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dataToSubmit = statusOverride
        ? { ...formData, status: statusOverride }
        : formData;
      const createdAsset = await assetsApi.create(
        buildAssetPayload(dataToSubmit),
      );

      // Upload images if any
      if (uploadedImages.length > 0) {
        const imageFormData = new FormData();
        uploadedImages.forEach((file) => {
          imageFormData.append("images", file);
        });
        try {
          await assetsApi.uploadImages(createdAsset.id, imageFormData);
          toast.success(`${uploadedImages.length} image(s) uploaded`);
        } catch (imgErr) {
          console.error("Image upload failed:", imgErr);
          toast.error("Some images failed to upload");
        }
      }

      // Upload documents if any
      if (uploadedDocuments.length > 0) {
        const docFormData = new FormData();
        uploadedDocuments.forEach((file) => {
          docFormData.append("documents", file);
        });
        try {
          await assetsApi.uploadDocuments(createdAsset.id, docFormData);
          toast.success(`${uploadedDocuments.length} document(s) uploaded`);
        } catch (docErr) {
          console.error("Document upload failed:", docErr);
          toast.error("Some documents failed to upload");
        }
      }

      await fetchAssets();
      setCreateDialogOpen(false);
      setCurrentStep(1);
      setFormData(INITIAL_FORM_DATA);
      setMarkupPct("");
      setCustomPctInput("");
      // Reset file uploads
      setUploadedImages([]);
      setUploadedDocuments([]);
      toast.success("Asset created successfully");
    } catch (err: any) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assetId: string) => {
    setSelectedAssetId(assetId);
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setFormData({
        name: asset.name,
        referenceCode: asset.referenceCode ?? "",
        type: asset.type,
        projectStatus: asset.projectStatus,
        location: asset.location,
        address: asset.address ?? "",
        company: asset.company?.id ?? asset.companyId ?? "",
        landSize: asset.landSize ?? "",
        builtSize: asset.builtSize ?? "",
        constructionStart: asset.constructionStart ?? "",
        constructionEnd: asset.constructionEnd ?? "",
        propertyCategory: asset.propertyCategory ?? "",
        totalUnits: asset.totalUnits?.toString() ?? "",
        availableUnits: asset.availableUnits?.toString() ?? "",
        unitConfiguration: asset.unitConfiguration
          ? asset.unitConfiguration.split(", ").filter(Boolean)
          : [],
        furnishingStatus: asset.furnished ?? "",
        sharedFacilities: asset.facilities ?? [],
        facilityManagement: asset.facilityManagement ?? true,
        ownershipType: (() => {
          const ot = asset.ownershipType ?? "Full";
          if (ot.toLowerCase() === "fractional") return "Fractional";
          return "Full";
        })(),
        fractionTotal: asset.fractionTotal?.toString() ?? "",
        costPerFraction: asset.fractionCost?.toString() ?? "",
        landUnitType: asset.landUnitType ?? "",
        landUnitCount: asset.landUnitCount?.toString() ?? "",
        basePrice: asset.price?.toString() ?? "",
        markup: asset.markup?.toString() ?? "",
        paymentOptions: asset.paymentOptions ?? [],
        installmentPeriods: asset.installmentPeriods ?? [],
        downPaymentAmount: asset.downPaymentAmount?.toString() ?? "",
        offPlanDiscount: asset.offPlanDiscount?.toString() ?? "",
        stageBasedDiscount: asset.stageBasedDiscount?.toString() ?? "",
        projectedRentalIncome: asset.projectedRentalIncome?.toString() ?? "",
        rentalFrequency: asset.rentalFrequency ?? "Annual",
        operatingCost: asset.operatingCost?.toString() ?? "",
        capitalAppreciation: asset.capitalAppreciation?.toString() ?? "",
        firstPayoutDate: asset.firstPayoutDate ?? "",
        rentalYieldMin: asset.rentalYieldMin?.toString() ?? "",
        rentalYieldMax: asset.rentalYieldMax?.toString() ?? "",
        capitalAppreciationMin: asset.capitalAppreciationMin?.toString() ?? "",
        capitalAppreciationMax: asset.capitalAppreciationMax?.toString() ?? "",
        totalReturnsMin: asset.totalReturnsMin?.toString() ?? "",
        totalReturnsMax: asset.totalReturnsMax?.toString() ?? "",
        constructionProgress: asset.constructionStage?.toString() ?? "",
        riskLevel: asset.riskLevel ?? "Low",
        riskFactors: asset.riskFactors ?? [],
        customRiskFactor: "",
        offPlanSecurity: asset.offPlanSecurity ?? "",
        exitLiquidity: asset.exitLiquidity ?? "High",
        managementMode: asset.managementMode ?? "BuyOps-managed",
        images: asset.images?.length ?? 0,
        documents: asset.documents?.length ?? 0,
        virtualTours:
          typeof asset.virtualTours === "number" ? asset.virtualTours : 0,
        leadCommission: asset.leadCommission?.toString() ?? "",
        closerCommission: asset.closerCommission?.toString() ?? "",
        status: asset.status,
      });
      setEditDialogOpen(true);
      setMarkupPct("CUSTOM"); // Show existing markup as custom amount when editing
      if (asset.markup && asset.price) {
        setCustomPctInput(((asset.markup / asset.price) * 100).toFixed(2));
      }
    }
  };

  const handleUpdate = async () => {
    if (!selectedAssetId) return;
    setLoading(true);
    setError(null);
    try {
      await assetsApi.update(selectedAssetId, buildAssetPayload(formData));
      await fetchAssets();
      setEditDialogOpen(false);
      setCurrentStep(1);
      setFormData(INITIAL_FORM_DATA);
      setMarkupPct("");
      setCustomPctInput("");
      setSelectedAssetId(null);
      toast.success("Asset updated successfully");
    } catch (err: any) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (assetId: string) => {
    setSelectedAssetId(assetId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssetId) return;
    setLoading(true);
    setError(null);
    try {
      await assetsApi.delete(selectedAssetId);
      await fetchAssets();
      setDeleteDialogOpen(false);
      setSelectedAssetId(null);
      toast.success("Asset deleted successfully");
    } catch (err: any) {
      const message = extractError(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (asset) {
      setViewAsset(asset);
      setViewDialogOpen(true);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFacility = (facility: string) => {
    setFormData((prev) => ({
      ...prev,
      sharedFacilities: prev.sharedFacilities.includes(facility)
        ? prev.sharedFacilities.filter((f) => f !== facility)
        : [...prev.sharedFacilities, facility],
    }));
  };

  const toggleUnitConfig = (config: string) => {
    setFormData((prev) => ({
      ...prev,
      unitConfiguration: (prev.unitConfiguration as string[]).includes(config)
        ? (prev.unitConfiguration as string[]).filter((c) => c !== config)
        : [...(prev.unitConfiguration as string[]), config],
    }));
  };

  const togglePaymentOption = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentOptions: prev.paymentOptions.includes(option)
        ? prev.paymentOptions.filter((o) => o !== option)
        : [...prev.paymentOptions, option],
    }));
  };

  const toggleInstallmentPeriod = (period: string) => {
    setFormData((prev) => ({
      ...prev,
      installmentPeriods: prev.installmentPeriods.includes(period)
        ? prev.installmentPeriods.filter((p) => p !== period)
        : [...prev.installmentPeriods, period],
    }));
  };

  const toggleRiskFactor = (factor: string) => {
    setFormData((prev) => ({
      ...prev,
      riskFactors: prev.riskFactors.includes(factor)
        ? prev.riskFactors.filter((f) => f !== factor)
        : [...prev.riskFactors, factor],
    }));
  };

  const addCustomRiskFactor = () => {
    if (formData.customRiskFactor.trim()) {
      setFormData((prev) => ({
        ...prev,
        riskFactors: [...prev.riskFactors, formData.customRiskFactor.trim()],
        customRiskFactor: "",
      }));
    }
  };

  const removeRiskFactor = (factor: string) => {
    setFormData((prev) => ({
      ...prev,
      riskFactors: prev.riskFactors.filter((f) => f !== factor),
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setUploadedImages((prev) => [...prev, ...newImages]);
      setFormData((prev) => ({
        ...prev,
        images: prev.images + newImages.length,
      }));
      toast.success(`${newImages.length} image(s) added`);
    }
  };

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocuments = Array.from(files);
      setUploadedDocuments((prev) => [...prev, ...newDocuments]);
      setFormData((prev) => ({
        ...prev,
        documents: prev.documents + newDocuments.length,
      }));
      toast.success(`${newDocuments.length} document(s) added`);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, images: prev.images - 1 }));
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({ ...prev, documents: prev.documents - 1 }));
  };

  // Calculated values
  const finalPrice =
    (parseFloat(formData.basePrice) || 0) + (parseFloat(formData.markup) || 0);
  const rentalYield =
    formData.projectedRentalIncome && finalPrice > 0
      ? (
          (parseFloat(formData.projectedRentalIncome) / finalPrice) *
          100
        ).toFixed(2)
      : "0.00";
  const totalAnnualReturn =
    rentalYield && formData.capitalAppreciation
      ? (
          parseFloat(rentalYield) + parseFloat(formData.capitalAppreciation)
        ).toFixed(2)
      : "0.00";
  const totalCommission =
    (parseFloat(formData.leadCommission) || 0) +
    (parseFloat(formData.closerCommission) || 0);
  const fundingProgress =
    formData.ownershipType === "Fractional" && formData.fractionTotal
      ? Math.floor(Math.random() * 100)
      : 100;

  const clearFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterLocation("all");
    setFilterSource("all");
  };

  const hasActiveFilters =
    filterType !== "all" ||
    filterStatus !== "all" ||
    filterLocation !== "all" ||
    filterSource !== "all";
  const assetTypes = Array.from(
    new Set(assets.map((a) => String(a.type || "").trim()).filter(Boolean)),
  );
  const assetStatuses = Array.from(
    new Set(assets.map((a) => String(a.status || "").trim()).filter(Boolean)),
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              <Dialog
                open={createDialogOpen}
                onOpenChange={(open) => {
                  setCreateDialogOpen(open);
                  if (!open) {
                    setFormData(INITIAL_FORM_DATA);
                    setCurrentStep(1);
                    setUploadedImages([]);
                    setUploadedDocuments([]);
                    setMarkupPct("");
                    setCustomPctInput("");
                    setError(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Create New Asset</DialogTitle>
                    <DialogDescription>
                      Step {currentStep} of {totalSteps}:{" "}
                      {currentStep === 1
                        ? "Asset Identity & Status"
                        : currentStep === 2
                          ? "Physical & Functional Details"
                          : currentStep === 3
                            ? "Investment Structure"
                            : currentStep === 4
                              ? "Pricing & Payment Logic"
                              : currentStep === 5
                                ? "Returns & Projections"
                                : currentStep === 6
                                  ? "Risk & Transparency"
                                  : currentStep === 7
                                    ? "Media & Documentation"
                                    : currentStep === 8
                                      ? "Commission Setup"
                                      : "Review & Publish"}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Progress Bar */}
                  <div className="px-6">
                    <Progress
                      value={(currentStep / totalSteps) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* Form Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {error && (
                      <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
                        {error}
                      </div>
                    )}
                    {/* Step 1: Asset Identity & Status */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Asset Name *</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                updateFormData("name", e.target.value)
                              }
                              placeholder="e.g., Marina Heights Tower A"
                            />
                          </div>
                          <div>
                            <Label htmlFor="referenceCode">
                              Asset Reference Code *
                            </Label>
                            <Input
                              id="referenceCode"
                              value={formData.referenceCode}
                              onChange={(e) =>
                                updateFormData("referenceCode", e.target.value)
                              }
                              placeholder="e.g., MHT-A-2024"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="type">Asset Type *</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(val) =>
                                updateFormData("type", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Land">Land</SelectItem>
                                <SelectItem value="Off Plan">
                                  Off Plan
                                </SelectItem>
                                <SelectItem value="Under Construction">
                                  Under Construction
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="projectStatus">
                              Project Status *
                            </Label>
                            <Select
                              value={formData.projectStatus}
                              onValueChange={(val) =>
                                updateFormData("projectStatus", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Planning">
                                  Planning
                                </SelectItem>
                                <SelectItem value="Foundation">
                                  Foundation
                                </SelectItem>
                                <SelectItem value="Under Construction">
                                  Under Construction
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="Available">
                                  Available
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="location">Location *</Label>
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) =>
                              updateFormData("location", e.target.value)
                            }
                            placeholder="e.g., Dubai Marina"
                          />
                        </div>

                        <div>
                          <Label htmlFor="address">Full Address *</Label>
                          <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) =>
                              updateFormData("address", e.target.value)
                            }
                            placeholder="Enter complete address with plot/unit details"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="company">Company *</Label>
                          <Select
                            value={formData.company}
                            onValueChange={(val) =>
                              updateFormData("company", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="landSize">Land Size (sqm)</Label>
                            <Input
                              id="landSize"
                              type="number"
                              value={formData.landSize}
                              onChange={(e) =>
                                updateFormData("landSize", e.target.value)
                              }
                              placeholder="5000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="builtSize">
                              Built-up Size (sqm)
                            </Label>
                            <Input
                              id="builtSize"
                              type="number"
                              value={formData.builtSize}
                              onChange={(e) =>
                                updateFormData("builtSize", e.target.value)
                              }
                              placeholder="45000"
                            />
                          </div>
                        </div>

                        {/* Show construction dates only if not Land or Completed */}
                        {formData.type !== "Land" &&
                          formData.type !== "Completed" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="constructionStart">
                                  Construction Start Date
                                </Label>
                                <Input
                                  id="constructionStart"
                                  type="date"
                                  value={formData.constructionStart}
                                  onChange={(e) =>
                                    updateFormData(
                                      "constructionStart",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="constructionEnd">
                                  Expected Completion Date
                                </Label>
                                <Input
                                  id="constructionEnd"
                                  type="date"
                                  value={formData.constructionEnd}
                                  onChange={(e) =>
                                    updateFormData(
                                      "constructionEnd",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Step 2: Physical & Functional Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="propertyCategory">
                            Property Category *
                          </Label>
                          <Select
                            value={formData.propertyCategory}
                            onValueChange={(val) =>
                              updateFormData("propertyCategory", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Residential">
                                Residential
                              </SelectItem>
                              <SelectItem value="Commercial">
                                Commercial
                              </SelectItem>
                              <SelectItem value="Mixed-use">
                                Mixed-use
                              </SelectItem>
                              <SelectItem value="Land">Land</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="totalUnits">
                              Total Units / Rooms *
                            </Label>
                            <Input
                              id="totalUnits"
                              type="number"
                              value={formData.totalUnits}
                              onChange={(e) =>
                                updateFormData("totalUnits", e.target.value)
                              }
                              placeholder="156"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">
                              Unit Configuration *
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                "Studio Apartment",
                                "1 Bedroom",
                                "2 Bedrooms",
                                "3 Bedrooms",
                                "4 Bedrooms",
                                "5 Bedrooms",
                              ].map((config) => (
                                <div
                                  key={config}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`unit-${config}`}
                                    checked={(
                                      formData.unitConfiguration as string[]
                                    ).includes(config)}
                                    onCheckedChange={() =>
                                      toggleUnitConfig(config)
                                    }
                                  />
                                  <label
                                    htmlFor={`unit-${config}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {config}
                                  </label>
                                </div>
                              ))}
                              {(formData.unitConfiguration as string[])
                                .filter(
                                  (c) =>
                                    ![
                                      "Studio Apartment",
                                      "1 Bedroom",
                                      "2 Bedrooms",
                                      "3 Bedrooms",
                                      "4 Bedrooms",
                                      "5 Bedrooms",
                                    ].includes(c),
                                )
                                .map((config) => (
                                  <div
                                    key={config}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`unit-${config}`}
                                      checked
                                      onCheckedChange={() =>
                                        toggleUnitConfig(config)
                                      }
                                    />
                                    <label
                                      htmlFor={`unit-${config}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {config}
                                    </label>
                                  </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={customUnitInput}
                                onChange={(e) =>
                                  setCustomUnitInput(e.target.value)
                                }
                                placeholder="Add custom type"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (customUnitInput.trim()) {
                                    toggleUnitConfig(customUnitInput.trim());
                                    setCustomUnitInput("");
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="furnishingStatus">
                            Furnishing Status *
                          </Label>
                          <Select
                            value={formData.furnishingStatus}
                            onValueChange={(val) =>
                              updateFormData("furnishingStatus", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Unfurnished">
                                Unfurnished
                              </SelectItem>
                              <SelectItem value="Semi-furnished">
                                Semi-furnished
                              </SelectItem>
                              <SelectItem value="Fully furnished">
                                Fully furnished
                              </SelectItem>
                              <SelectItem value="N/A">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-3 block">
                            Shared Facilities
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "Pool",
                              "Gym",
                              "Parking",
                              "Security",
                              "Private Beach",
                              "Spa",
                              "Retail",
                              "Meeting Rooms",
                              "Elevators",
                            ].map((facility) => (
                              <div
                                key={facility}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={facility}
                                  checked={formData.sharedFacilities.includes(
                                    facility,
                                  )}
                                  onCheckedChange={() =>
                                    toggleFacility(facility)
                                  }
                                />
                                <label
                                  htmlFor={facility}
                                  className="text-sm cursor-pointer"
                                >
                                  {facility}
                                </label>
                              </div>
                            ))}
                            {formData.sharedFacilities
                              .filter(
                                (f) =>
                                  ![
                                    "Pool",
                                    "Gym",
                                    "Parking",
                                    "Security",
                                    "Private Beach",
                                    "Spa",
                                    "Retail",
                                    "Meeting Rooms",
                                    "Elevators",
                                  ].includes(f),
                              )
                              .map((customF) => (
                                <div
                                  key={customF}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={customF}
                                    checked
                                    onCheckedChange={() =>
                                      toggleFacility(customF)
                                    }
                                  />
                                  <label
                                    htmlFor={customF}
                                    className="text-sm cursor-pointer"
                                  >
                                    {customF}
                                  </label>
                                </div>
                              ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Input
                              value={customFacilityInput}
                              onChange={(e) =>
                                setCustomFacilityInput(e.target.value)
                              }
                              placeholder="Add custom facility"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (customFacilityInput.trim()) {
                                  toggleFacility(customFacilityInput.trim());
                                  setCustomFacilityInput("");
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Facility Management Included
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Is professional facility management included?
                            </p>
                          </div>
                          <Switch
                            checked={formData.facilityManagement}
                            onCheckedChange={(val) =>
                              updateFormData("facilityManagement", val)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Investment Structure */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Ownership Options *</Label>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div
                              onClick={() =>
                                updateFormData("ownershipType", "Full")
                              }
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.ownershipType === "Full"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <h4 className="font-medium">Full Ownership</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Single owner purchases entire asset
                              </p>
                            </div>
                            <div
                              onClick={() =>
                                updateFormData("ownershipType", "Fractional")
                              }
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.ownershipType === "Fractional"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <h4 className="font-medium">
                                Fractional Ownership
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Multiple investors own fractions
                              </p>
                            </div>
                          </div>
                        </div>

                        {formData.ownershipType === "Fractional" && (
                          <>
                            <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                              <h4 className="text-sm font-medium text-accent mb-3">
                                Fraction Breakdown
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {formData.type === "Land" ? (
                                  <>
                                    <div>
                                      <Label htmlFor="landUnitType">
                                        Land Units *
                                      </Label>
                                      <Select
                                        id="landUnitType"
                                        value={formData.landUnitType || ""}
                                        onValueChange={(val) =>
                                          updateFormData("landUnitType", val)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="sqm">
                                            Per Square Meter
                                          </SelectItem>
                                          <SelectItem value="plot">
                                            Per Plot
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="landUnitCount">
                                        Number of Units *
                                      </Label>
                                      <Input
                                        id="landUnitCount"
                                        type="number"
                                        value={formData.landUnitCount || ""}
                                        onChange={(e) =>
                                          updateFormData(
                                            "landUnitCount",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="e.g. 10"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <Label htmlFor="fractionTotal">
                                        Total Fractions *
                                      </Label>
                                      <Input
                                        id="fractionTotal"
                                        type="number"
                                        value={formData.fractionTotal}
                                        onChange={(e) =>
                                          updateFormData(
                                            "fractionTotal",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="100"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="costPerFraction">
                                        Cost per Fraction (₦) *
                                      </Label>
                                      <Input
                                        id="costPerFraction"
                                        type="number"
                                        value={formData.costPerFraction}
                                        onChange={(e) =>
                                          updateFormData(
                                            "costPerFraction",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="8500"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  Funding Progress
                                </span>
                                <span className="text-sm font-semibold">
                                  {fundingProgress}%
                                </span>
                              </div>
                              <Progress
                                value={fundingProgress}
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Auto-calculated based on fraction sales
                              </p>
                            </div>
                          </>
                        )}

                        {formData.ownershipType === "Full" && (
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <CircleCheck className="h-8 w-8 mx-auto text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Full ownership selected. Asset will be sold as a
                              single unit.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Pricing & Payment Logic */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="basePrice">
                              Base Asset Value (₦) *
                            </Label>
                            <Input
                              id="basePrice"
                              type="number"
                              value={formData.basePrice}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  basePrice: e.target.value,
                                  markup: "",
                                }));
                                setMarkupPct("");
                                setCustomPctInput("");
                                setCustomPctInput("");
                              }}
                              placeholder="1200000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="markup">BuyOps Markup *</Label>
                            <div className="space-y-2">
                              <Select
                                value={markupPct}
                                onValueChange={handleMarkupPctChange}
                              >
                                <SelectTrigger id="markup">
                                  <SelectValue placeholder="Select markup %" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    "1",
                                    "2",
                                    "3",
                                    "5",
                                    "7",
                                    "10",
                                    "15",
                                    "20",
                                  ].map((pct) => (
                                    <SelectItem key={pct} value={pct}>
                                      {pct}%
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="CUSTOM">
                                    Custom %
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {markupPct === "CUSTOM" ? (
                                <div className="space-y-1">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={customPctInput}
                                      onChange={(e) =>
                                        handleCustomPctChange(e.target.value)
                                      }
                                      placeholder="Enter custom %"
                                      className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                  {formData.markup && (
                                    <p className="text-sm text-muted-foreground">
                                      = ₦
                                      {Number(formData.markup).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                formData.markup && (
                                  <p className="text-sm text-muted-foreground">
                                    = ₦
                                    {Number(formData.markup).toLocaleString()}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <div className="text-sm text-muted-foreground">
                            Final Selling Price
                          </div>
                          <div className="text-3xl font-semibold text-accent mt-1">
                            ₦{finalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <Label className="mb-3 block">
                            Payment Options *
                          </Label>
                          <div className="space-y-2">
                            {["Full", "Installment", "Stage-based"].map(
                              (option) => (
                                <div
                                  key={option}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={option}
                                    checked={formData.paymentOptions.includes(
                                      option,
                                    )}
                                    onCheckedChange={() =>
                                      togglePaymentOption(option)
                                    }
                                  />
                                  <label
                                    htmlFor={option}
                                    className="text-sm cursor-pointer"
                                  >
                                    {option} Payment
                                  </label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        {/* Installment Configuration - shown only if Installment is selected */}
                        {formData.paymentOptions.includes("Installment") && (
                          <div className="p-4 bg-muted rounded-lg space-y-4">
                            <h4 className="text-sm font-medium">
                              Installment Configuration
                            </h4>

                            <div>
                              <Label htmlFor="downPaymentAmount">
                                Down Payment Amount (₦) *
                              </Label>
                              <Input
                                id="downPaymentAmount"
                                type="number"
                                value={formData.downPaymentAmount}
                                onChange={(e) =>
                                  updateFormData(
                                    "downPaymentAmount",
                                    e.target.value,
                                  )
                                }
                                placeholder="5000000"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Minimum initial payment required
                              </p>
                            </div>

                            <div>
                              <Label className="mb-3 block">
                                Allowed Payment Periods *
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "3 months",
                                  "6 months",
                                  "12 months",
                                  "18 months",
                                  "24 months",
                                  "36 months",
                                ].map((period) => (
                                  <div
                                    key={period}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={period}
                                      checked={formData.installmentPeriods.includes(
                                        period,
                                      )}
                                      onCheckedChange={() =>
                                        toggleInstallmentPeriod(period)
                                      }
                                    />
                                    <label
                                      htmlFor={period}
                                      className="text-sm cursor-pointer"
                                    >
                                      {period}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium mb-3">
                            Discount Configuration
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="offPlanDiscount">
                                Off-plan Discount (%)
                              </Label>
                              <Input
                                id="offPlanDiscount"
                                type="number"
                                step="0.1"
                                value={formData.offPlanDiscount}
                                onChange={(e) =>
                                  updateFormData(
                                    "offPlanDiscount",
                                    e.target.value,
                                  )
                                }
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stageBasedDiscount">
                                Stage-based Discount (%)
                              </Label>
                              <Input
                                id="stageBasedDiscount"
                                type="number"
                                step="0.1"
                                value={formData.stageBasedDiscount}
                                onChange={(e) =>
                                  updateFormData(
                                    "stageBasedDiscount",
                                    e.target.value,
                                  )
                                }
                                placeholder="5"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <CircleCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-900 dark:text-blue-100">
                            <strong>Payment Security:</strong> All payments are
                            processed through escrow accounts with full investor
                            protection and transparent transaction tracking.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Returns & Projections */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="projectedRentalIncome">
                              Projected Rental Income (₦) *
                            </Label>
                            <Input
                              id="projectedRentalIncome"
                              type="number"
                              value={formData.projectedRentalIncome}
                              onChange={(e) =>
                                updateFormData(
                                  "projectedRentalIncome",
                                  e.target.value,
                                )
                              }
                              placeholder="75000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rentalFrequency">
                              Rental Frequency *
                            </Label>
                            <Select
                              value={formData.rentalFrequency}
                              onValueChange={(val) =>
                                updateFormData("rentalFrequency", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">
                                  Quarterly
                                </SelectItem>
                                <SelectItem value="Annual">Annual</SelectItem>
                                <SelectItem value="N/A">N/A</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="operatingCost">
                            Operating Cost Assumptions (₦/year) *
                          </Label>
                          <Input
                            id="operatingCost"
                            type="number"
                            value={formData.operatingCost}
                            onChange={(e) =>
                              updateFormData("operatingCost", e.target.value)
                            }
                            placeholder="15000"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include maintenance, management fees, and utilities
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="capitalAppreciation">
                              Capital Appreciation (% p.a.) *
                            </Label>
                            <Input
                              id="capitalAppreciation"
                              type="number"
                              step="0.1"
                              value={formData.capitalAppreciation}
                              onChange={(e) =>
                                updateFormData(
                                  "capitalAppreciation",
                                  e.target.value,
                                )
                              }
                              placeholder="8.0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="firstPayoutDate">
                              First Payout Date
                            </Label>
                            <Input
                              id="firstPayoutDate"
                              type="date"
                              value={formData.firstPayoutDate}
                              onChange={(e) =>
                                updateFormData(
                                  "firstPayoutDate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg space-y-3">
                          <h4 className="text-sm font-medium text-accent">
                            Calculated Returns
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Rental Yield
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {rentalYield}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Capital Growth
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {formData.capitalAppreciation || 0}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Total Annual Return
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {totalAnnualReturn}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Investment Returns Ranges */}
                        <div className="p-4 bg-muted rounded-lg space-y-4">
                          <h4 className="text-sm font-medium">
                            Projected Investment Returns (Range)
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Define the expected range of returns for investor
                            transparency
                          </p>

                          <div className="space-y-4">
                            <div>
                              <Label className="mb-2 block">
                                Rental Yield Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.rentalYieldMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "rentalYieldMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 8)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.rentalYieldMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "rentalYieldMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 10)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Annual rental income as percentage of property
                                value
                              </p>
                            </div>

                            <div>
                              <Label className="mb-2 block">
                                Capital Appreciation Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.capitalAppreciationMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "capitalAppreciationMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 15)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.capitalAppreciationMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "capitalAppreciationMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 20)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Expected property value growth per annum
                              </p>
                            </div>

                            <div>
                              <Label className="mb-2 block">
                                Total Returns Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.totalReturnsMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "totalReturnsMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 23)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.totalReturnsMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "totalReturnsMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 30)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Combined annual returns (rental + appreciation)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6: Risk & Transparency */}
                    {currentStep === 6 && (
                      <div className="space-y-4">
                        {/* Construction Progress - shown only for ongoing construction, not for Land type */}
                        {formData.type !== "Land" &&
                          formData.projectStatus &&
                          formData.projectStatus !== "Completed" &&
                          formData.projectStatus !== "Available" && (
                            <div>
                              <Label htmlFor="constructionProgress">
                                Construction Progress (%)
                              </Label>
                              <Input
                                id="constructionProgress"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.constructionProgress}
                                onChange={(e) =>
                                  updateFormData(
                                    "constructionProgress",
                                    e.target.value,
                                  )
                                }
                                placeholder="70"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Current completion percentage of the project
                              </p>
                            </div>
                          )}

                        <div>
                          <Label>Risk Level *</Label>
                          <div className="grid grid-cols-3 gap-3 mt-2">
                            {["Low", "Medium", "High"].map((level) => (
                              <div
                                key={level}
                                onClick={() =>
                                  updateFormData("riskLevel", level)
                                }
                                className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                                  formData.riskLevel === level
                                    ? level === "Low"
                                      ? "border-accent bg-accent/10 text-accent"
                                      : level === "Medium"
                                        ? "border-warning bg-warning/10 text-warning"
                                        : "border-destructive bg-destructive/10 text-destructive"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >
                                <div className="font-medium">{level}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Risk Factors */}
                        <div className="p-4 bg-muted rounded-lg space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Investment Risk Factors
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              Select applicable risk factors for investor
                              transparency
                            </p>
                          </div>

                          <div className="space-y-2">
                            {[
                              "Construction timeline risk (if applicable)",
                              "Market volatility in property sector",
                              "Rental income may vary based on occupancy",
                              "Regulatory and economic factors",
                              "Currency fluctuation risk",
                              "Developer financial stability",
                            ].map((factor) => (
                              <div
                                key={factor}
                                className="flex items-start space-x-2"
                              >
                                <Checkbox
                                  id={factor}
                                  checked={formData.riskFactors.includes(
                                    factor,
                                  )}
                                  onCheckedChange={() =>
                                    toggleRiskFactor(factor)
                                  }
                                />
                                <label
                                  htmlFor={factor}
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {factor}
                                </label>
                              </div>
                            ))}
                          </div>

                          {/* Custom Risk Factor */}
                          <div>
                            <Label
                              htmlFor="customRiskFactor"
                              className="text-xs"
                            >
                              Add Custom Risk Factor
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                id="customRiskFactor"
                                value={formData.customRiskFactor}
                                onChange={(e) =>
                                  updateFormData(
                                    "customRiskFactor",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter custom risk factor"
                                className="text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustomRiskFactor();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomRiskFactor}
                              >
                                Add
                              </Button>
                            </div>
                          </div>

                          {/* Display selected custom risk factors */}
                          {formData.riskFactors.filter(
                            (f) =>
                              ![
                                "Construction timeline risk (if applicable)",
                                "Market volatility in property sector",
                                "Rental income may vary based on occupancy",
                                "Regulatory and economic factors",
                                "Currency fluctuation risk",
                                "Developer financial stability",
                              ].includes(f),
                          ).length > 0 && (
                            <div>
                              <Label className="text-xs mb-2 block">
                                Custom Risk Factors:
                              </Label>
                              <div className="space-y-2">
                                {formData.riskFactors
                                  .filter(
                                    (f) =>
                                      ![
                                        "Construction timeline risk (if applicable)",
                                        "Market volatility in property sector",
                                        "Rental income may vary based on occupancy",
                                        "Regulatory and economic factors",
                                        "Currency fluctuation risk",
                                        "Developer financial stability",
                                      ].includes(f),
                                  )
                                  .map((factor) => (
                                    <div
                                      key={factor}
                                      className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                    >
                                      <span>{factor}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRiskFactor(factor)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {formData.type === "Off Plan" && (
                          <div>
                            <Label htmlFor="offPlanSecurity">
                              Off-plan Security Notes
                            </Label>
                            <Textarea
                              id="offPlanSecurity"
                              value={formData.offPlanSecurity}
                              onChange={(e) =>
                                updateFormData(
                                  "offPlanSecurity",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Developer escrow account + Bank guarantee"
                              rows={3}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="exitLiquidity">
                            Exit Liquidity Settings *
                          </Label>
                          <Select
                            value={formData.exitLiquidity}
                            onValueChange={(val) =>
                              updateFormData("exitLiquidity", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">
                                High - Can exit within 30 days
                              </SelectItem>
                              <SelectItem value="Medium">
                                Medium - Exit within 60-90 days
                              </SelectItem>
                              <SelectItem value="Low">
                                Low - Exit after 6+ months
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="managementMode">
                            Management Mode *
                          </Label>
                          <Select
                            value={formData.managementMode}
                            onValueChange={(val) =>
                              updateFormData("managementMode", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BuyOps-managed">
                                BuyOps-managed
                              </SelectItem>
                              <SelectItem value="Self-managed">
                                Self-managed
                              </SelectItem>
                              <SelectItem value="Third-party managed">
                                Third-party managed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-900 dark:text-amber-100">
                            <strong>Transparency Notice:</strong> All risk
                            factors, construction progress, and financial
                            projections are regularly updated and verified by
                            independent auditors.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 7: Media & Documentation */}
                    {currentStep === 7 && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">Upload Images</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            High-quality photos of the property
                          </p>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.images > 0
                              ? `${formData.images} images uploaded`
                              : "No images uploaded yet"}
                          </p>
                          {uploadedImages.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                              {uploadedImages.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <span className="truncate flex-1">
                                    {file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">Upload Documents</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Legal documents, floor plans, certificates
                          </p>
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            multiple
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => documentInputRef.current?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.documents > 0
                              ? `${formData.documents} documents uploaded`
                              : "No documents uploaded yet"}
                          </p>
                          {uploadedDocuments.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                              {uploadedDocuments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <span className="truncate flex-1">
                                    {file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">
                            Virtual Tour Links
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Add 360° virtual tours or video walkthroughs
                          </p>
                          <Input
                            placeholder="https://..."
                            className="mt-2 max-w-md mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.virtualTours > 0
                              ? `${formData.virtualTours} tours added`
                              : "No virtual tours added yet"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 8: Commission Setup */}
                    {currentStep === 8 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-1">
                            Commission Structure
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Set commission percentages for agents involved in
                            the sale
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="leadCommission">
                              Lead Commission (%) *
                            </Label>
                            <Input
                              id="leadCommission"
                              type="number"
                              step="0.1"
                              value={formData.leadCommission}
                              onChange={(e) =>
                                updateFormData("leadCommission", e.target.value)
                              }
                              placeholder="1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="closerCommission">
                              Deal Closer Commission (%) *
                            </Label>
                            <Input
                              id="closerCommission"
                              type="number"
                              step="0.1"
                              value={formData.closerCommission}
                              onChange={(e) =>
                                updateFormData(
                                  "closerCommission",
                                  e.target.value,
                                )
                              }
                              placeholder="1.5"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Total Commission
                              </div>
                              <div className="text-2xl font-semibold text-accent">
                                {totalCommission.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Commission per Sale
                              </div>
                              <div className="text-2xl font-semibold text-accent">
                                ₦
                                {(
                                  (finalPrice * totalCommission) /
                                  100
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Based on final selling price of ₦
                            {finalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-muted rounded">
                            <span className="text-sm">Lead Agent Earns:</span>
                            <span className="font-semibold">
                              ₦
                              {(
                                (finalPrice *
                                  (parseFloat(formData.leadCommission) || 0)) /
                                100
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded">
                            <span className="text-sm">Closer Agent Earns:</span>
                            <span className="font-semibold">
                              ₦
                              {(
                                (finalPrice *
                                  (parseFloat(formData.closerCommission) ||
                                    0)) /
                                100
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 9: Review & Publish */}
                    {currentStep === 9 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h3 className="font-semibold text-lg mb-4">
                            Asset Summary
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Asset Name:
                              </span>
                              <span className="font-medium text-right">
                                {formData.name || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Reference Code:
                              </span>
                              <span className="font-medium">
                                {formData.referenceCode || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Type:
                              </span>
                              <Badge variant="outline">
                                {formData.type.toUpperCase() || "—"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Location:
                              </span>
                              <span className="font-medium text-right">
                                {formData.location || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Property Category:
                              </span>
                              <span className="font-medium">
                                {formData.propertyCategory || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Total Units:
                              </span>
                              <span className="font-medium">
                                {formData.totalUnits || "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <h4 className="font-medium text-accent mb-3">
                            Financial Summary
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Final Selling Price:
                              </span>
                              <span className="font-semibold">
                                ₦{finalPrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Ownership Type:</span>
                              <span className="font-medium">
                                {formData.ownershipType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Total Annual Return:
                              </span>
                              <span className="font-semibold text-accent">
                                {totalAnnualReturn}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Total Commission:</span>
                              <span className="font-semibold">
                                {totalCommission.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Investment Returns Summary */}
                        {(formData.rentalYieldMin ||
                          formData.rentalYieldMax ||
                          formData.capitalAppreciationMin ||
                          formData.capitalAppreciationMax ||
                          formData.totalReturnsMin ||
                          formData.totalReturnsMax) && (
                          <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                            <h4 className="font-medium text-accent mb-3">
                              Investment Returns (Projected Ranges)
                            </h4>
                            <div className="space-y-2">
                              {(formData.rentalYieldMin ||
                                formData.rentalYieldMax) && (
                                <div className="flex justify-between">
                                  <span className="text-sm">Rental Yield:</span>
                                  <span className="font-semibold">
                                    {formData.rentalYieldMin || "—"}-
                                    {formData.rentalYieldMax || "—"}%
                                  </span>
                                </div>
                              )}
                              {(formData.capitalAppreciationMin ||
                                formData.capitalAppreciationMax) && (
                                <div className="flex justify-between">
                                  <span className="text-sm">
                                    Capital Appreciation:
                                  </span>
                                  <span className="font-semibold">
                                    {formData.capitalAppreciationMin || "—"}-
                                    {formData.capitalAppreciationMax || "—"}%
                                  </span>
                                </div>
                              )}
                              {(formData.totalReturnsMin ||
                                formData.totalReturnsMax) && (
                                <div className="flex justify-between">
                                  <span className="text-sm">
                                    Total Returns:
                                  </span>
                                  <span className="font-semibold text-accent">
                                    {formData.totalReturnsMin || "—"}-
                                    {formData.totalReturnsMax || "—"}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-3">
                            Risk & Management
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Project Status:</span>
                              <span className="font-medium">
                                {formData.projectStatus || "—"}
                                {formData.type !== "Land" &&
                                  formData.constructionProgress &&
                                  formData.projectStatus !== "Completed" &&
                                  formData.projectStatus !== "Available" &&
                                  ` (${formData.constructionProgress}% complete)`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Risk Level:</span>
                              <Badge
                                variant="outline"
                                className={
                                  formData.riskLevel === "Low"
                                    ? "border-accent text-accent"
                                    : formData.riskLevel === "Medium"
                                      ? "border-warning text-warning"
                                      : "border-destructive text-destructive"
                                }
                              >
                                {formData.riskLevel}
                              </Badge>
                            </div>
                            {formData.riskFactors.length > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground block mb-1">
                                  Risk Factors:
                                </span>
                                <ul className="text-sm space-y-1 ml-4">
                                  {formData.riskFactors
                                    .slice(0, 3)
                                    .map((factor, idx) => (
                                      <li key={idx} className="list-disc">
                                        {factor}
                                      </li>
                                    ))}
                                  {formData.riskFactors.length > 3 && (
                                    <li className="text-muted-foreground">
                                      +{formData.riskFactors.length - 3} more
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-sm">Exit Liquidity:</span>
                              <span className="font-medium">
                                {formData.exitLiquidity}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Management:</span>
                              <span className="font-medium">
                                {formData.managementMode}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Publish Status
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Toggle to publish asset immediately
                            </p>
                          </div>
                          <Switch
                            checked={formData.status === "published"}
                            onCheckedChange={(val) =>
                              updateFormData(
                                "status",
                                val ? "published" : "draft",
                              )
                            }
                          />
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <CircleCheck className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-green-900 dark:text-green-100">
                            Review all details carefully before publishing. You
                            can always edit or unpublish the asset later.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation Footer */}
                  <DialogFooter className="border-t pt-4 px-6">
                    <div className="flex justify-between w-full">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setCreateDialogOpen(false);
                            setCurrentStep(1);
                            setFormData(INITIAL_FORM_DATA);
                            setCustomFacilityInput("");
                            setCustomUnitInput("");
                            setMarkupPct("");
                            setCustomPctInput("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSubmit("draft")}
                          disabled={loading}
                        >
                          Save & Continue Later
                        </Button>
                        {currentStep < totalSteps ? (
                          <Button onClick={nextStep}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Button onClick={() => handleSubmit()}>
                            {formData.status === "published"
                              ? "Publish Asset"
                              : "Save as Draft"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Edit Asset Dialog - Reuses same form structure */}
              <Dialog
                open={editDialogOpen}
                onOpenChange={(open) => {
                  setEditDialogOpen(open);
                  if (!open) {
                    setFormData(INITIAL_FORM_DATA);
                    setCurrentStep(1);
                    setMarkupPct("");
                    setCustomPctInput("");
                    setError(null);
                  }
                }}
              >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Edit Asset</DialogTitle>
                    <DialogDescription>
                      Step {currentStep} of {totalSteps}:{" "}
                      {currentStep === 1
                        ? "Asset Identity & Status"
                        : currentStep === 2
                          ? "Physical Details & Facilities"
                          : currentStep === 3
                            ? "Investment Structure"
                            : currentStep === 4
                              ? "Pricing Logic"
                              : currentStep === 5
                                ? "Returns Projections"
                                : currentStep === 6
                                  ? "Risk & Management Assessment"
                                  : currentStep === 7
                                    ? "Media & Documentation"
                                    : currentStep === 8
                                      ? "Commission Setup"
                                      : "Review & Publish"}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Use the same form steps - content is identical to create dialog */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    {/* The form fields below are populated with existing asset data through formData state */}
                    {/* All form steps from create dialog are rendered here with the same formData binding */}

                    {/* Step 1: Asset Identity & Status */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-name">Asset Name *</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) =>
                                updateFormData("name", e.target.value)
                              }
                              placeholder="e.g., Marina Heights Tower A"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-referenceCode">
                              Asset Reference Code *
                            </Label>
                            <Input
                              id="edit-referenceCode"
                              value={formData.referenceCode}
                              onChange={(e) =>
                                updateFormData("referenceCode", e.target.value)
                              }
                              placeholder="e.g., MHT-A-2024"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-type">Asset Type *</Label>
                            <Select
                              value={formData.type}
                              onValueChange={(val) =>
                                updateFormData("type", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Land">Land</SelectItem>
                                <SelectItem value="Off Plan">
                                  Off Plan
                                </SelectItem>
                                <SelectItem value="Under Construction">
                                  Under Construction
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-projectStatus">
                              Project Status *
                            </Label>
                            <Select
                              value={formData.projectStatus}
                              onValueChange={(val) =>
                                updateFormData("projectStatus", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Planning">
                                  Planning
                                </SelectItem>
                                <SelectItem value="Foundation">
                                  Foundation
                                </SelectItem>
                                <SelectItem value="Under Construction">
                                  Under Construction
                                </SelectItem>
                                <SelectItem value="Completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="Available">
                                  Available
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit-location">Location *</Label>
                          <Input
                            id="edit-location"
                            value={formData.location}
                            onChange={(e) =>
                              updateFormData("location", e.target.value)
                            }
                            placeholder="e.g., Dubai Marina"
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-address">Full Address *</Label>
                          <Textarea
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) =>
                              updateFormData("address", e.target.value)
                            }
                            placeholder="Enter complete address with plot/unit details"
                            rows={2}
                          />
                        </div>

                        <div>
                          <Label htmlFor="edit-company">Company *</Label>
                          <Select
                            value={formData.company}
                            onValueChange={(val) =>
                              updateFormData("company", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((company) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-landSize">
                              Land Size (sqm)
                            </Label>
                            <Input
                              id="edit-landSize"
                              type="number"
                              value={formData.landSize}
                              onChange={(e) =>
                                updateFormData("landSize", e.target.value)
                              }
                              placeholder="5000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-builtSize">
                              Built-up Size (sqm)
                            </Label>
                            <Input
                              id="edit-builtSize"
                              type="number"
                              value={formData.builtSize}
                              onChange={(e) =>
                                updateFormData("builtSize", e.target.value)
                              }
                              placeholder="45000"
                            />
                          </div>
                        </div>

                        {/* Show construction dates only if not Land or Completed */}
                        {formData.type !== "Land" &&
                          formData.type !== "Completed" && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-constructionStart">
                                  Construction Start Date
                                </Label>
                                <Input
                                  id="edit-constructionStart"
                                  type="date"
                                  value={formData.constructionStart}
                                  onChange={(e) =>
                                    updateFormData(
                                      "constructionStart",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-constructionEnd">
                                  Expected Completion Date
                                </Label>
                                <Input
                                  id="edit-constructionEnd"
                                  type="date"
                                  value={formData.constructionEnd}
                                  onChange={(e) =>
                                    updateFormData(
                                      "constructionEnd",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Step 2: Physical & Functional Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="edit-propertyCategory">
                            Property Category *
                          </Label>
                          <Select
                            value={formData.propertyCategory}
                            onValueChange={(val) =>
                              updateFormData("propertyCategory", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Residential">
                                Residential
                              </SelectItem>
                              <SelectItem value="Commercial">
                                Commercial
                              </SelectItem>
                              <SelectItem value="Mixed-use">
                                Mixed-use
                              </SelectItem>
                              <SelectItem value="Land">Land</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-totalUnits">
                              Total Units / Rooms *
                            </Label>
                            <Input
                              id="edit-totalUnits"
                              type="number"
                              value={formData.totalUnits}
                              onChange={(e) =>
                                updateFormData("totalUnits", e.target.value)
                              }
                              placeholder="156"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">
                              Unit Configuration *
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                "Studio Apartment",
                                "1 Bedroom",
                                "2 Bedrooms",
                                "3 Bedrooms",
                                "4 Bedrooms",
                                "5 Bedrooms",
                              ].map((config) => (
                                <div
                                  key={config}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`edit-unit-${config}`}
                                    checked={(
                                      formData.unitConfiguration as string[]
                                    ).includes(config)}
                                    onCheckedChange={() =>
                                      toggleUnitConfig(config)
                                    }
                                  />
                                  <label
                                    htmlFor={`edit-unit-${config}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {config}
                                  </label>
                                </div>
                              ))}
                              {(formData.unitConfiguration as string[])
                                .filter(
                                  (c) =>
                                    ![
                                      "Studio Apartment",
                                      "1 Bedroom",
                                      "2 Bedrooms",
                                      "3 Bedrooms",
                                      "4 Bedrooms",
                                      "5 Bedrooms",
                                    ].includes(c),
                                )
                                .map((config) => (
                                  <div
                                    key={config}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`edit-unit-custom-${config}`}
                                      checked
                                      onCheckedChange={() =>
                                        toggleUnitConfig(config)
                                      }
                                    />
                                    <label
                                      htmlFor={`edit-unit-custom-${config}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {config}
                                    </label>
                                  </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Input
                                value={customUnitInput}
                                onChange={(e) =>
                                  setCustomUnitInput(e.target.value)
                                }
                                placeholder="Add custom type"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (customUnitInput.trim()) {
                                    toggleUnitConfig(customUnitInput.trim());
                                    setCustomUnitInput("");
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="edit-furnishingStatus">
                            Furnishing Status *
                          </Label>
                          <Select
                            value={formData.furnishingStatus}
                            onValueChange={(val) =>
                              updateFormData("furnishingStatus", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Unfurnished">
                                Unfurnished
                              </SelectItem>
                              <SelectItem value="Semi-furnished">
                                Semi-furnished
                              </SelectItem>
                              <SelectItem value="Fully furnished">
                                Fully furnished
                              </SelectItem>
                              <SelectItem value="N/A">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="mb-3 block">
                            Shared Facilities
                          </Label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              "Pool",
                              "Gym",
                              "Parking",
                              "Security",
                              "Private Beach",
                              "Spa",
                              "Retail",
                              "Meeting Rooms",
                              "Elevators",
                            ].map((facility) => (
                              <div
                                key={facility}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`edit-${facility}`}
                                  checked={formData.sharedFacilities.includes(
                                    facility,
                                  )}
                                  onCheckedChange={() =>
                                    toggleFacility(facility)
                                  }
                                />
                                <label
                                  htmlFor={`edit-${facility}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {facility}
                                </label>
                              </div>
                            ))}
                            {formData.sharedFacilities
                              .filter(
                                (f) =>
                                  ![
                                    "Pool",
                                    "Gym",
                                    "Parking",
                                    "Security",
                                    "Private Beach",
                                    "Spa",
                                    "Retail",
                                    "Meeting Rooms",
                                    "Elevators",
                                  ].includes(f),
                              )
                              .map((customF) => (
                                <div
                                  key={customF}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`edit-custom-${customF}`}
                                    checked
                                    onCheckedChange={() =>
                                      toggleFacility(customF)
                                    }
                                  />
                                  <label
                                    htmlFor={`edit-custom-${customF}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {customF}
                                  </label>
                                </div>
                              ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Input
                              value={customFacilityInput}
                              onChange={(e) =>
                                setCustomFacilityInput(e.target.value)
                              }
                              placeholder="Add custom facility"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (customFacilityInput.trim()) {
                                  toggleFacility(customFacilityInput.trim());
                                  setCustomFacilityInput("");
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Facility Management Included
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Is professional facility management included?
                            </p>
                          </div>
                          <Switch
                            checked={formData.facilityManagement}
                            onCheckedChange={(val) =>
                              updateFormData("facilityManagement", val)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 3: Investment Structure */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Ownership Options *</Label>
                          <div className="grid grid-cols-2 gap-3 mt-2">
                            <div
                              onClick={() =>
                                updateFormData("ownershipType", "Full")
                              }
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.ownershipType === "Full"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <h4 className="font-medium">Full Ownership</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Single owner purchases entire asset
                              </p>
                            </div>
                            <div
                              onClick={() =>
                                updateFormData("ownershipType", "Fractional")
                              }
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                formData.ownershipType === "Fractional"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground"
                              }`}
                            >
                              <h4 className="font-medium">
                                Fractional Ownership
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Multiple investors own fractions
                              </p>
                            </div>
                          </div>
                        </div>

                        {formData.ownershipType === "Fractional" && (
                          <>
                            <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                              <h4 className="text-sm font-medium text-accent mb-3">
                                Fraction Breakdown
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {formData.type === "Land" ? (
                                  <>
                                    <div>
                                      <Label htmlFor="landUnitType">
                                        Land Units *
                                      </Label>
                                      <Select
                                        id="landUnitType"
                                        value={formData.landUnitType || ""}
                                        onValueChange={(val) =>
                                          updateFormData("landUnitType", val)
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="sqm">
                                            Per Square Meter
                                          </SelectItem>
                                          <SelectItem value="plot">
                                            Per Plot
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="landUnitCount">
                                        Number of Units *
                                      </Label>
                                      <Input
                                        id="landUnitCount"
                                        type="number"
                                        value={formData.landUnitCount || ""}
                                        onChange={(e) =>
                                          updateFormData(
                                            "landUnitCount",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="e.g. 10"
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      <Label htmlFor="fractionTotal">
                                        Total Fractions *
                                      </Label>
                                      <Input
                                        id="fractionTotal"
                                        type="number"
                                        value={formData.fractionTotal}
                                        onChange={(e) =>
                                          updateFormData(
                                            "fractionTotal",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="100"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="costPerFraction">
                                        Cost per Fraction (₦) *
                                      </Label>
                                      <Input
                                        id="costPerFraction"
                                        type="number"
                                        value={formData.costPerFraction}
                                        onChange={(e) =>
                                          updateFormData(
                                            "costPerFraction",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="8500"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">
                                  Funding Progress
                                </span>
                                <span className="text-sm font-semibold">
                                  {fundingProgress}%
                                </span>
                              </div>
                              <Progress
                                value={fundingProgress}
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground mt-2">
                                Auto-calculated based on fraction sales
                              </p>
                            </div>
                          </>
                        )}

                        {formData.ownershipType === "Full" && (
                          <div className="p-4 bg-muted rounded-lg text-center">
                            <CircleCheck className="h-8 w-8 mx-auto text-accent mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Full ownership selected. Asset will be sold as a
                              single unit.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Pricing & Payment Logic */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="basePrice">
                              Base Asset Value (₦) *
                            </Label>
                            <Input
                              id="basePrice"
                              type="number"
                              value={formData.basePrice}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  basePrice: e.target.value,
                                  markup: "",
                                }));
                                setMarkupPct("");
                                setCustomPctInput("");
                                setCustomPctInput("");
                              }}
                              placeholder="1200000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="markup">BuyOps Markup *</Label>
                            <div className="space-y-2">
                              <Select
                                value={markupPct}
                                onValueChange={handleMarkupPctChange}
                              >
                                <SelectTrigger id="markup">
                                  <SelectValue placeholder="Select markup %" />
                                </SelectTrigger>
                                <SelectContent>
                                  {[
                                    "1",
                                    "2",
                                    "3",
                                    "5",
                                    "7",
                                    "10",
                                    "15",
                                    "20",
                                  ].map((pct) => (
                                    <SelectItem key={pct} value={pct}>
                                      {pct}%
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="CUSTOM">
                                    Custom %
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {markupPct === "CUSTOM" ? (
                                <div className="space-y-1">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      value={customPctInput}
                                      onChange={(e) =>
                                        handleCustomPctChange(e.target.value)
                                      }
                                      placeholder="Enter custom %"
                                      className="pr-8"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                  {formData.markup && (
                                    <p className="text-sm text-muted-foreground">
                                      = ₦
                                      {Number(formData.markup).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                formData.markup && (
                                  <p className="text-sm text-muted-foreground">
                                    = ₦
                                    {Number(formData.markup).toLocaleString()}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <div className="text-sm text-muted-foreground">
                            Final Selling Price
                          </div>
                          <div className="text-3xl font-semibold text-accent mt-1">
                            ₦{finalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div>
                          <Label className="mb-3 block">
                            Payment Options *
                          </Label>
                          <div className="space-y-2">
                            {["Full", "Installment", "Stage-based"].map(
                              (option) => (
                                <div
                                  key={option}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={option}
                                    checked={formData.paymentOptions.includes(
                                      option,
                                    )}
                                    onCheckedChange={() =>
                                      togglePaymentOption(option)
                                    }
                                  />
                                  <label
                                    htmlFor={option}
                                    className="text-sm cursor-pointer"
                                  >
                                    {option} Payment
                                  </label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>

                        {formData.paymentOptions.includes("Installment") && (
                          <div className="p-4 bg-muted rounded-lg space-y-4">
                            <h4 className="text-sm font-medium">
                              Installment Configuration
                            </h4>

                            <div>
                              <Label htmlFor="downPaymentAmount">
                                Down Payment Amount (₦) *
                              </Label>
                              <Input
                                id="downPaymentAmount"
                                type="number"
                                value={formData.downPaymentAmount}
                                onChange={(e) =>
                                  updateFormData(
                                    "downPaymentAmount",
                                    e.target.value,
                                  )
                                }
                                placeholder="5000000"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Minimum initial payment required
                              </p>
                            </div>

                            <div>
                              <Label className="mb-3 block">
                                Allowed Payment Periods *
                              </Label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  "3 months",
                                  "6 months",
                                  "12 months",
                                  "18 months",
                                  "24 months",
                                  "36 months",
                                ].map((period) => (
                                  <div
                                    key={period}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={period}
                                      checked={formData.installmentPeriods.includes(
                                        period,
                                      )}
                                      onCheckedChange={() =>
                                        toggleInstallmentPeriod(period)
                                      }
                                    />
                                    <label
                                      htmlFor={period}
                                      className="text-sm cursor-pointer"
                                    >
                                      {period}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium mb-3">
                            Discount Configuration
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="offPlanDiscount">
                                Off-plan Discount (%)
                              </Label>
                              <Input
                                id="offPlanDiscount"
                                type="number"
                                step="0.1"
                                value={formData.offPlanDiscount}
                                onChange={(e) =>
                                  updateFormData(
                                    "offPlanDiscount",
                                    e.target.value,
                                  )
                                }
                                placeholder="10"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stageBasedDiscount">
                                Stage-based Discount (%)
                              </Label>
                              <Input
                                id="stageBasedDiscount"
                                type="number"
                                step="0.1"
                                value={formData.stageBasedDiscount}
                                onChange={(e) =>
                                  updateFormData(
                                    "stageBasedDiscount",
                                    e.target.value,
                                  )
                                }
                                placeholder="5"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <CircleCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-blue-900 dark:text-blue-100">
                            <strong>Payment Security:</strong> All payments are
                            processed through escrow accounts with full investor
                            protection and transparent transaction tracking.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Returns & Projections */}
                    {currentStep === 5 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="projectedRentalIncome">
                              Projected Rental Income (₦) *
                            </Label>
                            <Input
                              id="projectedRentalIncome"
                              type="number"
                              value={formData.projectedRentalIncome}
                              onChange={(e) =>
                                updateFormData(
                                  "projectedRentalIncome",
                                  e.target.value,
                                )
                              }
                              placeholder="75000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="rentalFrequency">
                              Rental Frequency *
                            </Label>
                            <Select
                              value={formData.rentalFrequency}
                              onValueChange={(val) =>
                                updateFormData("rentalFrequency", val)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="Quarterly">
                                  Quarterly
                                </SelectItem>
                                <SelectItem value="Annual">Annual</SelectItem>
                                <SelectItem value="N/A">N/A</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="operatingCost">
                            Operating Cost Assumptions (₦/year) *
                          </Label>
                          <Input
                            id="operatingCost"
                            type="number"
                            value={formData.operatingCost}
                            onChange={(e) =>
                              updateFormData("operatingCost", e.target.value)
                            }
                            placeholder="15000"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include maintenance, management fees, and utilities
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="capitalAppreciation">
                              Capital Appreciation (% p.a.) *
                            </Label>
                            <Input
                              id="capitalAppreciation"
                              type="number"
                              step="0.1"
                              value={formData.capitalAppreciation}
                              onChange={(e) =>
                                updateFormData(
                                  "capitalAppreciation",
                                  e.target.value,
                                )
                              }
                              placeholder="8.0"
                            />
                          </div>
                          <div>
                            <Label htmlFor="firstPayoutDate">
                              First Payout Date
                            </Label>
                            <Input
                              id="firstPayoutDate"
                              type="date"
                              value={formData.firstPayoutDate}
                              onChange={(e) =>
                                updateFormData(
                                  "firstPayoutDate",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg space-y-3">
                          <h4 className="text-sm font-medium text-accent">
                            Calculated Returns
                          </h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Rental Yield
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {rentalYield}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Capital Growth
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {formData.capitalAppreciation || 0}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Total Annual Return
                              </div>
                              <div className="text-xl font-semibold text-accent">
                                {totalAnnualReturn}%
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-4">
                          <h4 className="text-sm font-medium">
                            Projected Investment Returns (Range)
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Define the expected range of returns for investor
                            transparency
                          </p>

                          <div className="space-y-4">
                            <div>
                              <Label className="mb-2 block">
                                Rental Yield Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.rentalYieldMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "rentalYieldMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 8)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.rentalYieldMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "rentalYieldMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 10)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Annual rental income as percentage of property
                                value
                              </p>
                            </div>

                            <div>
                              <Label className="mb-2 block">
                                Capital Appreciation Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.capitalAppreciationMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "capitalAppreciationMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 15)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.capitalAppreciationMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "capitalAppreciationMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 20)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Expected property value growth per annum
                              </p>
                            </div>

                            <div>
                              <Label className="mb-2 block">
                                Total Returns Range (%)
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.totalReturnsMin}
                                    onChange={(e) =>
                                      updateFormData(
                                        "totalReturnsMin",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Min (e.g., 23)"
                                  />
                                </div>
                                <div>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.totalReturnsMax}
                                    onChange={(e) =>
                                      updateFormData(
                                        "totalReturnsMax",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Max (e.g., 30)"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Combined annual returns (rental + appreciation)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 6: Risk & Transparency */}
                    {currentStep === 6 && (
                      <div className="space-y-4">
                        {formData.type !== "Land" &&
                          formData.type !== "Completed" &&
                          formData.projectStatus &&
                          formData.projectStatus !== "Completed" &&
                          formData.projectStatus !== "Available" && (
                            <div>
                              <Label htmlFor="constructionProgress">
                                Construction Progress (%)
                              </Label>
                              <Input
                                id="constructionProgress"
                                type="number"
                                min="0"
                                max="100"
                                value={formData.constructionProgress}
                                onChange={(e) =>
                                  updateFormData(
                                    "constructionProgress",
                                    e.target.value,
                                  )
                                }
                                placeholder="70"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Current completion percentage of the project
                              </p>
                            </div>
                          )}

                        <div>
                          <Label>Risk Level *</Label>
                          <div className="grid grid-cols-3 gap-3 mt-2">
                            {["Low", "Medium", "High"].map((level) => (
                              <div
                                key={level}
                                onClick={() =>
                                  updateFormData("riskLevel", level)
                                }
                                className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                                  formData.riskLevel === level
                                    ? level === "Low"
                                      ? "border-accent bg-accent/10 text-accent"
                                      : level === "Medium"
                                        ? "border-warning bg-warning/10 text-warning"
                                        : "border-destructive bg-destructive/10 text-destructive"
                                    : "border-border hover:border-muted-foreground"
                                }`}
                              >
                                <div className="font-medium">{level}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Investment Risk Factors
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              Select applicable risk factors for investor
                              transparency
                            </p>
                          </div>

                          <div className="space-y-2">
                            {[
                              "Construction timeline risk (if applicable)",
                              "Market volatility in property sector",
                              "Rental income may vary based on occupancy",
                              "Regulatory and economic factors",
                              "Currency fluctuation risk",
                              "Developer financial stability",
                            ].map((factor) => (
                              <div
                                key={factor}
                                className="flex items-start space-x-2"
                              >
                                <Checkbox
                                  id={factor}
                                  checked={formData.riskFactors.includes(
                                    factor,
                                  )}
                                  onCheckedChange={() =>
                                    toggleRiskFactor(factor)
                                  }
                                />
                                <label
                                  htmlFor={factor}
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {factor}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div>
                            <Label
                              htmlFor="customRiskFactor"
                              className="text-xs"
                            >
                              Add Custom Risk Factor
                            </Label>
                            <div className="flex gap-2 mt-1">
                              <Input
                                id="customRiskFactor"
                                value={formData.customRiskFactor}
                                onChange={(e) =>
                                  updateFormData(
                                    "customRiskFactor",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter custom risk factor"
                                className="text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addCustomRiskFactor();
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomRiskFactor}
                              >
                                Add
                              </Button>
                            </div>
                          </div>

                          {formData.riskFactors.filter(
                            (f) =>
                              ![
                                "Construction timeline risk (if applicable)",
                                "Market volatility in property sector",
                                "Rental income may vary based on occupancy",
                                "Regulatory and economic factors",
                                "Currency fluctuation risk",
                                "Developer financial stability",
                              ].includes(f),
                          ).length > 0 && (
                            <div>
                              <Label className="text-xs mb-2 block">
                                Custom Risk Factors:
                              </Label>
                              <div className="space-y-2">
                                {formData.riskFactors
                                  .filter(
                                    (f) =>
                                      ![
                                        "Construction timeline risk (if applicable)",
                                        "Market volatility in property sector",
                                        "Rental income may vary based on occupancy",
                                        "Regulatory and economic factors",
                                        "Currency fluctuation risk",
                                        "Developer financial stability",
                                      ].includes(f),
                                  )
                                  .map((factor) => (
                                    <div
                                      key={factor}
                                      className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                    >
                                      <span>{factor}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeRiskFactor(factor)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {formData.type === "Off Plan" && (
                          <div>
                            <Label htmlFor="offPlanSecurity">
                              Off-plan Security Notes
                            </Label>
                            <Textarea
                              id="offPlanSecurity"
                              value={formData.offPlanSecurity}
                              onChange={(e) =>
                                updateFormData(
                                  "offPlanSecurity",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Developer escrow account + Bank guarantee"
                              rows={3}
                            />
                          </div>
                        )}

                        <div>
                          <Label htmlFor="exitLiquidity">
                            Exit Liquidity Settings *
                          </Label>
                          <Select
                            value={formData.exitLiquidity}
                            onValueChange={(val) =>
                              updateFormData("exitLiquidity", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">
                                High - Can exit within 30 days
                              </SelectItem>
                              <SelectItem value="Medium">
                                Medium - Exit within 60-90 days
                              </SelectItem>
                              <SelectItem value="Low">
                                Low - Exit after 6+ months
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="managementMode">
                            Management Mode *
                          </Label>
                          <Select
                            value={formData.managementMode}
                            onValueChange={(val) =>
                              updateFormData("managementMode", val)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BuyOps-managed">
                                BuyOps-managed
                              </SelectItem>
                              <SelectItem value="Self-managed">
                                Self-managed
                              </SelectItem>
                              <SelectItem value="Third-party managed">
                                Third-party managed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-amber-900 dark:text-amber-100">
                            <strong>Transparency Notice:</strong> All risk
                            factors, construction progress, and financial
                            projections are regularly updated and verified by
                            independent auditors.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 7: Media & Documentation */}
                    {currentStep === 7 && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">Upload Images</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            High-quality photos of the property
                          </p>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.images > 0
                              ? `${formData.images} images uploaded`
                              : "No images uploaded yet"}
                          </p>
                          {uploadedImages.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                              {uploadedImages.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <span className="truncate flex-1">
                                    {file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">Upload Documents</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Legal documents, floor plans, certificates
                          </p>
                          <input
                            ref={documentInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            multiple
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => documentInputRef.current?.click()}
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.documents > 0
                              ? `${formData.documents} documents uploaded`
                              : "No documents uploaded yet"}
                          </p>
                          {uploadedDocuments.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                              {uploadedDocuments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                >
                                  <span className="truncate flex-1">
                                    {file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors">
                          <Video className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <h4 className="font-medium mb-1">
                            Virtual Tour Links
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Add 360° virtual tours or video walkthroughs
                          </p>
                          <Input
                            placeholder="https://..."
                            className="mt-2 max-w-md mx-auto"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.virtualTours > 0
                              ? `${formData.virtualTours} tours added`
                              : "No virtual tours added yet"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 8: Commission Setup */}
                    {currentStep === 8 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-1">
                            Commission Structure
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Set commission percentages for agents involved in
                            the sale
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="leadCommission">
                              Lead Commission (%) *
                            </Label>
                            <Input
                              id="leadCommission"
                              type="number"
                              step="0.1"
                              value={formData.leadCommission}
                              onChange={(e) =>
                                updateFormData("leadCommission", e.target.value)
                              }
                              placeholder="1.5"
                            />
                          </div>
                          <div>
                            <Label htmlFor="closerCommission">
                              Deal Closer Commission (%) *
                            </Label>
                            <Input
                              id="closerCommission"
                              type="number"
                              step="0.1"
                              value={formData.closerCommission}
                              onChange={(e) =>
                                updateFormData(
                                  "closerCommission",
                                  e.target.value,
                                )
                              }
                              placeholder="1.5"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Total Commission
                              </div>
                              <div className="text-2xl font-semibold text-accent">
                                {totalCommission.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Commission per Sale
                              </div>
                              <div className="text-2xl font-semibold text-accent">
                                ₦
                                {(
                                  (finalPrice * totalCommission) /
                                  100
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Based on final selling price of ₦
                            {finalPrice.toLocaleString()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-muted rounded">
                            <span className="text-sm">Lead Agent Earns:</span>
                            <span className="font-semibold">
                              ₦
                              {(
                                (finalPrice *
                                  (parseFloat(formData.leadCommission) || 0)) /
                                100
                              ).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-muted rounded">
                            <span className="text-sm">Closer Agent Earns:</span>
                            <span className="font-semibold">
                              ₦
                              {(
                                (finalPrice *
                                  (parseFloat(formData.closerCommission) ||
                                    0)) /
                                100
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 9: Review & Publish - Should be same as create */}
                    {currentStep === 9 && (
                      <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h3 className="font-semibold text-lg mb-4">
                            Asset Summary
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Asset Name:
                              </span>
                              <span className="font-medium text-right">
                                {formData.name || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Reference Code:
                              </span>
                              <span className="font-medium">
                                {formData.referenceCode || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Type:
                              </span>
                              <Badge variant="outline">
                                {formData.type?.toUpperCase() || "—"}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Location:
                              </span>
                              <span className="font-medium text-right">
                                {formData.location || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Property Category:
                              </span>
                              <span className="font-medium">
                                {formData.propertyCategory || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-start">
                              <span className="text-sm text-muted-foreground">
                                Total Units:
                              </span>
                              <span className="font-medium">
                                {formData.totalUnits || "—"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
                          <h4 className="font-medium text-accent mb-3">
                            Financial Summary
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Final Selling Price:
                              </span>
                              <span className="font-semibold">
                                ₦{finalPrice.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Ownership Type:</span>
                              <span className="font-medium">
                                {formData.ownershipType}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Total Annual Return:
                              </span>
                              <span className="font-semibold text-accent">
                                {totalAnnualReturn}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Total Commission:</span>
                              <span className="font-semibold">
                                {totalCommission.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Publish Status
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Toggle to publish asset immediately
                            </p>
                          </div>
                          <Switch
                            checked={formData.status === "published"}
                            onCheckedChange={(val) =>
                              updateFormData(
                                "status",
                                val ? "published" : "draft",
                              )
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="border-t pt-4 px-6">
                    <div className="flex justify-between w-full">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditDialogOpen(false);
                            setCurrentStep(1);
                            setFormData(INITIAL_FORM_DATA);
                            setCustomFacilityInput("");
                            setCustomUnitInput("");
                          }}
                        >
                          Cancel
                        </Button>
                        {currentStep < totalSteps ? (
                          <Button onClick={nextStep}>
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        ) : (
                          <Button onClick={handleUpdate}>Update Asset</Button>
                        )}
                      </div>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Delete Asset</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this asset? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <CircleAlert className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-destructive">
                        Deleting this asset will remove all associated data,
                        including investment records, media files, and
                        transaction history. Investors who have purchased units
                        will be notified.
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={confirmDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Asset
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Asset Type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {assetStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {String(status).toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Location
                </Label>
                <Select
                  value={filterLocation}
                  onValueChange={setFilterLocation}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Source
                </Label>
                <Select value={filterSource} onValueChange={setFilterSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="urbco">From Urbco</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assets ({filteredAssets.length})</CardTitle>
            <div className="text-sm text-muted-foreground">
              {
                filteredAssets.filter(
                  (a) => String(a.status || "").toLowerCase() === "published",
                ).length
              }{" "}
              PUBLISHED •{" "}
              {
                filteredAssets.filter(
                  (a) => String(a.status || "").toLowerCase() === "draft",
                ).length
              }{" "}
              DRAFT
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Info</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Final Price</TableHead>
                  <TableHead>Returns</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.name}</span>
                          {asset.urbcoPropertyId && (
                            <Badge
                              variant="outline"
                              className="text-xs border-amber-400 text-amber-700 bg-amber-50"
                            >
                              From Urbco
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {asset.company?.name || "—"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{asset.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{asset.location}</TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <div className="font-medium">
                          {asset.availableUnits}/{asset.totalUnits}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          available
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₦{Number(asset.finalPrice || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-semibold text-accent">
                          {asset.totalAnnualReturn}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          annual
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          asset.riskLevel?.toLowerCase() === "low"
                            ? "border-accent text-accent"
                            : asset.riskLevel?.toLowerCase() === "medium"
                              ? "border-warning text-warning"
                              : "border-destructive text-destructive"
                        }
                      >
                        {asset.riskLevel
                          ? asset.riskLevel
                              .toLowerCase()
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c: string) => c.toUpperCase())
                          : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          asset.status?.toLowerCase() === "published"
                            ? "default"
                            : "secondary"
                        }
                        className={
                          asset.status?.toLowerCase() === "published"
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                      >
                        {asset.status
                          ? asset.status
                              .toLowerCase()
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c: string) => c.toUpperCase())
                          : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(asset.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(asset.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(asset.id)}
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
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              Comprehensive view of {viewAsset?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {viewAsset && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Asset Name
                      </Label>
                      <p className="font-medium">{viewAsset.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Asset Code
                      </Label>
                      <p className="font-medium">
                        {viewAsset.serialId || viewAsset.id || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Title</Label>
                      <p className="font-medium">{viewAsset.title || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <Badge variant="outline">{viewAsset.type || "—"}</Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <Badge
                        variant={
                          viewAsset.status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {viewAsset.status || "—"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Project Status
                      </Label>
                      <p className="font-medium">
                        {viewAsset.projectStatus || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{viewAsset.location || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Company</Label>
                      <p className="font-medium">
                        {viewAsset.company?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Property Category
                      </Label>
                      <p className="font-medium">
                        {viewAsset.propertyCategory || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="text-sm">
                        {formatDate(viewAsset.createdAt)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Address</Label>
                      <p className="text-sm">{viewAsset.address || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Description
                      </Label>
                      <p className="text-sm">{viewAsset.description || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Physical Details */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Physical Details
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Land Size (sqm)
                      </Label>
                      <p className="font-medium">{viewAsset.landSize || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Built Size (sqm)
                      </Label>
                      <p className="font-medium">
                        {viewAsset.builtSize || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Area (sq m)
                      </Label>
                      <p className="font-medium">{viewAsset.area || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Total Units
                      </Label>
                      <p className="font-medium">
                        {viewAsset.totalUnits || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Available Units
                      </Label>
                      <p className="font-medium">
                        {viewAsset.availableUnits || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Unit Configuration
                      </Label>
                      <p className="font-medium">
                        {viewAsset.unitConfiguration || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Bedrooms</Label>
                      <p className="font-medium">{viewAsset.bedrooms || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Bathrooms</Label>
                      <p className="font-medium">
                        {viewAsset.bathrooms || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Parking</Label>
                      <p className="font-medium">{viewAsset.parking || "—"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Furnished</Label>
                      <p className="font-medium">
                        {viewAsset.furnished || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Facility Management
                      </Label>
                      <p className="font-medium">
                        {viewAsset.facilityManagement === true
                          ? "Yes"
                          : viewAsset.facilityManagement === false
                            ? "No"
                            : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Construction Start
                      </Label>
                      <p className="font-medium">
                        {viewAsset.constructionStart
                          ? formatDate(viewAsset.constructionStart)
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-muted-foreground">
                        Facilities
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewAsset.facilities?.length > 0 ? (
                          viewAsset.facilities.map((f: string) => (
                            <Badge key={f} variant="outline">
                              {f}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Investment */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Pricing & Investment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Ownership Type
                      </Label>
                      <p className="font-medium">
                        {viewAsset.ownershipType || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Total Fractions
                      </Label>
                      <p className="font-medium">
                        {viewAsset.fractionTotal || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Price</Label>
                      <p className="font-medium">
                        {viewAsset.price
                          ? `₦${Number(viewAsset.price).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Markup</Label>
                      <p className="font-medium">
                        {viewAsset.markup
                          ? `₦${Number(viewAsset.markup).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Price Range
                      </Label>
                      <p className="font-medium">
                        {viewAsset.priceRange || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Fraction Cost
                      </Label>
                      <p className="font-medium">
                        {viewAsset.fractionCost
                          ? `₦${Number(viewAsset.fractionCost).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Down Payment
                      </Label>
                      <p className="font-medium">
                        {viewAsset.downPaymentAmount
                          ? `₦${Number(viewAsset.downPaymentAmount).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Funding Status
                      </Label>
                      <p className="font-medium">
                        {viewAsset.fundingStatus
                          ? `${viewAsset.fundingStatus}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Off-plan Discount
                      </Label>
                      <p className="font-medium">
                        {viewAsset.offPlanDiscount
                          ? `${viewAsset.offPlanDiscount}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Stage-based Discount
                      </Label>
                      <p className="font-medium">
                        {viewAsset.stageBasedDiscount
                          ? `${viewAsset.stageBasedDiscount}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Lead Commission
                      </Label>
                      <p className="font-medium">
                        {viewAsset.leadCommission
                          ? `${viewAsset.leadCommission}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Closer Commission
                      </Label>
                      <p className="font-medium">
                        {viewAsset.closerCommission
                          ? `${viewAsset.closerCommission}%`
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Payment Options
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewAsset.paymentOptions?.length > 0 ? (
                          viewAsset.paymentOptions.map((o: string) => (
                            <Badge key={o} variant="outline">
                              {o}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm">—</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Installment Periods
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewAsset.installmentPeriods?.length > 0 ? (
                          viewAsset.installmentPeriods.map((p: string) => (
                            <Badge key={p} variant="outline">
                              {p}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Returns */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Financial Returns
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Projected Rental Income
                      </Label>
                      <p className="font-medium text-accent">
                        {viewAsset.projectedRentalIncome
                          ? `₦${Number(viewAsset.projectedRentalIncome).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Rental Frequency
                      </Label>
                      <p className="font-medium">
                        {viewAsset.rentalFrequency || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Operating Cost (yearly)
                      </Label>
                      <p className="font-medium">
                        {viewAsset.operatingCost
                          ? `₦${Number(viewAsset.operatingCost).toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        First Payout Date
                      </Label>
                      <p className="font-medium">
                        {viewAsset.firstPayoutDate
                          ? formatDate(viewAsset.firstPayoutDate)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Rental Yield
                      </Label>
                      <p className="font-medium">
                        {viewAsset.rentalYield
                          ? `${viewAsset.rentalYield}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Rental Yield (Min - Max)
                      </Label>
                      <p className="font-medium">
                        {viewAsset.rentalYieldMin && viewAsset.rentalYieldMax
                          ? `${viewAsset.rentalYieldMin}% - ${viewAsset.rentalYieldMax}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Capital Appreciation
                      </Label>
                      <p className="font-medium">
                        {viewAsset.capitalAppreciation
                          ? `${viewAsset.capitalAppreciation}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Capital Appreciation (Min - Max)
                      </Label>
                      <p className="font-medium">
                        {viewAsset.capitalAppreciationMin &&
                        viewAsset.capitalAppreciationMax
                          ? `${viewAsset.capitalAppreciationMin}% - ${viewAsset.capitalAppreciationMax}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Total Returns (Min - Max)
                      </Label>
                      <p className="font-medium text-accent">
                        {viewAsset.totalReturnsMin && viewAsset.totalReturnsMax
                          ? `${viewAsset.totalReturnsMin}% - ${viewAsset.totalReturnsMax}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Risk Assessment
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Risk Level
                      </Label>
                      <Badge
                        variant="outline"
                        className={
                          viewAsset.riskLevel?.toLowerCase() === "low"
                            ? "border-accent text-accent"
                            : viewAsset.riskLevel?.toLowerCase() === "medium"
                              ? "border-warning text-warning"
                              : "border-destructive text-destructive"
                        }
                      >
                        {viewAsset.riskLevel || "—"}
                      </Badge>
                    </div>
                    {viewAsset.type !== "Land" &&
                      viewAsset.type !== "Completed" &&
                      viewAsset.projectStatus !== "Completed" &&
                      viewAsset.projectStatus !== "Available" && (
                        <div>
                          <Label className="text-muted-foreground">
                            Construction Stage
                          </Label>
                          <p className="font-medium">
                            {viewAsset.constructionStage || "—"}
                          </p>
                        </div>
                      )}
                    <div>
                      <Label className="text-muted-foreground">
                        Exit Liquidity
                      </Label>
                      <p className="font-medium">
                        {viewAsset.exitLiquidity || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Management Mode
                      </Label>
                      <p className="font-medium">
                        {viewAsset.managementMode || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Off-plan Security
                      </Label>
                      <p className="text-sm">
                        {viewAsset.offPlanSecurity || "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">
                        Risk Factors
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewAsset.riskFactors?.length > 0 ? (
                          viewAsset.riskFactors.map((f: string) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className="border-warning text-warning"
                            >
                              {f}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Media & Documentation
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Images</Label>
                      <p className="font-medium">
                        {viewAsset.images?.length || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Documents</Label>
                      <p className="font-medium">
                        {viewAsset.documents?.length || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Virtual Tours
                      </Label>
                      <p className="font-medium">
                        {viewAsset.virtualTours || 0}
                      </p>
                    </div>
                  </div>

                  {viewAsset.images?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">
                        Image Gallery
                      </Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {viewAsset.images.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-video rounded overflow-hidden border"
                          >
                            <img
                              src={resolveMediaUrl(img.url)}
                              alt={img.caption || "Asset image"}
                              className="w-full h-full object-cover"
                            />
                            {img.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                                {img.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewAsset.documents?.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Documents</Label>
                      <div className="space-y-2 mt-2">
                        {viewAsset.documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 p-2 border rounded"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.type}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={resolveMediaUrl(doc.url)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Stats */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Activity
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">
                        Total Leads
                      </Label>
                      <p className="font-medium">
                        {viewAsset._count?.leads || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        Total Transactions
                      </Label>
                      <p className="font-medium">
                        {viewAsset._count?.transactions || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="text-sm">
                        {formatDate(viewAsset.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
