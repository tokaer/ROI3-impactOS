import express from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

// ── Users ──────────────────────────────────────────────────────────────────

app.get("/api/users", async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ── ROI Settings ───────────────────────────────────────────────────────────

app.get("/api/roi-settings", async (_req, res) => {
  let settings = await prisma.roiSettings.findFirst();
  if (!settings) {
    settings = await prisma.roiSettings.create({ data: {} });
  }
  res.json(settings);
});

app.patch("/api/roi-settings/:id", async (req, res) => {
  const existing = await prisma.roiSettings.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ error: "Settings not found" });

  const { currency, discountRate, taxRate, cashflowHorizonYears } = req.body;
  const data: Prisma.RoiSettingsUpdateInput = {};
  if (currency !== undefined) data.currency = currency;
  if (discountRate !== undefined) data.discountRate = discountRate;
  if (taxRate !== undefined) data.taxRate = taxRate;
  if (cashflowHorizonYears !== undefined)
    data.cashflowHorizonYears = cashflowHorizonYears;

  const updated = await prisma.roiSettings.update({
    where: { id: req.params.id },
    data,
  });
  res.json(updated);
});

// ── Variables ──────────────────────────────────────────────────────────────

app.get("/api/variables", async (_req, res) => {
  const variables = await prisma.variable.findMany({
    orderBy: { name: "asc" },
  });
  res.json(variables);
});

app.get("/api/variables/:id", async (req, res) => {
  const variable = await prisma.variable.findUnique({
    where: { id: req.params.id },
  });
  if (!variable) return res.status(404).json({ error: "Variable not found" });
  res.json(variable);
});

app.post("/api/variables", async (req, res) => {
  const {
    name,
    description,
    unit,
    method,
    startYear,
    horizonYears,
    startValue,
    cagr,
    manualValues,
  } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!startYear || typeof startYear !== "number") {
    return res.status(400).json({ error: "startYear is required" });
  }

  const variable = await prisma.variable.create({
    data: {
      name: name.trim(),
      description: description || null,
      unit: unit || "",
      method: method || "fix",
      startYear,
      horizonYears: horizonYears ?? 10,
      startValue: startValue ?? 0,
      cagr: cagr ?? 0,
      manualValues: manualValues || "{}",
    },
  });
  res.status(201).json(variable);
});

app.patch("/api/variables/:id", async (req, res) => {
  const existing = await prisma.variable.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ error: "Variable not found" });

  const data: Prisma.VariableUpdateInput = {};
  const {
    name,
    description,
    unit,
    method,
    startYear,
    horizonYears,
    startValue,
    cagr,
    manualValues,
  } = req.body;

  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description || null;
  if (unit !== undefined) data.unit = unit;
  if (method !== undefined) data.method = method;
  if (startYear !== undefined) data.startYear = startYear;
  if (horizonYears !== undefined) data.horizonYears = horizonYears;
  if (startValue !== undefined) data.startValue = startValue;
  if (cagr !== undefined) data.cagr = cagr;
  if (manualValues !== undefined) data.manualValues = manualValues;

  const updated = await prisma.variable.update({
    where: { id: req.params.id },
    data,
  });
  res.json(updated);
});

app.delete("/api/variables/:id", async (req, res) => {
  const existing = await prisma.variable.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ error: "Variable not found" });
  await prisma.variable.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ── Actions ────────────────────────────────────────────────────────────────

const ACTION_INCLUDE = {
  assignee: true,
  monetizationVariable: true,
};

app.get("/api/actions", async (req, res) => {
  const { q, status, sortBy, sortDir } = req.query;

  const where: Prisma.ActionWhereInput = {};

  if (typeof q === "string" && q.trim()) {
    where.OR = [
      { title: { contains: q.trim() } },
      { description: { contains: q.trim() } },
    ];
  }

  if (status) {
    const statuses = Array.isArray(status)
      ? (status as string[])
      : (status as string).split(",");
    if (statuses.length > 0) {
      where.status = { in: statuses };
    }
  }

  type SortField = "title" | "dueDate" | "startDate" | "updatedAt";
  const validSortFields: SortField[] = [
    "title",
    "dueDate",
    "startDate",
    "updatedAt",
  ];
  const field: SortField = validSortFields.includes(sortBy as SortField)
    ? (sortBy as SortField)
    : "updatedAt";
  const dir = sortDir === "asc" ? "asc" : "desc";

  const orderBy: Prisma.ActionOrderByWithRelationInput = { [field]: dir };

  const actions = await prisma.action.findMany({
    where,
    orderBy,
    include: ACTION_INCLUDE,
  });

  res.json(actions);
});

app.get("/api/actions/:id", async (req, res) => {
  const action = await prisma.action.findUnique({
    where: { id: req.params.id },
    include: ACTION_INCLUDE,
  });
  if (!action) return res.status(404).json({ error: "Action not found" });
  res.json(action);
});

app.post("/api/actions", async (req, res) => {
  const { title, description, status, assigneeId, startDate, dueDate, progressNote } =
    req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const action = await prisma.action.create({
    data: {
      title: title.trim(),
      description: description || null,
      status: status || "OFFEN",
      assigneeId: assigneeId || null,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      progressNote: progressNote || null,
    },
    include: ACTION_INCLUDE,
  });

  res.status(201).json(action);
});

// Whitelist of allowed ROI fields on Action
const ROI_NUMBER_FIELDS = [
  "kpiBaselinePerYear",
  "impactValue",
  "monetizationFixedEurPerUnit",
  "capexEquipment",
  "capexInstallation",
  "capexSoftware",
  "capexConsulting",
  "capexOther",
  "grantAmount",
  "grantPercent",
  "opexMaintenance",
  "opexLicenses",
  "opexPersonnel",
  "opexOther",
  "otherBenefitsPerYear",
  "otherCostsPerYear",
] as const;

const ROI_STRING_FIELDS = [
  "kpiName",
  "kpiUnit",
  "impactType",
  "justification",
] as const;

const ROI_INT_FIELDS = ["depreciationYears"] as const;

app.patch("/api/actions/:id", async (req, res) => {
  const existing = await prisma.action.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ error: "Action not found" });

  const { title, description, status, assigneeId, startDate, dueDate, progressNote } =
    req.body;

  if (title !== undefined && (!title || typeof title !== "string" || !title.trim())) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }

  const data: Prisma.ActionUpdateInput = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description || null;
  if (status !== undefined) data.status = status;
  if (assigneeId !== undefined) {
    data.assignee = assigneeId
      ? { connect: { id: assigneeId } }
      : { disconnect: true };
  }
  if (startDate !== undefined)
    data.startDate = startDate ? new Date(startDate) : null;
  if (dueDate !== undefined)
    data.dueDate = dueDate ? new Date(dueDate) : null;
  if (progressNote !== undefined) data.progressNote = progressNote || null;

  // ROI number fields
  for (const f of ROI_NUMBER_FIELDS) {
    if (req.body[f] !== undefined) {
      (data as Record<string, unknown>)[f] =
        req.body[f] === null || req.body[f] === "" ? null : Number(req.body[f]);
    }
  }

  // ROI string fields
  for (const f of ROI_STRING_FIELDS) {
    if (req.body[f] !== undefined) {
      (data as Record<string, unknown>)[f] = req.body[f] || null;
    }
  }

  // ROI int fields
  for (const f of ROI_INT_FIELDS) {
    if (req.body[f] !== undefined) {
      (data as Record<string, unknown>)[f] =
        req.body[f] === null || req.body[f] === ""
          ? null
          : Math.round(Number(req.body[f]));
    }
  }

  // Monetization variable (FK)
  if (req.body.monetizationVariableId !== undefined) {
    data.monetizationVariable = req.body.monetizationVariableId
      ? { connect: { id: req.body.monetizationVariableId } }
      : { disconnect: true };
  }

  const action = await prisma.action.update({
    where: { id: req.params.id },
    data,
    include: ACTION_INCLUDE,
  });

  res.json(action);
});

app.delete("/api/actions/:id", async (req, res) => {
  const existing = await prisma.action.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) return res.status(404).json({ error: "Action not found" });

  await prisma.action.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ── Start ──────────────────────────────────────────────────────────────────

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
