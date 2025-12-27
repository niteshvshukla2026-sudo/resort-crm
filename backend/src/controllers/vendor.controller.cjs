module.exports = function createVendorController(mongoose) {
  const Vendor = require("../models/vendor.model.cjs")(mongoose);

  // ================= GET =================
  const listVendors = async (req, res) => {
    try {
      const vendors = await Vendor.find().sort({ name: 1 });
      res.json(vendors);
    } catch (err) {
      console.error("listVendors error:", err);
      res.status(500).json({ message: "Failed to load vendors" });
    }
  };

  // ================= CREATE =================
  const createVendor = async (req, res) => {
    try {
      const payload = { ...req.body };

      if (!payload.code || !payload.name) {
        return res
          .status(400)
          .json({ message: "Vendor code and name are required" });
      }

      const exists = await Vendor.findOne({ code: payload.code });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Vendor code already exists" });
      }

      // normalize arrays
      payload.categories = Array.isArray(payload.categories)
        ? payload.categories
        : payload.category
        ? [payload.category]
        : [];

      payload.resorts = Array.isArray(payload.resorts)
        ? payload.resorts
        : payload.resort
        ? [payload.resort]
        : [];

      const vendor = await Vendor.create(payload);
      res.json(vendor);
    } catch (err) {
      console.error("createVendor error:", err);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  };

  // ================= UPDATE =================
  const updateVendor = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = { ...req.body };

      payload.categories = Array.isArray(payload.categories)
        ? payload.categories
        : payload.category
        ? [payload.category]
        : [];

      payload.resorts = Array.isArray(payload.resorts)
        ? payload.resorts
        : payload.resort
        ? [payload.resort]
        : [];

      const vendor = await Vendor.findByIdAndUpdate(id, payload, {
        new: true,
      });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json(vendor);
    } catch (err) {
      console.error("updateVendor error:", err);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  };

  // ================= DELETE =================
  const deleteVendor = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Vendor.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteVendor error:", err);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  };

  return {
    listVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
};
