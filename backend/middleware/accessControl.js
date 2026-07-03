import mongoose from "mongoose";
import User from "../models/User.js";

export const requireSuperAdminAccess = (message = "Access is restricted to Super Admin accounts") => {
  return async (req, res, next) => {
    try {
      const accountId = req.header("x-account-id");
      const accountRole = req.header("x-account-role");

      if (accountRole !== "superadmin") {
        res.status(403);
        throw new Error(message);
      }

      if (accountId) {
        const identityQuery = [{ name: accountId.toUpperCase() }];

        if (mongoose.Types.ObjectId.isValid(accountId)) {
          identityQuery.push({ _id: accountId });
        }

        const user = await User.findOne({
          $or: identityQuery,
          role: "superadmin",
          disabled: { $ne: true }
        });

        if (user) {
          req.account = user;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
