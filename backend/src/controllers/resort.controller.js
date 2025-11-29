import Resort from "../models/Resort.js";

export const createResort = async (req, res) => {
  const resort = await Resort.create(req.body);
  res.status(201).json(resort);
};

export const listResorts = async (req, res) => {
  const resorts = await Resort.find();
  res.json(resorts);
};
