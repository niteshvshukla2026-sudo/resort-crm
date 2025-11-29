import Department from "../models/Department.js";

export const createDepartment = async (req, res) => {
  const doc = await Department.create(req.body);
  res.status(201).json(doc);
};

export const listDepartments = async (req, res) => {
  const docs = await Department.find();
  res.json(docs);
};
