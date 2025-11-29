// backend/src/controllers/consumptionController.js
import Consumption from "../models/Consumption.js";
import StoreTransferRule from "../models/StoreTransferRule.js";

/**
 * Helper: check if fromStore → toStore allowed as per rules
 * Behaviour:
 *  - Agar is fromStore+resort ke liye koi rule hi nahi hai → sab allowed
 *  - Agar rules hain → toStore must be in allowed list
 */
const isStoreTransferAllowed = async (resortId, fromStoreId, toStoreId) => {
  if (!fromStoreId || !toStoreId) return true;

  const baseFilter = {
    fromStore: fromStoreId,
    isAllowed: true,
  };

  if (resortId) {
    baseFilter.resort = resortId;
  } else {
    baseFilter.resort = null;
  }

  const rules = await StoreTransferRule.find(baseFilter);

  if (!rules || rules.length === 0) {
    // no rules defined = allow everything (backward compatible)
    return true;
  }

  const match = rules.find(
    (r) => String(r.toStore) === String(toStoreId)
  );

  return !!match;
};

/**
 * GET /api/consumption
 */
export const getConsumptions = async (req, res) => {
  try {
    const { type, resort, from, to } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (resort) filter.resort = resort;

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const docs = await Consumption.find(filter)
      .populate("resort", "name")
      .populate("department", "name")
      .populate("storeFrom", "name")
      .populate("storeTo", "name")
      .populate("lines.item", "name code uom")
      .sort({ date: -1, createdAt: -1 });

    res.json(docs);
  } catch (err) {
    console.error("getConsumptions error", err);
    res.status(500).json({ message: "Failed to fetch consumption entries" });
  }
};

/**
 * GET /api/consumption/:id
 */
export const getConsumptionById = async (req, res) => {
  try {
    const doc = await Consumption.findById(req.params.id)
      .populate("resort", "name")
      .populate("department", "name")
      .populate("storeFrom", "name")
      .populate("storeTo", "name")
      .populate("lines.item", "name code uom");

    if (!doc) {
      return res.status(404).json({ message: "Consumption entry not found" });
    }

    res.json(doc);
  } catch (err) {
    console.error("getConsumptionById error", err);
    res.status(500).json({ message: "Failed to fetch consumption entry" });
  }
};

/**
 * POST /api/consumption
 */
export const createConsumption = async (req, res) => {
  try {
    const payload = req.body;

    if (!payload.type) {
      return res.status(400).json({ message: "type is required" });
    }
    if (!payload.resort) {
      return res.status(400).json({ message: "resort is required" });
    }
    if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one line item is required" });
    }

    if (
      (payload.type === "RECIPE_LUMPSUM" ||
        payload.type === "RECIPE_PORTION") &&
      !payload.storeFrom
    ) {
      return res
        .status(400)
        .json({ message: "storeFrom is required for recipe consumption" });
    }

    if (payload.type === "REPLACEMENT") {
      if (!payload.storeFrom || !payload.storeTo) {
        return res.status(400).json({
          message: "storeFrom and storeTo are required for replacement",
        });
      }

      const allowed = await isStoreTransferAllowed(
        payload.resort,
        payload.storeFrom,
        payload.storeTo
      );

      if (!allowed) {
        return res.status(400).json({
          message:
            "Store transfer not allowed as per Store Transfer Rules. Please contact Super Admin.",
        });
      }
    }

    const doc = await Consumption.create({
      ...payload,
      createdBy: req.user?._id,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("createConsumption error", err);
    res.status(500).json({ message: "Failed to create consumption entry" });
  }
};

/**
 * PUT /api/consumption/:id
 */
export const updateConsumption = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Consumption.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Consumption entry not found" });
    }

    const updatableFields = [
      "type",
      "resort",
      "department",
      "outlet",
      "date",
      "referenceNo",
      "notes",
      "eventName",
      "menuName",
      "pax",
      "storeFrom",
      "storeTo",
      "status",
      "lines",
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        doc[field] = req.body[field];
      }
    });

    // optional: if type = REPLACEMENT and from/to updated, re-check rule
    if (doc.type === "REPLACEMENT" && doc.storeFrom && doc.storeTo) {
      const allowed = await isStoreTransferAllowed(
        doc.resort,
        doc.storeFrom,
        doc.storeTo
      );

      if (!allowed) {
        return res.status(400).json({
          message:
            "Updated store transfer not allowed as per Store Transfer Rules.",
        });
      }
    }

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error("updateConsumption error", err);
    res.status(500).json({ message: "Failed to update consumption entry" });
  }
};

/**
 * DELETE /api/consumption/:id
 */
export const deleteConsumption = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Consumption.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Consumption entry not found" });
    }

    await doc.deleteOne();
    res.json({ message: "Consumption entry deleted" });
  } catch (err) {
    console.error("deleteConsumption error", err);
    res.status(500).json({ message: "Failed to delete consumption entry" });
  }
};
