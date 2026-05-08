export const WORK_AUTH_OPTIONS = [
  { value: "Canadian Citizen",                       hasExpiry: false },
  { value: "Permanent Resident",                     hasExpiry: false },
  { value: "Work Permit",                            hasExpiry: true  },
  { value: "Open Work Permit",                       hasExpiry: true  },
  { value: "Post-Graduate Work Permit (PGWP)",       hasExpiry: true  },
  { value: "Bridging Open Work Permit (BOWP)",       hasExpiry: true  },
  { value: "Study Permit (Work Authorization)",      hasExpiry: true  },
  { value: "International Mobility Program (IMP)",   hasExpiry: true  },
  { value: "Seasonal Agricultural Worker Program",   hasExpiry: true  },
];

export const workAuthNeedsExpiry = (val: string): boolean =>
  WORK_AUTH_OPTIONS.find((o) => o.value === val)?.hasExpiry ?? false;

export const FALLBACK_CATEGORIES = [
  "Backhaul",
  "Combo",
  "Extra Sheet/E.W",
  "Regular/Banner",
  "Wholesale",
  "Wholesale DZ",
];

export const INITIAL_DRIVER_STATE = {
  name: "",
  email: "",
  contact: "",
  address: "",
  hst_gst: "",
  business_name: "",
  backhaulRate: "",
  comboRate: "",
  extraSheetEWRate: "",
  regularBannerRate: "",
  wholesaleRate: "",
  voilaRate: "",
  tcsLinehaulTrentonRate: "",
  categoryRates: {} as Record<string, string>,
  licence: "",
  licence_expiry_date: "",
  status: "Active",
  trainings: [],
  username: "",
  password: "",
  sinNo: "",
  workStatus: "",
  workAuthExpiry: "",
  emergencyContact: { name: "", phone: "", relationship: "" },
};

export const INITIAL_ADD_ERRORS = {
  name: "",
  email: "",
  contact: "",
  hst_gst: "",
  sinNo: "",
  licence: "",
  licence_expiry_date: "",
  workAuthExpiry: "",
  password: "",
  username: "",
  workStatus: "",
};

export const generatePassword = (): string =>
  Math.random().toString(36).slice(-8);

export const exportDriversToExcel = async (filteredData: any[]): Promise<void> => {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Drivers");
  worksheet.columns = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Contact", key: "contact" },
    { header: "Username", key: "username" },
    { header: "Status", key: "status" },
    { header: "Work Status", key: "workStatus" },
    { header: "Hours This Week", key: "hoursThisWeek" },
    { header: "Licence Class", key: "licence" },
    { header: "Licence Expiry", key: "licence_expiry_date" },
    { header: "Business Name", key: "business_name" },
    { header: "HST/GST", key: "hst_gst" },
    { header: "Address", key: "address" },
    { header: "Combo Rate", key: "comboRate" },
    { header: "Backhaul Rate", key: "backhaulRate" },
    { header: "Regular/Banner Rate", key: "regularBannerRate" },
    { header: "Wholesale Rate", key: "wholesaleRate" },
    { header: "Voila Rate", key: "voilaRate" },
    { header: "TCS Linehaul Trenton Rate", key: "tcsLinehaulTrentonRate" },
  ];
  worksheet.addRows(filteredData.map((d: any) => ({
    name: d.name || "",
    email: d.email || "",
    contact: d.contact || "",
    username: d.username || "",
    status: d.status || "",
    workStatus: d.workStatus || "",
    hoursThisWeek: d.hoursThisWeek || 0,
    licence: d.licence || "",
    licence_expiry_date: d.licence_expiry_date || "",
    business_name: d.business_name || "",
    hst_gst: d.hst_gst || "",
    address: d.address || "",
    comboRate: d.comboRate || "",
    backhaulRate: d.backhaulRate || "",
    regularBannerRate: d.regularBannerRate || "",
    wholesaleRate: d.wholesaleRate || "",
    voilaRate: d.voilaRate || "",
    tcsLinehaulTrentonRate: d.tcsLinehaulTrentonRate || "",
  })));
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "drivers_export.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatContact = (raw: string): string => {
  const withoutPrefix = raw.replace(/^\+1[\s\-\(]*/, "");
  let digits = withoutPrefix.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const formatSIN = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const validateHstGst = (value: string): string => {
  if (!value.trim()) return "";
  const normalized = value.trim().replace(/\s+/g, "").toUpperCase();
  if (!/^\d{9}RT\d{4}$/.test(normalized))
    return "Invalid format. Expected 9 digits + RT + 4 digits (e.g. 123456789RT0001).";
  return "";
};

export const validateExpiryDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return "Licence expiry date must be in the future.";
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  if (date <= soon) return "Warning: Licence expires within 30 days.";
  return "";
};

export const validateWorkAuthExpiry = (dateStr: string): string => {
  if (!dateStr) return "Work authorization expiry date is required.";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date <= today) return "Work authorization expiry date must be in the future.";
  return "";
};
