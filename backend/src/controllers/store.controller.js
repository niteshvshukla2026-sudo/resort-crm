import Store from "../models/Store.js";

export const createStore = async (req, res) => {
  const doc = await Store.create(req.body);
  res.status(201).json(doc);
};

export const listStores = async (req, res) => {
  const docs = await Store.find();
  res.json(docs);
};
