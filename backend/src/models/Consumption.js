// backend/src/models/Consumption.js
import mongoose from "mongoose";

const consumptionLineSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 0,
    },
    uom: {
      type: String,
      required: true,
    },
    remarks: String,
  },
  { _id: false }
);

const consumptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["RECIPE_LUMPSUM", "RECIPE_PORTION", "REPLACEMENT"],
      required: true,
    },

    // common
    resort: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resort",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    outlet: String, // e.g. Restaurant / Banquet name
    date: {
      type: Date,
      default: Date.now,
    },
    referenceNo: String, // e.g. CON-2025-0001
    notes: String,

    // recipe-based extra
    eventName: String, // for functions / parties (lumpsum)
    menuName: String,  // menu / recipe set used
    pax: Number,       // number of people (for lumpsum)

    // store movement
    storeFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
    },
    storeTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store", // only for REPLACEMENT
    },

    status: {
      type: String,
      enum: ["DRAFT", "POSTED"],
      default: "POSTED",
    },

    lines: {
      type: [consumptionLineSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one line item is required",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Consumption = mongoose.model("Consumption", consumptionSchema);
export default Consumption;
