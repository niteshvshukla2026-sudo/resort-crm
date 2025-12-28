module.exports = function createStoreController(mongoose) {
   const Store = mongoose.model("Store");

  // helper: generate store code from name
  const genCode = (name = "") => {
    const base = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const rand = Math.floor(100 + Math.random() * 900);
    return `${base || "STR"}${rand}`;
  };

  // ================= GET (RESORT-WISE) =================
  const listStores = async (req, res) => {
    try {
      const { resort } = req.query;

      const query = {};
      if (resort) query.resort = resort;

      const stores = await Store.find(query).sort({ name: 1 });
      res.json(stores);
    } catch (err) {
      console.error("listStores error:", err);
      res.status(500).json({ message: "Failed to load stores" });
    }
  };

  // ================= CREATE =================
  const createStore = async (req, res) => {
    try {
      const { name, resort } = req.body;

      if (!name || !resort) {
        return res
          .status(400)
          .json({ message: "Store name and resort are required" });
      }

      const store = await Store.create({
        name: name.trim(),
        code: genCode(name),
        resort,
      });

      res.json(store);
    } catch (err) {
      console.error("createStore error:", err);
      res.status(500).json({ message: "Failed to create store" });
    }
  };

  // ================= UPDATE =================
  const updateStore = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const store = await Store.findByIdAndUpdate(
        id,
        { name: name?.trim() },
        { new: true }
      );

      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      res.json(store);
    } catch (err) {
      console.error("updateStore error:", err);
      res.status(500).json({ message: "Failed to update store" });
    }
  };

  // ================= DELETE =================
  const deleteStore = async (req, res) => {
    try {
      const { id } = req.params;

      const deleted = await Store.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: "Store not found" });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error("deleteStore error:", err);
      res.status(500).json({ message: "Failed to delete store" });
    }
  };

  return {
    listStores,
    createStore,
    updateStore,
    deleteStore,
  };
};
