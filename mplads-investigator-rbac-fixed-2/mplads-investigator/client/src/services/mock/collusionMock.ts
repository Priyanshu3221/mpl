export type CollusionStatus = "Unreviewed" | "Under Investigation" | "Confirmed" | "Dismissed";

export interface CollusionPair {
  id: string;
  entityA: {
    name: string;
    type: "Contractor" | "Agency" | "Vendor";
    id: string;
  };
  entityB: {
    name: string;
    type: "Contractor" | "Agency" | "Vendor";
    id: string;
  };
  relationshipType: string;
  relationshipReason: string;
  riskScore: number; // 0 to 100
  severity: "High" | "Medium" | "Low";
  explanation: string;
  sharedProjectsCount: number;
  totalContractValue: number;
  projectIds: string[];
  status: CollusionStatus;
  detectedDate: string;
  evidence: string[];
}

export const mockCollusionPairs: CollusionPair[] = [
  {
    id: "COL-2024-001",
    entityA: {
      name: "Apex Infrastructure Pvt Ltd",
      type: "Contractor",
      id: "VEN-8831",
    },
    entityB: {
      name: "Zenith Construction Services",
      type: "Contractor",
      id: "VEN-8832",
    },
    relationshipType: "Shared Beneficial Ownership & Bidding Ring",
    relationshipReason: "Identical registered address, common directors (Rajesh Sharma & Anita Sharma), and synchronized bidding patterns in 4 constituency tenders.",
    riskScore: 92,
    severity: "High",
    explanation:
      "Apex Infrastructure and Zenith Construction submitted bids for the same 4 community hall projects in Jaipur district. Bid time stamps differed by under 3 minutes, and both tenders used identical IP addresses and banking guarantors. One company consistently bid 2% lower than the statutory estimate while the other placed an artificially high cover bid.",
    sharedProjectsCount: 4,
    totalContractValue: 14500000,
    projectIds: ["MPLADS-2024-001", "MPLADS-2024-004"],
    status: "Unreviewed",
    detectedDate: "2024-10-14",
    evidence: [
      "Common Directors registered in MCA database (DIN: 08849201, 08849202)",
      "Identical registered GSTIN billing address (Plot 42, Malviya Nagar, Jaipur)",
      "IP address match during e-tender submission (103.21.126.44)",
      "Bank Guarantee issued by same branch with consecutive serial numbers",
    ],
  },
  {
    id: "COL-2024-002",
    entityA: {
      name: "Sunrise Solar & Electricals",
      type: "Vendor",
      id: "VEN-4102",
    },
    entityB: {
      name: "BrightPower Energy Solutions",
      type: "Vendor",
      id: "VEN-4109",
    },
    relationshipType: "Overlapping Bank Accounts & Split Procurement",
    relationshipReason: "Disbursement payouts credited to identical IFSC and primary account holder name across separate work orders.",
    riskScore: 84,
    severity: "High",
    explanation:
      "Two vendor entities received separate procurement orders for high-mast solar light installations. Audit logs show both entities deposited payment cheques into a single shared HDFC bank account owned by the same proprietor, circumventing tender limits for single work orders.",
    sharedProjectsCount: 3,
    totalContractValue: 8800000,
    projectIds: ["MPLADS-2024-002"],
    status: "Under Investigation",
    detectedDate: "2024-10-18",
    evidence: [
      "Payment disbursement logs match Bank Account #50200049182390",
      "PAN number of primary signatory is identical across vendor registrations",
      "Work order amounts split just below the ₹10 Lakh mandatory open tender threshold",
    ],
  },
  {
    id: "COL-2024-003",
    entityA: {
      name: "Gramin Vikas Nirman Samiti",
      type: "Agency",
      id: "AGY-1049",
    },
    entityB: {
      name: "BlueSky Logistics & Materials",
      type: "Vendor",
      id: "VEN-9011",
    },
    relationshipType: "Conflict of Interest & Kinship Linkage",
    relationshipReason: "Implementing agency key official's immediate family member holds majority equity in material vendor firm.",
    riskScore: 76,
    severity: "Medium",
    explanation:
      "The Executive Engineer for the rural road project awarded sole-source material supply contracts to BlueSky Logistics, which is 100% owned by the official's spouse. No public quotation call was recorded in the district procurement log.",
    sharedProjectsCount: 2,
    totalContractValue: 6200000,
    projectIds: ["MPLADS-2024-003"],
    status: "Unreviewed",
    detectedDate: "2024-11-02",
    evidence: [
      "State employee declaration cross-checked with Registrar of Companies filings",
      "Absence of published tender notification on e-procurement portal",
      "Single-quotation invoice approval recorded by agency official",
    ],
  },
  {
    id: "COL-2024-004",
    entityA: {
      name: "Himalayan Builders Syndicate",
      type: "Contractor",
      id: "VEN-3301",
    },
    entityB: {
      name: "Valley Earthmovers & Construction",
      type: "Contractor",
      id: "VEN-3305",
    },
    relationshipType: "Rotational Bid Allocation",
    relationshipReason: "Systematic rotation of winning bids among 2 contractors across 6 consecutive constituency tenders.",
    riskScore: 68,
    severity: "Medium",
    explanation:
      "Pattern analysis across 6 drinking water RO plant tenders revealed that Himalayan Builders and Valley Earthmovers alternately submit winning bids by a margin of less than 0.5%, ensuring each firm wins exactly 50% of contracts at elevated prices.",
    sharedProjectsCount: 6,
    totalContractValue: 18200000,
    projectIds: ["MPLADS-2024-005"],
    status: "Dismissed",
    detectedDate: "2024-09-28",
    evidence: [
      "6 consecutive tenders with perfectly alternating L1 bid placement",
      "Average winning price is 14% higher than standard state PWD schedule rates",
    ],
  },
];
