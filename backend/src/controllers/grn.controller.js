exports.createGRN = async (req, res) => {
  try {
    const {
      grnNo,
      poId,              // OPTIONAL
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
    } = req.body;

    // 🔒 BASIC VALIDATION
    if (!grnNo || !store || !receivedDate || !challanNo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "GRN must have at least one item" });
    }

    // 🔍 Fetch requisition to get RESORT
    const requisition = await Requisition.findById(req.params.id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    if (!requisition.resort) {
      return res.status(400).json({ message: "Requisition has no resort" });
    }

    // ✅ CREATE GRN (MATCHES SCHEMA)
    const grn = await GRN.create({
      grnNo,
      requisition: requisition._id,
      resort: requisition.resort,      // ✅ REQUIRED BY SCHEMA
      store,
      poId: poId || null,              // ✅ CORRECT FIELD NAME
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      items,
      status: "CREATED",
    });

    // 🔗 UPDATE REQUISITION
    await Requisition.findByIdAndUpdate(requisition._id, {
      status: "GRN_CREATED",
      grn: {
        _id: grn._id,
        code: grn.grnNo,
      },
    });

    res.status(201).json(grn);
  } catch (err) {
    console.error("Create GRN error ❌", err);
    res.status(500).json({
      message: "Failed to create GRN",
      error: err.message,
    });
  }
};
