import { expect, test } from "@playwright/test";
import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  getApiBase,
} from "./helpers/auth";

test.describe("API RBAC and persistence verification", () => {
  test("MAIN_ADMIN can perform lead CRUD and L1/L2 are blocked from restricted mutations", async ({ request }) => {
    const listsResponse = await apiGet(request, "mainAdmin", "/api/lists/with-counts");
    expect(listsResponse.ok()).toBeTruthy();
    const listsPayload = await listsResponse.json();
    const targetList = listsPayload?.data?.[0];
    expect(targetList?.id).toBeTruthy();

    const uniqueSuffix = Date.now();
    const createPayload = {
      list_id: targetList.id,
      fname: "QA",
      lname: "Automation",
      mobile: `90000${String(uniqueSuffix).slice(-5)}`,
      email: `qa.lead.${uniqueSuffix}@vespera.local`,
      notes: "Created by Playwright API QA",
    };

    const createResponse = await apiPost(request, "mainAdmin", "/api/leads", createPayload);
    expect(createResponse.status()).toBe(201);
    const createdLead = (await createResponse.json())?.data;
    expect(createdLead?.id).toBeTruthy();
    expect(createdLead?.mobile).toBe(createPayload.mobile);

    const leadId = createdLead.id;

    const l1EditResponse = await apiPut(request, "manager", `/api/leads/${leadId}`, {
      ...createPayload,
      fname: "Edited By L1",
    });
    expect(l1EditResponse.status()).toBe(403);

    const l2EditResponse = await apiPut(request, "l2", `/api/leads/${leadId}`, {
      ...createPayload,
      fname: "Edited By L2",
    });
    expect(l2EditResponse.status()).toBe(403);

    const l2CreateResponse = await apiPost(request, "l2", "/api/leads", createPayload);
    expect(l2CreateResponse.status()).toBe(403);

    const updateResponse = await apiPut(request, "mainAdmin", `/api/leads/${leadId}`, {
      ...createPayload,
      notes: "Updated by Playwright API QA",
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updatedLead = (await updateResponse.json())?.data;
    expect(updatedLead?.notes).toContain("Updated by Playwright");

    const l1DeleteResponse = await apiDelete(request, "manager", `/api/leads/${leadId}`);
    expect(l1DeleteResponse.status()).toBe(403);

    const l2DeleteResponse = await apiDelete(request, "l2", `/api/leads/${leadId}`);
    expect(l2DeleteResponse.status()).toBe(403);

    const deleteResponse = await apiDelete(request, "mainAdmin", `/api/leads/${leadId}`);
    expect(deleteResponse.ok()).toBeTruthy();

    const verifyDeleted = await apiGet(request, "mainAdmin", `/api/leads/${leadId}`);
    expect(verifyDeleted.status()).toBe(404);
  });

  test("L2 lead responses do not expose phone fields", async ({ request }) => {
    const response = await apiGet(request, "l2", "/api/leads");
    expect(response.ok()).toBeTruthy();
    const payload = await response.json();
    const firstLead = payload?.data?.[0];
    expect(firstLead).toBeTruthy();
    expect(firstLead.mobile).toBeUndefined();
    expect(firstLead.tel1).toBeUndefined();
    expect(firstLead.tel2).toBeUndefined();
    expect(firstLead.mobile_masked).toBe("Restricted");
  });

  test("Custom-field management is admin-only while form metadata is readable by L1", async ({ request }) => {
    const fieldName = `QA Field ${Date.now()}`;
    const createFieldResponse = await apiPost(request, "mainAdmin", "/api/settings/custom-fields", {
      name: fieldName,
      type: "text",
      values: [],
      mandatory: false,
      lists: [],
    });
    expect(createFieldResponse.status()).toBe(201);
    const createdField = (await createFieldResponse.json())?.data;
    expect(createdField?.id).toBeTruthy();

    const l1MetadataResponse = await apiGet(request, "manager", "/api/settings/custom-fields/form-metadata");
    expect(l1MetadataResponse.ok()).toBeTruthy();
    const metadataPayload = await l1MetadataResponse.json();
    expect(metadataPayload.data.some((field: { name: string }) => field.name === fieldName)).toBeTruthy();

    const l1WriteResponse = await apiPost(request, "manager", "/api/settings/custom-fields", {
      name: `${fieldName} blocked`,
      type: "text",
      values: [],
      mandatory: false,
      lists: [],
    });
    expect(l1WriteResponse.status()).toBe(403);

    const l2WriteResponse = await apiPost(request, "l2", "/api/settings/custom-fields", {
      name: `${fieldName} blocked l2`,
      type: "text",
      values: [],
      mandatory: false,
      lists: [],
    });
    expect(l2WriteResponse.status()).toBe(403);

    const deleteResponse = await apiDelete(request, "mainAdmin", `/api/settings/custom-fields/${createdField.id}`);
    expect(deleteResponse.ok()).toBeTruthy();

    const afterDeleteMetadata = await apiGet(request, "manager", "/api/settings/custom-fields/form-metadata");
    const afterDeletePayload = await afterDeleteMetadata.json();
    expect(afterDeletePayload.data.some((field: { name: string }) => field.name === fieldName)).toBeFalsy();
  });

  test("Company profile updates persist for MAIN_ADMIN and are blocked for L1/L2", async ({ request }) => {
    const originalResponse = await apiGet(request, "mainAdmin", "/api/settings/company-profile");
    expect(originalResponse.ok()).toBeTruthy();
    const originalPayload = await originalResponse.json();
    const original = originalPayload?.data || {};

    const timestamp = Date.now();
    const nextProfile = {
      primaryContact: {
        firstName: original?.primaryContact?.firstName || "QA",
        lastName: original?.primaryContact?.lastName || "Admin",
        designation: original?.primaryContact?.designation || "QA",
        email: original?.primaryContact?.email || "qa.admin@vespera.local",
        phone: original?.primaryContact?.phone || "9876543210",
        orgName: `Vespera QA ${timestamp}`,
        address1: original?.primaryContact?.address1 || "QA Address 1",
        address2: original?.primaryContact?.address2 || "",
        city: original?.primaryContact?.city || "Pune",
        state: original?.primaryContact?.state || "Maharashtra",
        country: original?.primaryContact?.country || "India",
        zip: original?.primaryContact?.zip || "411001",
        gstin: original?.primaryContact?.gstin || "",
      },
      branding: {
        mobileLogoUrl: original?.branding?.mobileLogoUrl || "",
        webLogoUrl: original?.branding?.webLogoUrl || "",
      },
      locale: {
        currency: original?.locale?.currency || "INR - Indian Rupee",
        timezone: original?.locale?.timezone || "Asia/Kolkata",
      },
      accountSettings: {
        autoDuplicateCheck: original?.accountSettings?.autoDuplicateCheck ?? true,
      },
      salesOrgConfigured: original?.salesOrgConfigured ?? false,
    };

    const saveResponse = await apiPut(request, "mainAdmin", "/api/settings/company-profile", nextProfile);
    expect(saveResponse.ok()).toBeTruthy();

    const verifyResponse = await apiGet(request, "mainAdmin", "/api/settings/company-profile");
    const verifyPayload = await verifyResponse.json();
    expect(verifyPayload?.data?.primaryContact?.orgName).toBe(nextProfile.primaryContact.orgName);

    const l1Blocked = await apiGet(request, "manager", "/api/settings/company-profile");
    expect(l1Blocked.status()).toBe(403);

    const l2Blocked = await apiGet(request, "l2", "/api/settings/company-profile");
    expect(l2Blocked.status()).toBe(403);

    const restoreResponse = await apiPut(request, "mainAdmin", "/api/settings/company-profile", {
      primaryContact: {
        firstName: original?.primaryContact?.firstName || "QA",
        lastName: original?.primaryContact?.lastName || "Admin",
        designation: original?.primaryContact?.designation || "QA",
        email: original?.primaryContact?.email || "qa.admin@vespera.local",
        phone: original?.primaryContact?.phone || "9876543210",
        orgName: original?.primaryContact?.orgName || "Vespera Estates",
        address1: original?.primaryContact?.address1 || "QA Address 1",
        address2: original?.primaryContact?.address2 || "",
        city: original?.primaryContact?.city || "Pune",
        state: original?.primaryContact?.state || "Maharashtra",
        country: original?.primaryContact?.country || "India",
        zip: original?.primaryContact?.zip || "411001",
        gstin: original?.primaryContact?.gstin || "",
      },
      branding: original?.branding || { mobileLogoUrl: "", webLogoUrl: "" },
      locale: original?.locale || { currency: "INR - Indian Rupee", timezone: "Asia/Kolkata" },
      accountSettings: original?.accountSettings || { autoDuplicateCheck: true },
      salesOrgConfigured: original?.salesOrgConfigured ?? false,
    });
    expect(restoreResponse.ok()).toBeTruthy();
  });

  test("Public property filters accept GET query params and return filtered results", async ({ request }) => {
    const unfiltered = await request.get(`${getApiBase()}/api/global/properties/all?page=1&limit=20`);
    expect(unfiltered.ok()).toBeTruthy();
    const unfilteredPayload = await unfiltered.json();
    expect(Array.isArray(unfilteredPayload?.data)).toBeTruthy();

    const sample = unfilteredPayload?.data?.[0];
    if (!sample) {
      test.skip(true, "No public properties available in QA dataset");
    }

    const filtered = await request.get(
      `${getApiBase()}/api/global/properties/all?page=1&limit=20&type=${encodeURIComponent(sample.type)}`
    );
    expect(filtered.ok()).toBeTruthy();
    const filteredPayload = await filtered.json();
    expect(filteredPayload.data.every((item: { type: string }) => item.type === sample.type)).toBeTruthy();
  });
});
