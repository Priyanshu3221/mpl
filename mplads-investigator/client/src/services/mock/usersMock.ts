import { type Role } from "@/constants/permissions";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  constituencyOrDistrict: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

export const mockManagedUsers: ManagedUser[] = [
  {
    id: "USR-001",
    name: "Dr. Rajesh Sharma",
    email: "citizen.jaipur@mplads.gov.in",
    role: "Citizen",
    department: "Public Transparency Observer",
    constituencyOrDistrict: "Jaipur Rural",
    status: "Active",
    lastLogin: "2024-11-04 11:20 AM",
  },
  {
    id: "USR-002",
    name: "Anil Kumar IAS",
    email: "district.authority@mplads.gov.in",
    role: "District Authority",
    department: "District Magistrate Office, Jaipur",
    constituencyOrDistrict: "Jaipur",
    status: "Active",
    lastLogin: "2024-11-04 09:45 AM",
  },
  {
    id: "USR-003",
    name: "Sanjay Verma",
    email: "agency.pwd@mplads.gov.in",
    role: "District Authority",
    department: "Public Works Dept (PWD)",
    constituencyOrDistrict: "Jaipur Division",
    status: "Active",
    lastLogin: "2024-11-02 04:15 PM",
  },
  {
    id: "USR-004",
    name: "Priya Sundaram",
    email: "admin@mplads.gov.in",
    role: "Admin",
    department: "MoSPI IT Directorate",
    constituencyOrDistrict: "New Delhi Central",
    status: "Active",
    lastLogin: "2024-11-04 08:30 AM",
  },
  {
    id: "USR-005",
    name: "Sunil Mehta",
    email: "citizen.rural@mplads.gov.in",
    role: "Citizen",
    department: "Civil Society Monitoring Group",
    constituencyOrDistrict: "Udaipur",
    status: "Inactive",
    lastLogin: "2024-10-15 02:10 PM",
  },
];
