const sampleProjects = [
  {
    id: "MPLADS-2024-001",
    name: "Construction of Multi-Purpose Community Hall",
    category: "Infrastructure",
    state: "Maharashtra",
    district: "Pune",
    constituency: "Pune Central",
    agency: "Public Works Department (PWD)",
    fy: "2024-25",
    status: "Approved",
    amount: 5000000,
    utilized: 3200000,
    progress: 65,
    submitted: "2024-01-15",
    updated: "2024-05-10"
  },
  {
    id: "MPLADS-2024-002",
    name: "Installation of Solar LED Street Lights in Rural Panchayats",
    category: "Infrastructure",
    state: "Maharashtra",
    district: "Nagpur",
    constituency: "Nagpur Urban",
    agency: "Nagpur Zilla Parishad",
    fy: "2024-25",
    status: "Under implementation",
    amount: 3500000,
    utilized: 2100000,
    progress: 50,
    submitted: "2024-02-01",
    updated: "2024-06-01"
  },
  {
    id: "MPLADS-2024-003",
    name: "Upgradation of High School Science Laboratories",
    category: "Education",
    state: "Odisha",
    district: "Khurda",
    constituency: "Bhubaneswar",
    agency: "District Education Office",
    fy: "2023-24",
    status: "Completed",
    amount: 2500000,
    utilized: 2500000,
    progress: 100,
    submitted: "2023-08-12",
    updated: "2024-03-20"
  }
];

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method === "POST") {
    const payload = req.body || {};
    const newProject = {
      id: `MPLADS-${Date.now()}`,
      name: payload.projectName || "New Community Project",
      category: payload.category || "Infrastructure",
      state: payload.state || "Maharashtra",
      district: payload.district || "Pune",
      constituency: payload.constituency || "Pune Central",
      agency: payload.agencyName || "PWD",
      fy: "2024-25",
      status: "Submitted",
      amount: payload.estimatedCost || 1000000,
      utilized: 0,
      progress: 0,
      submitted: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    return res.status(201).json(newProject);
  }
  return res.status(200).json(sampleProjects);
};
