import Vendor from "../models/Vendor.js";

export const createVendor = async (req, res) => {
  const doc = await Vendor.create(req.body);
  res.status(201).json(doc);
};

export const listVendors = async (req, res) => {
  const docs = await Vendor.find();
  res.json(docs);
};
