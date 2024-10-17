const Role = require("../models/Role");

exports.createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const role = new Role({ name, permissions });
    await role.save();
    res.status(201).json(role);
    console.log("Created new role successfully:", name);
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Error creating role" });
  }
};

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
    console.log("Retrieved all roles successfully");
  } catch (error) {
    console.error("Error retrieving roles:", error);
    res.status(500).json({ message: "Error retrieving roles" });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { permissions } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true, runValidators: true }
    );
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json(role);
    console.log("Updated role successfully:", req.params.id);
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Error updating role" });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.json({ message: "Role deleted successfully" });
    console.log("Deleted role successfully:", req.params.id);
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Error deleting role" });
  }
};
