import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Loader2, Building2, Plus, X, Pencil } from "lucide-react";
import PROPERTIES from "../../../services/propertiesService";

const INITIAL_STATE = {
  title: "",
  description: "",
  price: "",
  location: "",
  type: "Residential",
  beds: "",
  baths: "",
  sqft: "",
  tags: "",
  sale: true,
  images: []
};

export default function ManagePropertiesMedia() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_STATE);

  /* ---------------- FETCH PROPERTIES ---------------- */
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await PROPERTIES.GET(1, 50);
      if (res?.status === 200) {
        setProperties(res.data.data || []);
      }
    } catch (error) {
      console.error("Property fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  /* ---------------- FORM HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      images: Array.from(e.target.files)
    }));
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      /* ---- STEP 1: Upload Images ---- */
      let uploadedImageUrls = [];

      if (formData.images && formData.images.length > 0) {
        const imageFormData = new FormData();

        formData.images.forEach((file) => {
          imageFormData.append("images", file);
        });

        const uploadRes = await PROPERTIES.UPLOAD_IMAGE(imageFormData);

        if (uploadRes?.status === 200 || uploadRes?.status === 201) {
          uploadedImageUrls = uploadRes.data?.images?.map(image=>image.url) || [];
        } else {
          alert("Image upload failed.");
          setLoading(false);
          return;
        }
      }

      /* ---- STEP 2: Prepare Payload ---- */
      const tagsArr = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.price ? Number(formData.price) : null,
        location: formData.location,
        type: formData.type,
        beds: formData.beds ? Number(formData.beds) : null,
        baths: formData.baths ? Number(formData.baths) : null,
        sqft: formData.sqft ? Number(formData.sqft) : null,
        tags: tagsArr,
        sale: Boolean(formData.sale),
        images: uploadedImageUrls
      };

      /* ---- STEP 3: Create or Update ---- */
      let res;

      if (editingId) {
        res = await PROPERTIES.UPDATE(editingId, payload);
      } else {
        res = await PROPERTIES.CREATE(payload);
      }

      if (res?.status === 200 || res?.status === 201) {
        setFormData(INITIAL_STATE);
        setShowForm(false);
        setEditingId(null);
        fetchProperties();
      } else {
        alert(res?.data?.error || "Save failed.");
      }

    } catch (error) {
      console.error("Property save failed:", error);
      alert("Failed to save property.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this property listing?")) return;

    try {
      const res = await PROPERTIES.DELETE(id);
      if (res?.status === 200) {
        setProperties((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(res?.data?.error || "Delete failed.");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed.");
    }
  };

  /* ---------------- EDIT ---------------- */
  const handleEdit = (property) => {
    setEditingId(property.id);

    setFormData({
      title: property.title || "",
      description: property.description || "",
      price: property.price ? String(property.price) : "",
      location: property.location || "",
      type: property.type || "Residential",
      beds: property.beds ? String(property.beds) : "",
      baths: property.baths ? String(property.baths) : "",
      sqft: property.sqft ? String(property.sqft) : "",
      tags: property.tags.map(tag=>tag),
      sale: Boolean(property.sale),
      images: []
    });

    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_STATE);
    setShowForm(false);
  };

  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-6 bg-[#0B0B0B]">

      <Header
        showForm={showForm}
        toggle={() => {
          if (showForm) cancelEdit();
          else setShowForm(true);
        }}
      />

      {showForm && (
        <PropertyForm
          formData={formData}
          loading={loading}
          editingId={editingId}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          onCancel={cancelEdit}
        />
      )}

      {loading && properties.length === 0 ? (
        <div className="text-white/60 py-8">Loading properties…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Header({ showForm, toggle }) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-6">
      <h2 className="text-xl font-semibold text-[#D4AF37] flex items-center gap-2">
        <Building2 size={20} />
        Property Portfolio Manager
      </h2>

      <button
        onClick={toggle}
        className="gold-btn flex items-center gap-2 px-4 py-2 rounded-md"
      >
        {showForm ? <X size={16} /> : <Plus size={16} />}
        {showForm ? "Cancel" : "Add Property"}
      </button>
    </div>
  );
}

function PropertyForm({
  formData,
  loading,
  editingId,
  handleChange,
  handleFileChange,
  handleSubmit,
  onCancel
}) {
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 p-6 rounded-xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <Input name="title" value={formData.title} onChange={handleChange} placeholder="Property Title" required />
      <Input name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
      <Input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Price (₹)" required />
      <Select name="type" value={formData.type} onChange={handleChange} />

      <Input type="number" name="beds" value={formData.beds} onChange={handleChange} placeholder="Beds" />
      <Input type="number" name="baths" value={formData.baths} onChange={handleChange} placeholder="Baths" />
      <Input type="number" name="sqft" value={formData.sqft} onChange={handleChange} placeholder="Sqft" />
      <Input name="tags" value={formData.tags} onChange={handleChange} placeholder="Tags (comma separated)" className="md:col-span-2" />

      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
        className="bg-black border border-white/10 p-2 rounded text-sm md:col-span-2 text-white min-h-[100px]"
      />

      <div className="md:col-span-2">
        <label className="text-sm text-white/60 block mb-1">
          Upload Property Images
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="bg-black border border-white/10 p-2 rounded text-sm w-full text-white"
        />
      </div>

      <div className="flex items-center gap-2 md:col-span-2">
        <input type="checkbox" name="sale" checked={formData.sale} onChange={handleChange} />
        <label className="text-sm text-white/60">
          Available for Sale (uncheck = For Rent)
        </label>
      </div>

      <div className="md:col-span-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded border border-white/20 text-white/80 hover:bg-white/10"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="gold-btn py-2 rounded font-bold flex-1"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" /> : editingId ? "Update Property" : "Save Property"}
        </button>
      </div>
    </form>
  );
}

function PropertyCard({ property, onEdit, onDelete }) {
  return (
    <div className="bg-black rounded-xl border border-white/10 overflow-hidden hover:border-[#D4AF37]/40 transition">
      <img
        src={property.images?.[0] || ""}
        alt={property.title}
        className="h-48 w-full object-cover"
      />
      <div className="p-4 space-y-1">
        <h3 className="text-[#D4AF37] font-bold truncate">{property.title}</h3>
        <p className="text-white/60 text-xs">{property.location}</p>
        <p className="text-sm font-semibold">
          ₹{Number(property.price).toLocaleString("en-IN")}
          {property.sale ? "" : " / month"}
        </p>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onEdit(property)}
            className="text-[#D4AF37] hover:text-[#D4AF37]/80 flex items-center gap-1"
          >
            <Pencil size={14} /> Edit
          </button>

          <button
            onClick={() => onDelete(property.id)}
            className="text-red-500 hover:text-red-400 flex items-center gap-1"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= REUSABLE INPUTS ================= */

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`bg-black border border-white/10 p-2 rounded text-sm text-white ${className}`}
  />
);

const Select = ({ name, value, onChange }) => (
  <select
    name={name}
    value={value}
    onChange={onChange}
    className="bg-black border border-white/10 p-2 rounded text-sm text-white"
  >
    <option value="Residential">Residential</option>
    <option value="Commercial">Commercial</option>
    <option value="Agricultural">Agricultural</option>
  </select>
);