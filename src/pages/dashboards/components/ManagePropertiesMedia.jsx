import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import PROPERTIES from "../../../services/propertiesService";
import { useToast } from "../../../hooks/use-toast";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import {
  buildPropertyPayload,
  createEmptyPropertyDetails,
  FURNISHING_OPTIONS,
  getPropertyCategory,
  LAND_AREA_UNITS,
  normalizePropertyDetails,
  PROPERTY_TYPE_OPTIONS,
  summarizePropertyDetails,
  validatePropertyForm,
  YES_NO_OPTIONS,
} from "../../../utils/propertyDetails";

const INITIAL_STATE = {
  title: "",
  description: "",
  price: "",
  location: "",
  type: "Residential",
  propertyDetails: createEmptyPropertyDetails("residential"),
  tags: "",
  sale: true,
  images: [],
  existingImages: [],
};

function mapPropertyToForm(property) {
  const type = property.type
    ? String(property.type).replace(/\b\w/g, (match) => match.toUpperCase())
    : "Residential";

  return {
    title: property.title || "",
    description: property.description || "",
    price: property.price ? String(property.price) : "",
    location: property.location || "",
    type,
    propertyDetails: normalizePropertyDetails(type, property.property_details || property.propertyDetails, {
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
    }),
    tags: Array.isArray(property.tags) ? property.tags.join(", ") : "",
    sale: Boolean(property.sale),
    images: [],
    existingImages: Array.isArray(property.images) ? property.images : [],
  };
}

export default function ManagePropertiesMedia() {
  const { toast } = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const propertyCategory = useMemo(() => getPropertyCategory(formData.type), [formData.type]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PROPERTIES.GET(1, 50);
      if (res?.status === 200) {
        setProperties(res.data?.data || []);
      }
    } catch (error) {
      console.error("Property fetch failed:", error);
      toast({ title: "Load failed", description: "Property listings could not be loaded." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const updatePropertyDetail = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails,
        [name]: value,
      },
    }));
    setErrors((prev) => ({ ...prev, [`propertyDetails.${name}`]: undefined }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "type") {
      const nextCategory = getPropertyCategory(value);
      setFormData((prev) => ({
        ...prev,
        type: value,
        propertyDetails: createEmptyPropertyDetails(nextCategory),
      }));
      setErrors((prev) => {
        const nextErrors = { ...prev, type: undefined };
        Object.keys(nextErrors).forEach((key) => {
          if (key.startsWith("propertyDetails.")) delete nextErrors[key];
        });
        return nextErrors;
      });
      return;
    }

    updateField(name, type === "checkbox" ? checked : value);
  };

  const handleFileChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      images: Array.from(event.target.files || []),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validatePropertyForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast({
        title: "Validation failed",
        description: "Please fix the highlighted property fields before saving.",
      });
      return;
    }

    try {
      setSaving(true);

      let uploadedImageUrls = Array.isArray(formData.existingImages) ? [...formData.existingImages] : [];

      if (formData.images.length > 0) {
        const imageFormData = new FormData();
        formData.images.forEach((file) => imageFormData.append("images", file));

        const uploadRes = await PROPERTIES.UPLOAD_IMAGE(imageFormData);
        if (uploadRes?.status === 200 || uploadRes?.status === 201) {
          const newUrls = uploadRes.data?.images?.map((image) => image.url) || [];
          uploadedImageUrls = [...uploadedImageUrls, ...newUrls];
        } else {
          toast({ title: "Upload failed", description: "Property images could not be uploaded." });
          return;
        }
      }

      const payload = buildPropertyPayload({
        ...formData,
        existingImages: uploadedImageUrls,
      });

      const res = editingId ? await PROPERTIES.UPDATE(editingId, payload) : await PROPERTIES.CREATE(payload);

      if (res?.status === 200 || res?.status === 201) {
        setFormData(INITIAL_STATE);
        setErrors({});
        setShowForm(false);
        setEditingId(null);
        await fetchProperties();
        toast({
          title: editingId ? "Property updated" : "Property created",
          description: "The property was saved successfully.",
        });
      } else {
        toast({ title: "Save failed", description: res?.data?.error || "Save failed." });
      }
    } catch (error) {
      console.error("Property save failed:", error);
      toast({
        title: "Save failed",
        description: error?.response?.data?.error || error?.message || "Failed to save property.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id || deleteLoading) return;
    try {
      setDeleteLoading(true);
      const res = await PROPERTIES.DELETE(deleteTarget.id);
      if (res?.status === 200) {
        setProperties((prev) => prev.filter((property) => property.id !== deleteTarget.id));
        setDeleteTarget(null);
        toast({ title: "Property deleted", description: "The property was removed successfully." });
      } else {
        toast({ title: "Delete failed", description: res?.data?.error || "Delete failed." });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Delete failed", description: "Delete failed." });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (property) => {
    setEditingId(property.id);
    setErrors({});
    setFormData(mapPropertyToForm(property));
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setErrors({});
    setFormData(INITIAL_STATE);
    setShowForm(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-6 space-y-6">
      <Header
        showForm={showForm}
        toggle={() => {
          if (showForm) cancelEdit();
          else setShowForm(true);
        }}
      />

      {showForm ? (
        <PropertyForm
          formData={formData}
          errors={errors}
          category={propertyCategory}
          saving={saving}
          editingId={editingId}
          onFieldChange={handleChange}
          onDetailChange={updatePropertyDetail}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
        />
      ) : null}

      {loading && properties.length === 0 ? (
        <div className="py-8 text-white/60">Loading properties...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} onEdit={handleEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (deleteLoading) return;
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Property?"
        description="This action cannot be undone. Are you sure you want to delete this property listing?"
        details={
          deleteTarget ? (
            <div className="space-y-1">
              <div className="font-medium text-white">{deleteTarget.title || "Untitled property"}</div>
              <div className="text-white/60">{deleteTarget.location || "-"}</div>
            </div>
          ) : null
        }
        cancelLabel="Cancel"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteLoading}
        destructive
      />
    </div>
  );
}

function Header({ showForm, toggle }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-6">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-[#D4AF37]">
        <Building2 size={20} />
        Property Portfolio Manager
      </h2>

      <button onClick={toggle} className="gold-btn flex items-center gap-2 rounded-md px-4 py-2">
        {showForm ? <X size={16} /> : <Plus size={16} />}
        {showForm ? "Cancel" : "Add Property"}
      </button>
    </div>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-white/75">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

function PropertyForm({
  formData,
  errors,
  category,
  saving,
  editingId,
  onFieldChange,
  onDetailChange,
  onFileChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/5 p-6 md:grid-cols-2"
    >
      <Field label="Property Title" error={errors.title}>
        <Input name="title" value={formData.title} onChange={onFieldChange} placeholder="Enter property title" />
      </Field>

      <Field label="Location" error={errors.location}>
        <Input name="location" value={formData.location} onChange={onFieldChange} placeholder="Enter property location" />
      </Field>

      <Field label="Price" error={errors.price}>
        <Input type="number" min="0" name="price" value={formData.price} onChange={onFieldChange} placeholder="Price (INR)" />
      </Field>

      <Field label="Property Type" error={errors.type}>
        <Select name="type" value={formData.type} onChange={onFieldChange}>
          {PROPERTY_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/30 p-4 transition-all duration-200">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">Property Details</h3>
          <p className="text-sm text-white/55">Fields update automatically based on the selected property type.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {category === "residential" ? (
            <>
              <Field label="Rooms / BHK" error={errors["propertyDetails.rooms"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.rooms}
                  onChange={(event) => onDetailChange("rooms", event.target.value)}
                  placeholder="Example: 2"
                />
              </Field>
              <Field label="Washrooms" error={errors["propertyDetails.washrooms"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.washrooms}
                  onChange={(event) => onDetailChange("washrooms", event.target.value)}
                  placeholder="Example: 2"
                />
              </Field>
              <Field label="Carpet Area" error={errors["propertyDetails.carpetArea"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.carpetArea}
                  onChange={(event) => onDetailChange("carpetArea", event.target.value)}
                  placeholder="Example: 850"
                />
              </Field>
              <Field label="Built-up Area" error={errors["propertyDetails.builtUpArea"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.builtUpArea}
                  onChange={(event) => onDetailChange("builtUpArea", event.target.value)}
                  placeholder="Optional built-up area"
                />
              </Field>
              <Field label="Floor" error={errors["propertyDetails.floor"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.floor}
                  onChange={(event) => onDetailChange("floor", event.target.value)}
                  placeholder="Optional floor number"
                />
              </Field>
              <Field label="Total Floors" error={errors["propertyDetails.totalFloors"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.totalFloors}
                  onChange={(event) => onDetailChange("totalFloors", event.target.value)}
                  placeholder="Optional total floors"
                />
              </Field>
            </>
          ) : null}

          {category === "commercial" ? (
            <>
              <Field label="Sqft" error={errors["propertyDetails.sqft"]} hint="Example: 1200 Sqft">
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.sqft}
                  onChange={(event) => onDetailChange("sqft", event.target.value)}
                  placeholder="Example: 1200 Sqft"
                />
              </Field>
              <Field label="Floor" error={errors["propertyDetails.floor"]}>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.floor}
                  onChange={(event) => onDetailChange("floor", event.target.value)}
                  placeholder="Optional floor number"
                />
              </Field>
              <Field label="Washroom Available" error={errors["propertyDetails.washroomAvailable"]}>
                <Select
                  value={formData.propertyDetails.washroomAvailable}
                  onChange={(event) => onDetailChange("washroomAvailable", event.target.value)}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Furnishing Status" error={errors["propertyDetails.furnishingStatus"]}>
                <Select
                  value={formData.propertyDetails.furnishingStatus}
                  onChange={(event) => onDetailChange("furnishingStatus", event.target.value)}
                >
                  {FURNISHING_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}

          {category === "land" ? (
            <>
              <Field label="Land Area" error={errors["propertyDetails.landArea"]} hint="Example: 1 Acre, 5 Guntha">
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyDetails.landArea}
                  onChange={(event) => onDetailChange("landArea", event.target.value)}
                  placeholder="Example: 1 Acre, 5 Guntha"
                />
              </Field>
              <Field label="Area Unit" error={errors["propertyDetails.areaUnit"]}>
                <Select value={formData.propertyDetails.areaUnit} onChange={(event) => onDetailChange("areaUnit", event.target.value)}>
                  {LAND_AREA_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Road Touch" error={errors["propertyDetails.roadTouch"]}>
                <Select value={formData.propertyDetails.roadTouch} onChange={(event) => onDetailChange("roadTouch", event.target.value)}>
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="NA Plot" error={errors["propertyDetails.naPlot"]}>
                <Select value={formData.propertyDetails.naPlot} onChange={(event) => onDetailChange("naPlot", event.target.value)}>
                  {YES_NO_OPTIONS.map((option) => (
                    <option key={option.value || "empty"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : null}
        </div>
      </div>

      <Field label="Tags" error={errors.tags}>
        <Input name="tags" value={formData.tags} onChange={onFieldChange} placeholder="Tags (comma separated)" />
      </Field>

      <div className="flex items-center gap-2 pt-7">
        <input type="checkbox" name="sale" checked={formData.sale} onChange={onFieldChange} />
        <label className="text-sm text-white/70">Available for Sale (uncheck for Rent)</label>
      </div>

      <Field label="Description" error={errors.description}>
        <textarea
          name="description"
          value={formData.description}
          onChange={onFieldChange}
          placeholder="Enter property description"
          className="min-h-[100px] w-full rounded bg-black p-3 text-sm text-white border border-white/10"
        />
      </Field>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm text-white/75">Upload Property Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileChange}
          className="w-full rounded border border-white/10 bg-black p-2 text-sm text-white"
        />
      </div>

      <div className="md:col-span-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-white/20 px-4 py-2 text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>

        <button type="submit" disabled={saving} className="gold-btn flex-1 rounded py-2 font-bold">
          {saving ? <Loader2 className="mx-auto animate-spin" /> : editingId ? "Update Property" : "Save Property"}
        </button>
      </div>
    </form>
  );
}

function PropertyCard({ property, onEdit, onDelete }) {
  const summary = summarizePropertyDetails(property);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black transition hover:border-[#D4AF37]/40">
      <img src={property.images?.[0] || ""} alt={property.title} className="h-48 w-full object-cover" />
      <div className="space-y-2 p-4">
        <h3 className="truncate font-bold text-[#D4AF37]">{property.title}</h3>
        <p className="text-xs text-white/60">{property.location}</p>
        <p className="text-sm font-semibold">
          Rs {Number(property.price || 0).toLocaleString("en-IN")}
          {property.sale ? "" : " / month"}
        </p>
        {summary.length ? <p className="text-xs text-white/70">{summary.join(" • ")}</p> : null}
        <div className="mt-2 flex gap-2">
          <button onClick={() => onEdit(property)} className="flex items-center gap-1 text-[#D4AF37] hover:text-[#D4AF37]/80">
            <Pencil size={14} /> Edit
          </button>

          <button onClick={() => onDelete(property)} className="flex items-center gap-1 text-red-500 hover:text-red-400">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const Input = ({ className = "", ...props }) => (
  <input {...props} className={`h-11 rounded border border-white/10 bg-black px-3 text-sm text-white ${className}`} />
);

const Select = ({ children, className = "", ...props }) => (
  <select {...props} className={`h-11 rounded border border-white/10 bg-black px-3 text-sm text-white ${className}`}>
    {children}
  </select>
);
