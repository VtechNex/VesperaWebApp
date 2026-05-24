const REPORT_TITLE = "VESPERA ESTATES";
const REPORT_SUBTITLE = "Luxury Real Estate CRM Lead Report";
const DATA_HEADERS = [
  "Sr No",
  "Lead Name",
  "Phone",
  "Email",
  "Organization",
  "List",
  "Stage / Status",
  "Follow-Up Status",
  "Deal Status",
  "Created Date",
  "Updated Date",
  "Assigned To",
  "Notes",
];

const COLORS = {
  black: "FF111111",
  charcoal: "FF1B1B1B",
  slate: "FF262626",
  gold: "FFD4AF37",
  goldSoft: "FFF4E7B3",
  goldMuted: "FF8C6A15",
  ivory: "FFF7F1E3",
  white: "FFFFFFFF",
  line: "FF3A3428",
  altRow: "FFF9F4E8",
  mutedText: "FFC9B98D",
  cardDark: "FF201A11",
};

const DATE_FORMAT = "dd mmm yyyy";

function safeValue(value) {
  if (value == null) return "-";
  const stringValue = String(value).trim();
  return stringValue ? stringValue : "-";
}

function getDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDateTime(value) {
  const parsed = getDateValue(value);
  if (!parsed) return safeValue(value);

  const datePart = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
  const timePart = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);

  return `${datePart} | ${timePart}`;
}

function formatFilenameDate(value) {
  const parsed = getDateValue(value) || new Date();
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeStage(lead) {
  return safeValue(lead?.lead_stage || lead?.leadStage || lead?.stage);
}

function normalizeDealStatus(lead) {
  return safeValue(
    lead?.deal_status || lead?.dealStatus || lead?.lead_potential || lead?.leadPotential
  );
}

function normalizeAssignedTo(lead) {
  return safeValue(lead?.assignee_name || lead?.assignee_email || lead?.assigned_to || lead?.assignedTo);
}

function normalizeFollowUpStatus(lead) {
  if (lead?.do_not_follow_up || lead?.doNotFollowUp) return "Do Not Follow-Up";
  if (lead?.repeat_follow_up || lead?.repeatFollowUp) return "Repeating";
  if (lead?.follow_up_date || lead?.followUpDate) return "Scheduled";
  return "-";
}

function buildLeadName(lead) {
  return safeValue(`${lead?.fname || ""} ${lead?.lname || ""}`.trim());
}

function buildListNameMap(lists = []) {
  return new Map(
    lists.map((list) => [String(list?.id), safeValue(list?.name)])
  );
}

function getListName(lead, listNameMap) {
  return listNameMap.get(String(lead?.list_id)) || "-";
}

function isHotLead(lead, listName) {
  const potential = String(lead?.lead_potential || lead?.leadPotential || "").toLowerCase();
  return potential === "high" || String(listName).toLowerCase().includes("hot");
}

function isClosedLead(lead) {
  const value = `${lead?.deal_status || lead?.dealStatus || ""} ${lead?.lead_stage || lead?.leadStage || lead?.stage || ""}`.toLowerCase();
  return ["closed", "won", "deal done"].some((keyword) => value.includes(keyword));
}

function isOpenLead(lead) {
  const stage = String(lead?.lead_stage || lead?.leadStage || lead?.stage || "").toLowerCase();
  return stage === "open" || stage.includes("open");
}

function isWorkingLead(lead) {
  const stage = String(lead?.lead_stage || lead?.leadStage || lead?.stage || "").toLowerCase();
  return ["contacted", "qualified", "follow up", "follow-up", "working"].some((keyword) =>
    stage.includes(keyword)
  );
}

function isFollowUpPending(lead) {
  return Boolean(
    (lead?.follow_up_date || lead?.followUpDate) &&
      !(lead?.do_not_follow_up || lead?.doNotFollowUp) &&
      !isClosedLead(lead)
  );
}

function createBorder(color = COLORS.line) {
  return {
    top: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } },
  };
}

function mergeAndStyle(sheet, range, value, style = {}) {
  sheet.mergeCells(range);
  const cell = sheet.getCell(range.split(":")[0]);
  cell.value = value;
  Object.assign(cell, style);
  return cell;
}

function buildReportRows(leads = [], listNameMap) {
  const rows = [];
  const analytics = {
    totalLeads: leads.length,
    openLeads: 0,
    hotLeads: 0,
    workingLeads: 0,
    dealClosed: 0,
    followUpPending: 0,
    byStatus: new Map(),
    byList: new Map(),
    byDealStage: new Map(),
    byAssignee: new Map(),
  };

  for (let index = 0; index < leads.length; index += 1) {
    const lead = leads[index];
    const listName = getListName(lead, listNameMap);
    const stage = normalizeStage(lead);
    const followUpStatus = normalizeFollowUpStatus(lead);
    const dealStatus = normalizeDealStatus(lead);
    const assignedTo = normalizeAssignedTo(lead);

    if (isOpenLead(lead)) analytics.openLeads += 1;
    if (isHotLead(lead, listName)) analytics.hotLeads += 1;
    if (isWorkingLead(lead)) analytics.workingLeads += 1;
    if (isClosedLead(lead)) analytics.dealClosed += 1;
    if (isFollowUpPending(lead)) analytics.followUpPending += 1;

    analytics.byStatus.set(stage, (analytics.byStatus.get(stage) || 0) + 1);
    analytics.byList.set(listName, (analytics.byList.get(listName) || 0) + 1);
    analytics.byDealStage.set(dealStatus, (analytics.byDealStage.get(dealStatus) || 0) + 1);
    analytics.byAssignee.set(assignedTo, (analytics.byAssignee.get(assignedTo) || 0) + 1);

    rows.push({
      serialNumber: index + 1,
      leadName: buildLeadName(lead),
      phone: safeValue(lead?.mobile),
      email: safeValue(lead?.email),
      organization: safeValue(lead?.organization),
      listName,
      stage,
      followUpStatus,
      dealStatus,
      createdDate: getDateValue(lead?.created_at || lead?.createdAt),
      updatedDate: getDateValue(lead?.updated_at || lead?.updatedAt),
      assignedTo,
      notes: safeValue(lead?.notes),
    });
  }

  return { rows, analytics };
}

function setColumnWidths(sheet, rows) {
  const widths = [
    8,
    26,
    18,
    32,
    24,
    18,
    18,
    18,
    18,
    16,
    16,
    20,
    42,
  ];

  const autoFitIndexes = [2, 4, 5, 13];

  for (const columnIndex of autoFitIndexes) {
    let maxLength = DATA_HEADERS[columnIndex - 1].length;
    for (const row of rows) {
      const fieldValue =
        columnIndex === 2
          ? row.leadName
          : columnIndex === 4
            ? row.email
            : columnIndex === 5
              ? row.organization
              : row.notes;
      maxLength = Math.max(maxLength, String(fieldValue).length);
    }
    const cap = columnIndex === 13 ? 55 : 34;
    widths[columnIndex - 1] = Math.min(Math.max(maxLength + 2, widths[columnIndex - 1]), cap);
  }

  sheet.columns = widths.map((width) => ({ width }));
}

function addDataTable(sheet, rows) {
  const headerRowNumber = 1;
  const headerRow = sheet.getRow(headerRowNumber);
  headerRow.values = DATA_HEADERS;
  headerRow.height = 24;

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.goldMuted } };
    cell.border = createBorder(COLORS.goldMuted);
  });

  const centerColumns = new Set([1, 3, 6, 7, 8, 9, 10, 11, 12]);

  rows.forEach((entry, index) => {
    const row = sheet.getRow(headerRowNumber + index + 1);
    row.values = [
      entry.serialNumber,
      entry.leadName,
      entry.phone,
      entry.email,
      entry.organization,
      entry.listName,
      entry.stage,
      entry.followUpStatus,
      entry.dealStatus,
      entry.createdDate || "-",
      entry.updatedDate || "-",
      entry.assignedTo,
      entry.notes,
    ];

    const estimatedLines = Math.max(
      1,
      Math.ceil(String(entry.notes).length / 55),
      String(entry.notes).split(/\r?\n/).length
    );
    row.height = Math.min(Math.max(20, estimatedLines * 15), 72);

    row.eachCell((cell, columnNumber) => {
      cell.border = createBorder(COLORS.line);
      cell.alignment = {
        vertical: "top",
        horizontal: centerColumns.has(columnNumber) ? "center" : "left",
        wrapText: columnNumber === 13,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.altRow },
      };
      if (columnNumber === 3) {
        cell.numFmt = "@";
      }
      if ((columnNumber === 10 || columnNumber === 11) && cell.value instanceof Date) {
        cell.numFmt = DATE_FORMAT;
        cell.alignment = { horizontal: "center", vertical: "top" };
      }
    });
  });

  const lastDataRow = Math.max(headerRowNumber + rows.length, headerRowNumber);
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: lastDataRow, column: DATA_HEADERS.length },
  };
}

function addAnalyticsTable(sheet, startRow, startColumn, title, entries) {
  const titleCell = sheet.getCell(startRow, startColumn);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 12, color: { argb: COLORS.gold } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } };
  titleCell.border = createBorder(COLORS.line);
  titleCell.alignment = { horizontal: "left", vertical: "middle" };

  const headerRow = sheet.getRow(startRow + 1);
  headerRow.getCell(startColumn).value = "Category";
  headerRow.getCell(startColumn + 1).value = "Count";

  [startColumn, startColumn + 1].forEach((column) => {
    const cell = headerRow.getCell(column);
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.goldMuted } };
    cell.border = createBorder(COLORS.goldMuted);
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  entries.forEach(([label, count], index) => {
    const row = sheet.getRow(startRow + 2 + index);
    row.getCell(startColumn).value = safeValue(label);
    row.getCell(startColumn + 1).value = count;

    [startColumn, startColumn + 1].forEach((column) => {
      const cell = row.getCell(column);
      cell.border = createBorder(COLORS.line);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.altRow },
      };
      cell.alignment = {
        horizontal: column === startColumn + 1 ? "center" : "left",
        vertical: "middle",
      };
    });
  });
}

function mapToSortedEntries(sourceMap) {
  return [...sourceMap.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

function addAnalyticsSheet(workbook, analytics, generatedOn, appliedFilter) {
  const sheet = workbook.addWorksheet("Analytics Summary", {
    views: [{ showGridLines: false, zoomScale: 90 }],
  });

  mergeAndStyle(sheet, "A1:F1", "VESPERA ESTATES | Analytics Summary", {
    font: { name: "Georgia", size: 18, bold: true, color: { argb: COLORS.gold } },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } },
    border: createBorder(COLORS.goldMuted),
  });
  mergeAndStyle(sheet, "A2:F2", `Generated On: ${generatedOn} | Filter: ${appliedFilter}`, {
    font: { color: { argb: COLORS.ivory }, italic: true },
    alignment: { horizontal: "center", vertical: "middle" },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.black } },
    border: createBorder(COLORS.goldMuted),
  });

  addAnalyticsTable(sheet, 4, 1, "Overview", [
    ["Total Leads", analytics.totalLeads],
    ["Open Leads", analytics.openLeads],
    ["Hot Leads", analytics.hotLeads],
    ["Working Leads", analytics.workingLeads],
    ["Deal Closed", analytics.dealClosed],
    ["Follow-Up Pending", analytics.followUpPending],
  ]);

  addAnalyticsTable(sheet, 4, 4, "Leads By Status", mapToSortedEntries(analytics.byStatus));
  addAnalyticsTable(sheet, 14, 1, "Leads By List", mapToSortedEntries(analytics.byList));
  addAnalyticsTable(sheet, 14, 4, "Leads By Deal Stage", mapToSortedEntries(analytics.byDealStage));
  addAnalyticsTable(sheet, 28, 1, "Assigned Per User", mapToSortedEntries(analytics.byAssignee));

  sheet.columns = [
    { width: 28 },
    { width: 12 },
    { width: 4 },
    { width: 28 },
    { width: 12 },
    { width: 4 },
  ];
}

function triggerWorkbookDownload(buffer, filename) {
  const blob = new Blob(
    [buffer],
    { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportLeadsReport({
  leads = [],
  lists = [],
  generatedBy = "Admin",
  appliedFilter = "All Leads",
}) {
  const excelJsModule = await import("exceljs");
  const ExcelJS = excelJsModule?.default || excelJsModule;
  const workbook = new ExcelJS.Workbook();
  const generatedAt = new Date();
  const filename = `vespera-leads-${formatFilenameDate(generatedAt)}.xlsx`;
  const listNameMap = buildListNameMap(lists);
  const { rows, analytics } = buildReportRows(leads, listNameMap);
  const generatedOn = formatDisplayDateTime(generatedAt);

  workbook.creator = "Vespera Estates CRM";
  workbook.lastModifiedBy = safeValue(generatedBy);
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.company = "Vespera Estates";
  workbook.subject = "Lead export report";
  workbook.title = "Vespera Estates Lead Report";
  workbook.keywords = "vespera, leads, crm, report";
  workbook.category = "CRM Reports";

  const leadSheet = workbook.addWorksheet("Lead Report", {
    views: [{ state: "frozen", ySplit: 1, topLeftCell: "A2", showGridLines: false, zoomScale: 90 }],
  });

  setColumnWidths(leadSheet, rows);
  addDataTable(leadSheet, rows);

  addAnalyticsSheet(workbook, analytics, generatedOn, safeValue(appliedFilter));

  const buffer = await workbook.xlsx.writeBuffer();
  triggerWorkbookDownload(buffer, filename);

  return {
    filename,
    exportedCount: rows.length,
    analytics,
  };
}
