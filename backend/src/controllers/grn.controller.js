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

    if (!grnNo || !store || !receivedDate || !challanNo) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const grn = new GRN({
      grnNo,
      po: poId || null,            // ✅ PO OPTIONAL
      requisition: req.params.id,  // ✅ DIRECT FROM REQUISITION
      receivedBy,
      receivedDate,
      challanNo,
      billNo,
      store,
      items,
    });

    await grn.save();

    // link back to requisition
    await Requisition.findByIdAndUpdate(req.params.id, {
      status: "GRN_CREATED",
      grn: grn._id,
    });

    res.status(201).json(grn);
  } catch (err) {
    console.error("Create GRN error", err);
    res.status(500).json({ message: "Failed to create GRN" });
  }
};
