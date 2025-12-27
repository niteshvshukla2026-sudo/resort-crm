module.exports = function createItemController(mongoose) {
  const Item = require("../models/item.model.cjs")(mongoose);

  // ================= GET ALL =================
  const listItems = async (req, res) => {
    try {
      const items = await Item.find()
        .populate("itemCategory", "name")
        .sort({ name: 1 });

      res.json(items); // frontend expects array
    } catch (err) {
      console.error("listItems error:", err);
      res.status(500).json({ message: "Failed to load items" });
    }
  };

  // ================= CREATE =================
  const createItem = async (req, res) => {
    try {
      const {
        name,
        code,
        itemCategory,
        uom,
        brand,
        indicativePrice,
      } = req.body;

      if (!name || !code || !uom) {
        return res.status(400).json({
          message: "Item name, code and UOM are required",
        });
      }

      const exists = await Item.findOne({ code });
      if (exists) {
        return res.status(400).json({
          message: "Item code already exists",
        });
      }

      const item = await Item.create({
        name: name.trim(),
        code: code.trim(),
        itemCategory: itemCategory || undefined,
        uom,
        brand: brand || "",
        indicativePrice,
      });

      const populated = await Item.findById(item._id).populate(
        "itemCategory",
        "name"
      );

      res.json(populated);
    } catch (err) {
      console.error("createItem error:", err);
      res.status(500).json({ message: "Failed to create item" });
    }
  };

  // ================= UPDATE =================
  const updateItem = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        itemCategory,
        uom,
        brand,
        indicativePrice,
      } = req.body;

      const updated = await Item.findByIdAndUpdate(
        id,
        {
          name: name?.trim(),
          code: code?.trim(),
          itemCategory: itemCategory || undefined,
          uom,
          brand,
          indicativePrice,
        },
        { new: true }
      ).populate("itemCategory", "name");

      if (!updated) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error("updateItem error:", err);
      res.status(500).json({ message: "Failed to update item" });
    }
  };

  // ================= DELETE =================
  const deleteItem = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Item.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteItem error:", err);
      res.status(500).json({ message: "Failed to delete item" });
    }
  };

  return {
    listItems,
    createItem,
    updateItem,
    deleteItem,
  };
};
