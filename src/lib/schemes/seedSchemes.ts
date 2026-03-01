export const seedSchemes = [
  // -------------------------
  // CENTRAL (examples)
  // -------------------------
  {
    scope: "central",
    state: "",
    title: "PM-KISAN Samman Nidhi",
    slug: "pm-kisan",
    category: "income_support",
    shortDescription: "Income support guidance + application checklist + payment tracking help.",
    benefits: ["Income support in installments (as per official rules)."],
    eligibility: ["Farmer family as per PM-KISAN eligibility", "Aadhaar + bank account", "Land details as per rules"],
    documents: ["Aadhaar", "Land records", "Bank account details", "Mobile number"],
    howToApply: ["Apply via official portal/CSC", "Complete eKYC", "Verify bank details", "Track status on portal"],
    officialLink: "https://pmkisan.gov.in/",
    tags: ["income", "support", "pm-kisan"],
    isActive: true,
  },
  {
    scope: "central",
    state: "",
    title: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    slug: "pmfby",
    category: "insurance",
    shortDescription: "Crop insurance guidance based on risks, enrollment windows and claim process.",
    benefits: ["Financial support on crop loss (as per notified crops/areas)."],
    eligibility: ["Farmer growing notified crops in notified areas", "Enrollment within deadline"],
    documents: ["Aadhaar", "Bank details", "Land/crop details", "Sowing proof if required"],
    howToApply: ["Enroll via bank/CSC/portal", "Pay premium", "Keep receipt", "Claim on loss"],
    officialLink: "https://pmfby.gov.in/",
    tags: ["insurance", "risk"],
    isActive: true,
  },
  {
    scope: "central",
    state: "",
    title: "Kisan Credit Card (KCC) Guidance",
    slug: "kcc",
    category: "loan",
    shortDescription: "Loan/credit guidance: documents, eligibility checklist and best next steps.",
    benefits: ["Access to affordable crop loans/credit (as per bank eligibility)."],
    eligibility: ["Farmer with land/cultivation proof", "Bank KYC compliance"],
    documents: ["Aadhaar", "PAN (if required)", "Land records / tenancy proof", "Bank KYC docs"],
    howToApply: ["Apply at bank/branch", "Submit KYC + land/crop details", "Credit assessment", "Track approval"],
    officialLink: "",
    tags: ["loan", "kcc"],
    isActive: true,
  },

  // -------------------------
  // STATE (placeholders – safe MVP)
  // Replace titles/links with exact official schemes later.
  // -------------------------

  // Odisha
  {
    scope: "state",
    state: "Odisha",
    title: "Odisha Farmer Support / Subsidy Scheme (Add exact scheme)",
    slug: "odisha-farmer-support",
    category: "subsidy",
    shortDescription: "State-level support/subsidy guidance. Replace with exact Odisha scheme details.",
    benefits: ["State assistance/subsidy as per guidelines."],
    eligibility: ["Resident farmer of Odisha", "Meets scheme criteria"],
    documents: ["Aadhaar", "Residence proof", "Bank details", "Land/cultivation proof"],
    howToApply: ["Check state portal/office", "Submit form", "Track status"],
    officialLink: "",
    tags: ["odisha", "subsidy"],
    isActive: true,
  },

  // Bihar
  {
    scope: "state",
    state: "Bihar",
    title: "Bihar Agriculture Support / Input Subsidy (Add exact scheme)",
    slug: "bihar-agri-support",
    category: "subsidy",
    shortDescription: "State agriculture support/subsidy guidance. Replace with exact Bihar scheme details.",
    benefits: ["Subsidy/assistance for eligible farmers."],
    eligibility: ["Resident farmer of Bihar", "Meets scheme criteria"],
    documents: ["Aadhaar", "Bank details", "Land/cultivation proof"],
    howToApply: ["Check state portal/office", "Submit form", "Track status"],
    officialLink: "",
    tags: ["bihar", "subsidy"],
    isActive: true,
  },

  // Punjab
  {
    scope: "state",
    state: "Punjab",
    title: "Punjab Agriculture Subsidy / Machinery Support (Add exact scheme)",
    slug: "punjab-agri-subsidy",
    category: "equipment",
    shortDescription: "State scheme for farming support (subsidy/equipment). Replace with exact Punjab scheme details.",
    benefits: ["Support for eligible farmers as per guidelines."],
    eligibility: ["Resident farmer of Punjab", "Meets criteria"],
    documents: ["Aadhaar", "Bank details", "Land proof"],
    howToApply: ["Check state portal/office", "Submit application", "Track status"],
    officialLink: "",
    tags: ["punjab", "equipment", "subsidy"],
    isActive: true,
  },

  // Kerala
  {
    scope: "state",
    state: "Kerala",
    title: "Kerala Farmer Welfare / Agriculture Assistance (Add exact scheme)",
    slug: "kerala-farmer-welfare",
    category: "subsidy",
    shortDescription: "State-level welfare/agri assistance guidance. Replace with exact Kerala scheme details.",
    benefits: ["Support/subsidy per state rules."],
    eligibility: ["Resident farmer of Kerala", "Meets criteria"],
    documents: ["Aadhaar", "Bank details", "Residence proof"],
    howToApply: ["Check state portal/office", "Apply", "Track status"],
    officialLink: "",
    tags: ["kerala", "subsidy"],
    isActive: true,
  },

  // Andhra Pradesh
  {
    scope: "state",
    state: "Andhra Pradesh",
    title: "Andhra Pradesh Agriculture Support (Add exact scheme)",
    slug: "ap-agri-support",
    category: "subsidy",
    shortDescription: "State agriculture support guidance. Replace with exact Andhra Pradesh scheme details.",
    benefits: ["Support for eligible farmers as per state rules."],
    eligibility: ["Resident farmer of Andhra Pradesh", "Meets criteria"],
    documents: ["Aadhaar", "Bank details", "Land/cultivation proof"],
    howToApply: ["Check state portal/office", "Submit application", "Track status"],
    officialLink: "",
    tags: ["andhra pradesh", "subsidy"],
    isActive: true,
  },

  // Tamil Nadu
  {
    scope: "state",
    state: "Tamil Nadu",
    title: "Tamil Nadu Agriculture Assistance / Subsidy (Add exact scheme)",
    slug: "tn-agri-assistance",
    category: "subsidy",
    shortDescription: "State agriculture assistance guidance. Replace with exact Tamil Nadu scheme details.",
    benefits: ["Subsidy/support for eligible farmers."],
    eligibility: ["Resident farmer of Tamil Nadu", "Meets criteria"],
    documents: ["Aadhaar", "Bank details", "Land/cultivation proof"],
    howToApply: ["Check state portal/office", "Apply", "Track status"],
    officialLink: "",
    tags: ["tamil nadu", "subsidy"],
    isActive: true,
  },
] as const;