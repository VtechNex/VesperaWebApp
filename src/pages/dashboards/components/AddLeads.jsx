import React, { useState, useEffect, useRef } from "react";
import LEADS from '../../../services/leadService'
import LISTS from '../../../services/listService'
import QUALIFIERS from '../../../services/qualifierService'
import ADMIN from '../../../services/adminService'
export default function AddLeads({ lists = [], onCreate }) {
  const [localLists, setLocalLists] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Complete form state with ALL fields
  const [form, setForm] = useState({
    // Profile Tab
    list_id: '',
    fname: '',
    lname: '',
    designation: '',
    organization: '',
    email: '',
    mobile: '',
    website: '',
    tel1: '',
    tel2: '',
    address: '',
    notes: '',
    
    // Address fields
    address1: '',
    address2: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    
    // Qualifiers Tab
    productGroup: '',
    customerGroup: '',
    dealSize: '',
    leadPotential: '',
    leadStage: '',
    tags: [],
    doNotFollowUp: false,
    doNotFollowUpReason: '',
    
    // Info+ Tab
    dob: '',
    specialEvent: '',
    leadNotes: '',
    organizationNotes: '',
    linkedInProfile: '',
    referenceUrlOne: '',
    referenceUrlTwo: '',
    referenceUrlThree: '',
    
    // UI State
    isDropdownOpen: false,
    searchQuery: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorPopup, setErrorPopup] = useState("");

  const [productGroups, setProductGroups] = useState([])
  const [customerGroups, setCustomerGroups] = useState([])
  const [tagsList, setTagsList] = useState([])
  const [assigneeList, setAssigneeList] = useState([])

  const dropdownRef = useRef(null)

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await ADMIN.FETCH_USERS()
        if (response && response.status === 200) {
          // Filter users with roles: manager, l1, l2
          const filteredUsers = response.data.data.filter(u =>
            ['manager', 'l1', 'l2'].includes(u.role)
          )
          setAssigneeList(filteredUsers)
        }
      } catch (err) {
        console.error('Failed to fetch users:', err)
        setAssigneeList([])
      }
    }
    fetchUsers()
  }, [])

  // Fetch lists and qualifiers on mount
  useEffect(() => {
    const fetchLists = async () => {
      const response = await LISTS.FETCH_WITH_COUNTS();
      if (response && response.status === 200) {
        setLocalLists(response.data.data);
      }
    }

    const fetchQualifiers = async () => {
      try {
        const p = await QUALIFIERS.FETCH_ALL('product');
        const c = await QUALIFIERS.FETCH_ALL('customer');
        const t = await QUALIFIERS.FETCH_ALL('tag');

        setProductGroups((p && p.data && p.data.data) ? p.data.data : []);
        setCustomerGroups((c && c.data && c.data.data) ? c.data.data : []);
        setTagsList((t && t.data && t.data.data) ? t.data.data : []);
      } catch (err) {
        console.error('Failed to fetch qualifiers', err);
      }
    }

    fetchLists()
    fetchQualifiers()
  }, [])

  useEffect(() => setLocalLists(lists || []), [lists])

  // Close list dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setForm(prev => ({ ...prev, isDropdownOpen: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const onSubmit = async () => {
    setLoading(true);
    setErrorPopup("");

    // Basic validation first
    if (!form.list_id || !form.fname || !form.mobile) {
      setErrorPopup("Please provide List, First Name, and Mobile to add a lead");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        fname: form.fname,
        lname: form.lname || "",
        designation: form.designation || null,
        organization: form.organization || null,
        email: form.email || null,
        mobile: form.mobile,
        tel1: form.tel1 || null,
        tel2: form.tel2 || null,
        website: form.website || null,
        address: form.address || null,
        notes: form.notes || "",
        list_id: parseInt(form.list_id),
        
        // Additional fields for different tabs
        productGroup: form.productGroup || null,
        customerGroup: form.customerGroup || null,
        dealSize: form.dealSize || null,
        leadPotential: form.leadPotential || null,
        leadStage: form.leadStage || null,
        tags: form.tags && form.tags.length ? form.tags : null,
        
        // Follow-up fields
        followUpDate: form.followUpDate || null,
        followUpTime: form.followUpTime || null,
        followUpNotes: form.followUpNotes || null,
        followUpStatus: form.followUpStatus || 'Pending',
        assignedTo: form.assignedTo || null,
        doNotFollowUp: form.doNotFollowUp || false,
        doNotFollowUpReason: form.doNotFollowUpReason || null,
        
        // Info+ fields
        dob: form.dob || null,
        specialEvent: form.specialEvent || null,
        leadNotes: form.leadNotes || null,
        organizationNotes: form.organizationNotes || null,
        linkedInProfile: form.linkedInProfile || null,
        referenceUrlOne: form.referenceUrlOne || null,
        referenceUrlTwo: form.referenceUrlTwo || null,
        referenceUrlThree: form.referenceUrlThree || null,
        
        // Address fields
        address1: form.address1 || null,
        address2: form.address2 || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        zip: form.zip || null,
      };

      // Call the backend API
      let response;
      if (onCreate) {
        response = await onCreate(payload);
      } else {
        response = await LEADS.CREATE(payload);
      }

      alert("✅ Lead added successfully!");

      // Reset form completely
      setForm({
        // Profile Tab
        list_id: '',
        fname: '',
        lname: '',
        designation: '',
        organization: '',
        email: '',
        mobile: '',
        website: '',
        tel1: '',
        tel2: '',
        address: '',
        notes: '',
        
        // Address fields
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        
        // Qualifiers Tab
        productGroup: '',
        customerGroup: '',
        dealSize: '',
        leadPotential: '',
        leadStage: '',
        tags: '',
        
        // Follow-up Tab
        followUpDate: '',
        followUpTime: '',
        followUpNotes: '',
        followUpStatus: 'Pending',
        assignedTo: '',
        doNotFollowUp: false,
        doNotFollowUpReason: '',
        
        // Info+ Tab
        dob: '',
        specialEvent: '',
        leadNotes: '',
        organizationNotes: '',
        linkedInProfile: '',
        referenceUrlOne: '',
        referenceUrlTwo: '',
        referenceUrlThree: '',
        
        // UI State
        isDropdownOpen: false,
        searchQuery: '',
      });
    } catch (err) {
      setErrorPopup(err.message || "Failed to add lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="text-white mb-4 shrink-0">
        <div className="flex items-center justify-start gap-3 flex-wrap">
          <h2 className="text-2xl font-semibold">Add a New Lead or Customer</h2>
          <p className="text-sm text-white/70">
            (<span className="text-[#D4AF37]">*</span>) Required fields &nbsp;
            (<span className="text-[#D4AF37]">**</span>) One or the other field is required
          </p>
        </div>
        <div className="mt-3 border-t border-white/10" />
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-40 border-r border-white/10 p-2 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition ${activeTab === "profile"
              ? "bg-[color:var(--gold)] text-black font-semibold"
              : "text-white/70 hover:text-white"
              }`}
          >
            <div
              className={`h-12 w-12 rounded-xl border flex items-center justify-center ${activeTab === "profile"
                ? "bg-black/10 border-black/20 text-black/80"
                : "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-gold"
                }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
            <span className="text-xs">Profile</span>
          </button>

          {/* QUALIFIERS */}
          <button
            onClick={() => setActiveTab("qualifiers")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition ${activeTab === "qualifiers"
              ? "bg-[color:var(--gold)] text-black font-semibold"
              : "text-white/70 hover:text-white"
              }`}
          >
            <div
              className={`h-12 w-12 rounded-xl border flex items-center justify-center ${activeTab === "qualifiers"
                ? "bg-black/10 border-black/20 text-black/80"
                : "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-gold"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${activeTab === "qualifiers" ? "text-black/80" : "text-[#D4AF37]"
                  }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v6a3 3 0 010 6v6" />
                <path d="M3 12h6a3 3 0 016 0h6" />
              </svg>
            </div>
            <span className="text-xs">Qualifiers</span>
          </button>

          {/* FOLLOW-UP */}
          <button
            onClick={() => setActiveTab("followup")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition ${activeTab === "followup"
              ? "bg-[color:var(--gold)] text-black font-semibold"
              : "text-white/70 hover:text-white"
              }`}
          >
            <div
              className={`h-12 w-12 rounded-xl border flex items-center justify-center ${activeTab === "followup"
                ? "bg-black/10 border-black/20 text-black/80"
                : "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-gold"
                }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
              </svg>
            </div>
            <span className="text-xs">Follow-up</span>
          </button>

          {/* INFO+ */}
          <button
            onClick={() => setActiveTab("info")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition ${activeTab === "info"
              ? "bg-[color:var(--gold)] text-black font-semibold"
              : "text-white/70 hover:text-white"
              }`}
          >
            <div
              className={`h-12 w-12 rounded-xl border flex items-center justify-center ${activeTab === "info"
                ? "bg-black/10 border-black/20 text-black/80"
                : "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-gold"
                }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-6 w-6 ${activeTab === "info" ? "text-black/80" : "text-[#D4AF37]"
                  }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.3"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6" />
                <path d="M8 12h8" />
                <path d="M8 15h8" />
                <path d="M8 18h5" />
              </svg>
            </div>
            <span className="text-xs">Info+</span>
          </button>
        </div>

        {/* Form Section */}
        <div className="flex flex-col w-[850px] flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto pr-2">
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <>
                {/* List Dropdown */}
                <div className="border border-white/15 rounded-xl bg-transparent p-3 mb-6 flex items-center justify-between w-112">
                  <label
                    htmlFor="listId"
                    className="text-sm text-white/80 font-medium mr-3 whitespace-nowrap"
                  >
                    List Name <span className="text-[#D4AF37]">*</span>
                  </label>

                  <select
                    id="listId"
                    name="listId"
                    value={form.list_id}
                    onChange={(e) => setForm(prev => ({ ...prev, list_id: e.target.value }))}
                    className="flex-1 bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Select List</option>
                    {localLists.map((l) => (
                      <option key={l.id} value={l.id} className="uppercase">
                        {l.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Main Fields */}
                <div className="border border-white/15 rounded-xl bg-black/30 p-4 mb-6">
                  <div className="grid sm:grid-cols-3 gap-4 text-white">
                    {/* First Name */}
                    <div className="relative">
                      <label htmlFor="firstName" className="block text-sm text-white/80 font-medium mb-1">
                        First Name <span className="text-[#D4AF37] ml-1">*</span>
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={form.fname}
                        onChange={(e) => setForm(prev => ({ ...prev, fname: e.target.value }))}
                        placeholder="Enter first name"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Last Name */}
                    <div className="relative">
                      <label htmlFor="lastName" className="block text-sm text-white/80 font-medium mb-1">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={form.lname}
                        onChange={(e) => setForm(prev => ({ ...prev, lname: e.target.value }))}
                        placeholder="Enter last name"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Designation */}
                    <div className="relative">
                      <label htmlFor="designation" className="block text-sm text-white/80 font-medium mb-1">
                        Designation
                      </label>
                      <input
                        id="designation"
                        name="designation"
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm(prev => ({ ...prev, designation: e.target.value }))}
                        placeholder="Enter designation"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Organization */}
                    <div className="relative">
                      <label htmlFor="organization" className="block text-sm text-white/80 font-medium mb-1">
                        Organization
                      </label>
                      <input
                        id="organization"
                        name="organization"
                        type="text"
                        value={form.organization}
                        onChange={(e) => setForm(prev => ({ ...prev, organization: e.target.value }))}
                        placeholder="Enter organization"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <label htmlFor="email" className="block text-sm text-white/80 font-medium mb-1">
                        Email <span className="text-[#D4AF37] ml-1">**</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Mobile */}
                    <div className="relative">
                      <label htmlFor="mobile" className="block text-sm text-white/80 font-medium mb-1">
                        Mobile <span className="text-[#D4AF37] ml-1">**</span>
                      </label>
                      <input
                        id="mobile"
                        name="mobile"
                        type="text"
                        value={form.mobile}
                        onChange={(e) => setForm(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="Enter mobile number"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="mt-4">
                    <div className="relative">
                      <label htmlFor="notes" className="block text-sm text-white/80 font-medium mb-1">
                        Notes
                      </label>
                      <input
                        id="notes"
                        name="notes"
                        type="text"
                        value={form.notes}
                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Enter notes"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="border border-white/15 rounded-xl bg-black/30 p-4">
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    {/* Website */}
                    <div className="relative">
                      <label htmlFor="website" className="block text-sm text-white/80 font-medium mb-1">
                        Website
                      </label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        value={form.website}
                        onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="Enter website URL"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Telephone Direct */}
                    <div className="relative">
                      <label htmlFor="telephoneDirect" className="block text-sm text-white/80 font-medium mb-1">
                        Telephone (Direct)
                      </label>
                      <input
                        id="tel1"
                        name="tel1"
                        type="text"
                        value={form.tel1}
                        onChange={(e) => setForm(prev => ({ ...prev, tel1: e.target.value }))}
                        placeholder="Enter direct telephone"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Telephone Office */}
                    <div className="relative">
                      <label htmlFor="telephoneOffice" className="block text-sm text-white/80 font-medium mb-1">
                        Telephone (Office)
                      </label>
                      <input
                        id="tel2"
                        name="tel2"
                        type="text"
                        value={form.tel2}
                        onChange={(e) => setForm(prev => ({ ...prev, tel2: e.target.value }))}
                        placeholder="Enter office telephone"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    {/* Address 1 */}
                    <div className="relative">
                      <label htmlFor="address1" className="block text-sm text-white/80 font-medium mb-1">
                        Address Line 1
                      </label>
                      <input
                        id="address1"
                        name="address1"
                        type="text"
                        value={form.address1}
                        onChange={(e) => setForm(prev => ({ ...prev, address1: e.target.value }))}
                        placeholder="Enter address line 1"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Address 2 */}
                    <div className="relative">
                      <label htmlFor="address2" className="block text-sm text-white/80 font-medium mb-1">
                        Address Line 2
                      </label>
                      <input
                        id="address2"
                        name="address2"
                        type="text"
                        value={form.address2}
                        onChange={(e) => setForm(prev => ({ ...prev, address2: e.target.value }))}
                        placeholder="Enter address line 2"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* City */}
                    <div className="relative">
                      <label htmlFor="city" className="block text-sm text-white/80 font-medium mb-1">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Enter city"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* State */}
                    <div className="relative">
                      <label htmlFor="state" className="block text-sm text-white/80 font-medium mb-1">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Enter state"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* Country */}
                    <div className="relative">
                      <label htmlFor="country" className="block text-sm text-white/80 font-medium mb-1">
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        value={form.country}
                        onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                        placeholder="Enter country"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>

                    {/* ZIP Code */}
                    <div className="relative">
                      <label htmlFor="zip" className="block text-sm text-white/80 font-medium mb-1">
                        ZIP Code
                      </label>
                      <input
                        id="zip"
                        name="zip"
                        type="text"
                        value={form.zip}
                        onChange={(e) => setForm(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="Enter ZIP code"
                        className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                 transition-colors duration-200 ease-in-out
                                 placeholder:text-white/40"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* QUALIFIERS TAB */}
            {activeTab === "qualifiers" && (
              <div className="border border-white/15 rounded-xl bg-transparent p-4 text-white">

                {/* Product Groups */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  {/* Left: Icon + Label */}
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <circle cx="4" cy="7" r="1.2" fill="currentColor" />
                      <path d="M8.5 7h12.5" strokeLinecap="round" />
                      <circle cx="4" cy="12" r="1.2" fill="currentColor" />
                      <path d="M8.5 12h12.5" strokeLinecap="round" />
                      <circle cx="4" cy="17" r="1.2" fill="currentColor" />
                      <path d="M8.5 17h12.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Product Groups</span>
                  </div>

                  {/* Select */}
                  <select
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    value={form.productGroup}
                    onChange={(e) => setForm(prev => ({ ...prev, productGroup: e.target.value }))}
                  >
                    <option value="">Select Product Group</option>
                    {productGroups.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Group */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.8}>
                      <rect x="10.5" y="3.5" width="3" height="3" rx="0.8" />
                      <path d="M12 7v4" strokeLinecap="round" />
                      <path d="M6 11h12" strokeLinecap="round" />
                      <path d="M6 11v3" strokeLinecap="round" />
                      <path d="M12 11v3" strokeLinecap="round" />
                      <path d="M18 11v3" strokeLinecap="round" />
                      <rect x="4.5" y="14.5" width="3" height="3" rx="0.8" />
                      <rect x="10.5" y="14.5" width="3" height="3" rx="0.8" />
                      <rect x="16.5" y="14.5" width="3" height="3" rx="0.8" />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Customer Group</span>
                  </div>

                  <select
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    value={form.customerGroup}
                    onChange={(e) => setForm(prev => ({ ...prev, customerGroup: e.target.value }))}
                  >
                    <option value="">Select Customer Group</option>
                    {customerGroups.map((g) => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Deal Size */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H7" strokeWidth={1.6} strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Deal Size (INR)</span>
                  </div>

                  <input
                    type="number"
                    placeholder="Enter numerals"
                    value={form.dealSize}
                    onChange={(e) => setForm(prev => ({ ...prev, dealSize: e.target.value }))}
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                {/* Lead Potential */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 17l-5 3 2-6-5-4h6L12 4l2 6h6l-5 4 2 6z" strokeWidth={1.6} />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Lead Potential</span>
                  </div>

                  <select
                    value={form.leadPotential}
                    onChange={(e) => setForm(prev => ({ ...prev, leadPotential: e.target.value }))}
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Lead Stage */}

                {/* Tags (multi-select) */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
                      <path d="M7 7l10 10" strokeLinecap="round" />
                      <path d="M17 7h-3" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Tags</span>
                  </div>

                  <div className="w-[400px] relative" ref={dropdownRef}>
                    <button
                      onClick={() => setForm(prev => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }))}
                      className="w-full text-left bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    >
                      {form.tags.length === 0 ? 'Select tags' : `${form.tags.length} selected`}
                    </button>

                    {form.isDropdownOpen && (
                      <div className="absolute right-0 left-0 mt-2 bg-black/90 border border-white/10 rounded-md p-3 max-h-48 overflow-y-auto z-50">
                        {tagsList.map((t) => (
                          <label key={t.id} className="flex items-center gap-2 text-sm mb-2">
                            <input
                              type="checkbox"
                              checked={form.tags.includes(t.id)}
                              onChange={() => {
                                setForm(prev => {
                                  const already = prev.tags.includes(t.id)
                                  const next = already ? prev.tags.filter(x => x !== t.id) : [...prev.tags, t.id]
                                  return { ...prev, tags: next }
                                })
                              }}
                            />
                            <span>{t.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.6}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 4h18l-6 8v6l-6 3v-9L3 4z"
                      />
                    </svg>

                    <span className="text-sm text-white/80 font-medium">Lead Stage</span>
                  </div>

                  <select
                    value={form.leadStage}
                    onChange={(e) => setForm(prev => ({ ...prev, leadStage: e.target.value }))}
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Select</option>
                    <option value="Open">Open</option>
                    <option value="Working">Working</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Tags */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <g transform="translate(-2, 2)">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20 12l-8 8-8-8V4h8l8 8z"
                        />
                        <circle cx="9" cy="9" r="1.5" />
                      </g>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 12l-8 8-8-8V4h8l8 8z"
                      />
                      <circle cx="9" cy="9" r="1.5" />
                    </svg>
                    <span className="text-sm text-white/80 font-medium">Tags</span>
                  </div>

                  <input
                    value={form.tags}
                    onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="Enter tags separated by commas"
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

              </div>
            )}

            {/* FOLLOW-UP TAB */}
            {activeTab === "followup" && (
              <div className="border border-white/15 rounded-xl bg-black/30 p-4 text-white h-auto">

                {/* Assigned To Dropdown */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth={1.5} />
                      <path
                        d="M4 20c0-4 4-6 8-6s8 2 8 6"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <span className="text-sm text-white/80 font-medium whitespace-nowrap">
                      Assigned To <span className="text-[#D4AF37]">*</span>
                    </span>
                  </div>

                  <select
                    id="assignedTo"
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={(e) => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Select Person</option>
                    <option value="Mohsin">Mohsin</option>
                    <option value="Imran">Imran</option>
                  </select>
                </div>

                {/* Follow-up Date & Time */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                    </svg>

                    <span className="text-sm text-white/80 font-medium">
                      Next Follow-up Date
                    </span>
                  </div>

                  <div className="relative w-[400px]">
                    <input
                      type="datetime-local"
                      id="followUpDateTime"
                      name="followUpDateTime"
                      value={form.followUpDate ? `${form.followUpDate}T${form.followUpTime || '00:00'}` : ""}
                      onChange={(e) => {
                        const [date, time] = e.target.value.split("T");
                        setForm(prev => ({ 
                          ...prev, 
                          followUpDate: date,
                          followUpTime: time || '00:00'
                        }));
                      }}
                      className="w-full bg-black text-white border border-white/15 rounded-md px-3 py-2 pr-10 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />

                    <button
                      type="button"
                      onClick={() => document.getElementById("followUpDateTime").showPicker()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center cursor-pointer text-[#D4AF37]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Follow-up Notes */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h6l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                    </svg>

                    <span className="text-sm text-white/80 font-medium">Follow-up Notes</span>
                  </div>

                  <textarea
                    id="followUpNotes"
                    name="followUpNotes"
                    value={form.followUpNotes}
                    onChange={(e) => setForm(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    placeholder="What to do on next follow-up?"
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 h-10 resize-none focus:outline-none focus:border-[#D4AF37] transition-colors"
                  ></textarea>
                </div>

                {/* Repeat Follow-up */}
                <div className="bg-black/30 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#D4AF37]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-6h-6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10a8 8 0 0114.9-3M20 14a8 8 0 01-14.9 3" />
                    </svg>

                    <span className="text-sm text-white/80 font-medium">Repeat Follow-up</span>
                  </div>

                  <select
                    disabled
                    className="w-[400px] bg-black text-white border border-white/15 rounded-md px-3 py-2 h-10 focus:outline-none opacity-50 cursor-not-allowed"
                  >
                    <option>Select</option>
                  </select>
                </div>

                {/* Do Not Follow-up */}
                <div className="bg-black/30 p-3 flex items-center">
                  <div className="flex items-center w-full">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-[#D4AF37]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                        <line
                          x1="6"
                          y1="1"
                          x2="18"
                          y2="23"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-sm text-white/80 font-medium">Do not follow-up</span>
                    </div>

                    <div className="flex items-center ml-[365px] gap-4">
                      <div
                        onClick={() => setForm(prev => ({ ...prev, doNotFollowUp: !prev.doNotFollowUp }))}
                        className={`
          w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all
          ${form.doNotFollowUp ? "bg-[#D4AF37]" : "bg-gray-400"}
        `}
                      >
                        <div
                          className={`
            bg-white w-4 h-4 rounded-full shadow-md transform transition-all
            ${form.doNotFollowUp ? "translate-x-6" : "translate-x-0"}
          `}
                        ></div>
                      </div>

                      <div className="w-[335px]">
                        {form.doNotFollowUp ? (
                          <input
                            type="text"
                            id="doNotFollowUpReason"
                            name="doNotFollowUpReason"
                            value={form.doNotFollowUpReason || ""}
                            onChange={(e) => setForm(prev => ({ ...prev, doNotFollowUpReason: e.target.value }))}
                            placeholder="Do not follow-up reason"
                            className="w-full bg-black text-white border-b border-white/20 px-2 h-[40px] focus:border-[#D4AF37] outline-none transition-all"
                          />
                        ) : (
                          <div className="w-full h-[40px]"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* INFO+ TAB */}
            {activeTab === "info" && (
              <div className="rounded-xl p-4 text-white h-auto">
                {/* Send Automatic Wishes Section */}
                <div className="bg-black/30 p-4 rounded-xl border border-white/10 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-white/90">
                      Send wishes
                    </span>
                  </div>

                  {/* Date of Birth Row */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-[#D4AF37]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path d="M20 21v-2a4 4 0 00-3-3.87" />
                        <path d="M4 21v-2a4 4 0 013-3.87" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className="text-sm text-white/80 font-medium whitespace-nowrap">
                        Date of Birth
                      </span>
                    </div>

                    <div className="relative w-[400px]">
                      <input
                        type="date"
                        id="dobInput"
                        value={form.dob || ""}
                        onChange={(e) => setForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full bg-black text-white border border-white/15 rounded-md px-3 py-2 pr-10 focus:border-[#D4AF37] outline-none transition appearance-none cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById("dobInput").showPicker()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-[#D4AF37]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Special Event Date Row */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-[#D4AF37]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="4" y="8" width="16" height="12" rx="2" ry="2" />
                        <line x1="12" y1="8" x2="12" y2="20" strokeLinecap="round" strokeLinejoin="round" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4 
       C9 2, 6 4, 8 6 
       C6 8, 9 8, 12 4 
       C15 8, 18 8, 16 6 
       C18 4, 15 2, 12 4"
                        />
                      </svg>
                      <span className="text-sm text-white/80 font-medium whitespace-nowrap">
                        Special Event Date
                      </span>
                    </div>

                    <div className="relative w-[400px]">
                      <input
                        type="date"
                        id="specialEventInput"
                        value={form.specialEvent || ""}
                        onChange={(e) => setForm(prev => ({ ...prev, specialEvent: e.target.value }))}
                        className="w-full bg-black text-white border border-white/15 rounded-md px-3 py-2 pr-10 focus:border-[#D4AF37] outline-none transition appearance-none cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => document.getElementById("specialEventInput").showPicker()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-[#D4AF37]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 pointer-events-none"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 w-full">
                  {/* Lead Notes Section */}
                  <div className="border border-white/15 rounded-xl bg-black/30 p-4 text-white">
                    <div className="flex flex-col gap-4 w-full">
                      {/* Lead Notes */}
                      <div className="relative">
                        <label htmlFor="leadNotes" className="block text-sm text-white/80 font-medium mb-1">
                          Lead Notes
                        </label>
                        <input
                          id="leadNotes"
                          name="leadNotes"
                          type="text"
                          value={form.leadNotes}
                          onChange={(e) => setForm(prev => ({ ...prev, leadNotes: e.target.value }))}
                          placeholder="Enter lead notes"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>

                      {/* Organization Notes */}
                      <div className="relative">
                        <label htmlFor="organizationNotes" className="block text-sm text-white/80 font-medium mb-1">
                          Organization Notes
                        </label>
                        <input
                          id="organizationNotes"
                          name="organizationNotes"
                          type="text"
                          value={form.organizationNotes}
                          onChange={(e) => setForm(prev => ({ ...prev, organizationNotes: e.target.value }))}
                          placeholder="Enter organization notes"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>

                      {/* LinkedIn Profile */}
                      <div className="relative">
                        <label htmlFor="linkedInProfile" className="block text-sm text-white/80 font-medium mb-1">
                          LinkedIn Profile
                        </label>
                        <input
                          id="linkedInProfile"
                          name="linkedInProfile"
                          type="text"
                          value={form.linkedInProfile}
                          onChange={(e) => setForm(prev => ({ ...prev, linkedInProfile: e.target.value }))}
                          placeholder="Enter LinkedIn profile URL"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* References Section */}
                  <div className="border border-white/15 rounded-xl bg-black/30 p-4 text-white">
                    <div className="flex flex-col gap-4 w-full">
                      {/* Reference URL 1 */}
                      <div className="relative">
                        <label htmlFor="referenceUrlOne" className="block text-sm text-white/80 font-medium mb-1">
                          Reference Url 1
                        </label>
                        <input
                          id="referenceUrlOne"
                          name="referenceUrlOne"
                          type="text"
                          value={form.referenceUrlOne}
                          onChange={(e) => setForm(prev => ({ ...prev, referenceUrlOne: e.target.value }))}
                          placeholder="Enter reference URL 1"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>

                      {/* Reference URL 2 */}
                      <div className="relative">
                        <label htmlFor="referenceUrlTwo" className="block text-sm text-white/80 font-medium mb-1">
                          Reference Url 2
                        </label>
                        <input
                          id="referenceUrlTwo"
                          name="referenceUrlTwo"
                          type="text"
                          value={form.referenceUrlTwo}
                          onChange={(e) => setForm(prev => ({ ...prev, referenceUrlTwo: e.target.value }))}
                          placeholder="Enter reference URL 2"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>

                      {/* Reference URL 3 */}
                      <div className="relative">
                        <label htmlFor="referenceUrlThree" className="block text-sm text-white/80 font-medium mb-1">
                          Reference Url 3
                        </label>
                        <input
                          id="referenceUrlThree"
                          name="referenceUrlThree"
                          type="text"
                          value={form.referenceUrlThree}
                          onChange={(e) => setForm(prev => ({ ...prev, referenceUrlThree: e.target.value }))}
                          placeholder="Enter reference URL 3"
                          className="w-full bg-black/50 text-white border border-white/15 rounded-lg px-4 py-3 
                                   focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]
                                   transition-colors duration-200 ease-in-out
                                   placeholder:text-white/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Popup Modal */}
          {errorPopup && (
            <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/50">
              <div className="bg-black/90 border border-white/15 rounded-xl p-6 w-[400px] flex flex-col items-center gap-4">
                <p className="text-white/90 text-center text-sm">{errorPopup}</p>
                <button
                  onClick={() => setErrorPopup("")}
                  className="gold-btn gold-shine"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-10 pt-6 shrink-0 border-t border-white/15">
            <div className="flex justify-end">
              <button
                onClick={onSubmit}
                disabled={loading}
                className="gold-btn gold-shine"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}