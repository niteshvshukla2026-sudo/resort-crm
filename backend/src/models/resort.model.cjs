module.exports = function (mongoose) {
  const ResortSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      code: { type: String, required: true, trim: true, unique: true },

      address: { type: String, required: true },
      locationZone: { type: String, required: true },

      ownerName: { type: String, required: true },
      ownerContact: { type: String, required: true },
      ownerEmail: { type: String },
      ownerResdAddress: { type: String },
      ownerOffAddress: { type: String },

      noOfKeys: { type: Number },

      tieUpCategory: {
        type: String,
        enum: ["Managed", "Marketed", "Owned", "Commissionable"],
      },

      qualityCategory: {
        type: String,
        enum: ["5-Star", "4-Star", "3-Star", "Budget"],
      },

      locationCategory: {
        type: String,
        enum: ["Mainstream", "Offbeat"],
      },

      fssaiNumber: { type: String },
      fssaiStatus: {
        type: String,
        enum: ["active", "expired", "pending"],
      },

      renewalDate: { type: Date },

      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );

  return mongoose.models.Resort || mongoose.model("Resort", ResortSchema);
};
