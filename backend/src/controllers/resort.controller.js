// backend/src/controllers/resort.controller.js
import Resort from "../models/resort.model.js";

export const listResorts = async (req, res) => {
  try {
    // simple filters: name, locationZone, status etc via query params
    const filter = {};
    if (req.query.name) filter.name = { $regex: req.query.name, $options: "i" };
    if (req.query.locationZone) filter.locationZone = { $regex: req.query.locationZone, $options: "i" };
    if (req.query.status) filter.isActive = req.query.status === "active";

    const resorts = await Resort.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(resorts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getResort = async (req, res) => {
  try {
    const r = await Resort.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createResort = async (req, res) => {
  try {
    const payload = req.body;
    // basic validation server-side too
    if (!payload.name || !payload.address || !payload.locationZone || !payload.ownerName || !payload.ownerContact) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    // ensure phone digits only
    payload.ownerContact = (payload.ownerContact || "").replace(/\D/g, "");
    if (payload.renewalDate) payload.renewalDate = new Date(payload.renewalDate);
    const created = await Resort.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create resort" });
  }
};

export const updateResort = async (req, res) => {
  try {
    const payload = req.body;
    if (payload.ownerContact) payload.ownerContact = payload.ownerContact.replace(/\D/g, "");
    if (payload.renewalDate) payload.renewalDate = new Date(payload.renewalDate);
    const updated = await Resort.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update" });
  }
};

export const deleteResort = async (req, res) => {
  try {
    const removed = await Resort.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete" });
  }
};
