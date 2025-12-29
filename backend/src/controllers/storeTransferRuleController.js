// backend/src/controllers/storeTransferRuleController.js
import StoreTransferRule from "../models/StoreTransferRule.js";

/**
 * GET /api/store-transfer-rules
 * query: resort? fromStore?
 */
export const getStoreTransferRules = async (req, res) => {
  try {
    const { resort, fromStore } = req.query;
    const filter = {};
    if (resort) filter.resort = resort;
    if (fromStore) filter.fromStore = fromStore;

    const rules = await StoreTransferRule.find(filter)
      .populate("resort", "name")
      .populate("fromStore", "name")
      .populate("toStore", "name")
      .sort({ "fromStore.name": 1, "toStore.name": 1 });

    res.json(rules);
  } catch (err) {
    console.error("getStoreTransferRules error", err);
    res.status(500).json({ message: "Failed to fetch store transfer rules" });
  }
};

/**
 * POST /api/store-transfer-rules
 * body: { resort?, fromStore, toStore, isAllowed? }
 */
export const createStoreTransferRule = async (req, res) => {
  try {
    const { resort, fromStore, toStore, isAllowed } = req.body;

    if (!fromStore || !toStore) {
      return res
        .status(400)
        .json({ message: "fromStore and toStore are required" });
    }

    if (String(fromStore) === String(toStore)) {
      return res
        .status(400)
        .json({ message: "fromStore and toStore cannot be same" });
    }

    // if already exists, just update allowed flag
    const existing = await StoreTransferRule.findOne({
      resort: resort || null,
      fromStore,
      toStore,
    });

    if (existing) {
      existing.isAllowed = isAllowed ?? true;
      await existing.save();
      return res.json(existing);
    }

    const rule = await StoreTransferRule.create({
      resort: resort || null,
      fromStore,
      toStore,
      isAllowed: isAllowed ?? true,
    });

    res.status(201).json(rule);
  } catch (err) {
    console.error("createStoreTransferRule error", err);
    res.status(500).json({ message: "Failed to create store transfer rule" });
  }
};

/**
 * PUT /api/store-transfer-rules/:id
 */
export const updateStoreTransferRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await StoreTransferRule.findById(id);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    if (req.body.isAllowed !== undefined) {
      rule.isAllowed = req.body.isAllowed;
    }
    if (req.body.resort !== undefined) {
      rule.resort = req.body.resort || null;
    }
    if (req.body.fromStore) {
      rule.fromStore = req.body.fromStore;
    }
    if (req.body.toStore) {
      if (String(req.body.toStore) === String(rule.fromStore)) {
        return res
          .status(400)
          .json({ message: "fromStore and toStore cannot be same" });
      }
      rule.toStore = req.body.toStore;
    }

    await rule.save();
    res.json(rule);
  } catch (err) {
    console.error("updateStoreTransferRule error", err);
    res.status(500).json({ message: "Failed to update store transfer rule" });
  }
};

/**
 * DELETE /api/store-transfer-rules/:id
 */
export const deleteStoreTransferRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await StoreTransferRule.findById(id);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    await rule.deleteOne();
    res.json({ message: "Rule deleted" });
  } catch (err) {
    console.error("deleteStoreTransferRule error", err);
    res.status(500).json({ message: "Failed to delete store transfer rule" });
  }
};
