import Item from "../models/Item.js";

export const getItems = async (req, res) => {
  try {
    const items = await Item.find().populate("itemCategory", "name");
    res.json(items);
  } catch (error) {
    console.error("getItems error", error);
    res.status(500).json({ message: error.message });
  }
};

export const createItem = async (req, res) => {
  try {
    const { code, name, itemCategory, uom, brand, indicativePrice } = req.body;

    if (!code || !name || !uom) {
      return res
        .status(400)
        .json({ message: "Code, Name & UOM are required" });
    }

    const payload = {
      code: code.trim(),
      name: name.trim(),
      uom: uom.trim(),
    };

    if (itemCategory) payload.itemCategory = itemCategory;
    if (brand) payload.brand = brand;
    if (indicativePrice !== undefined && indicativePrice !== null) {
      payload.indicativePrice = Number(indicativePrice);
    }

    const created = await Item.create(payload);
    const populated = await created.populate("itemCategory", "name");
    res.status(201).json(populated);
  } catch (error) {
    console.error("createItem error", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, itemCategory, uom, brand, indicativePrice, isActive } =
      req.body;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (code) item.code = code.trim();
    if (name) item.name = name.trim();
    if (uom) item.uom = uom.trim();
    if (itemCategory) item.itemCategory = itemCategory;
    if (brand !== undefined) item.brand = brand;
    if (indicativePrice !== undefined && indicativePrice !== null) {
      item.indicativePrice = Number(indicativePrice);
    }
    if (typeof isActive === "boolean") item.isActive = isActive;

    await item.save();
    const populated = await item.populate("itemCategory", "name");
    res.json(populated);
  } catch (error) {
    console.error("updateItem error", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (error) {
    console.error("deleteItem error", error);
    res.status(500).json({ message: error.message });
  }
};
