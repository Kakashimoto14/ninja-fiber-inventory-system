import User from "../models/User.js";

export const getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await User.create({
      name: req.body.name,
      role: req.body.role || "admin",
      disabled: Boolean(req.body.disabled),
      password: req.body.password || "1234"
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    Object.assign(user, req.body);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};
