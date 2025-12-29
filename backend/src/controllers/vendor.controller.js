const mongoose = require("mongoose");

exports.listVendors = async (req, res) => {
  try {
    const Vendor = mongoose.models.Vendor;

    const vendors = await Vendor.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(vendors);
  } catch (err) {
    console.error("LIST VENDORS ERROR", err);
    res.status(500).json({ message: "Failed to load vendors" });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const Vendor = mongoose.models.Vendor;

    const payload = { ...req.body };

    // backward compatibility
    if (!payload.categories && payload.category) {
      payload.categories = [payload.category];
    }
    if (!payload.resorts && payload.resort) {
      payload.resorts = [payload.resort];
    }

    const doc = await Vendor.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE VENDOR ERROR", err);
    res.status(500).json({ message: "Failed to create vendor" });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const Vendor = mongoose.models.Vendor;

    const payload = { ...req.body };

    if (!payload.categories && payload.category) {
      payload.categories = [payload.category];
    }
    if (!payload.resorts && payload.resort) {
      payload.resorts = [payload.resort];
    }

    const updated = await Vendor.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE VENDOR ERROR", err);
    res.status(500).json({ message: "Failed to update vendor" });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const Vendor = mongoose.models.Vendor;

    const deleted = await Vendor.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE VENDOR ERROR", err);
    res.status(500).json({ message: "Failed to delete vendor" });
  }
};
