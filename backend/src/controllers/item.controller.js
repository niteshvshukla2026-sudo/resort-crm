import Item from "../models/Item.js";

export const createItem = async (req, res) => {
  const doc = await Item.create(req.body);
  res.status(201).json(doc);
};

export const listItems = async (req, res) => {
  const docs = await Item.find();
  res.json(docs);
};
