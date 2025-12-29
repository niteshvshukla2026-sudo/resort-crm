const mongoose = require("mongoose");

exports.listItems = async (req, res) => {
  try {
    const Item = mongoose.models.Item;

    const items = await Item.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error("LIST ITEMS ERROR", err);
    res.status(500).json({ message: "Failed to load items" });
  }
};

exports.createItem = async (req, res) => {
  try {
    const Item = mongoose.models.Item;

    const payload = {
      name: req.body.name,
      code: req.body.code,
      itemCategory: req.body.itemCategory,
      uom: req.body.uom,
      brand: req.body.brand,
      indicativePrice: req.body.indicativePrice,
    };

    const doc = await Item.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("CREATE ITEM ERROR", err);
    res.status(500).json({ message: "Failed to create item" });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const Item = mongoose.models.Item;

    const payload = {
      name: req.body.name,
      code: req.body.code,
      itemCategory: req.body.itemCategory,
      uom: req.body.uom,
      brand: req.body.brand,
      indicativePrice: req.body.indicativePrice,
    };

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("UPDATE ITEM ERROR", err);
    res.status(500).json({ message: "Failed to update item" });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const Item = mongoose.models.Item;

    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE ITEM ERROR", err);
    res.status(500).json({ message: "Failed to delete item" });
  }
};
