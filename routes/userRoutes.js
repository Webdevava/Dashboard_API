const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.get("/", auth, roleCheck(["Admin"]), userController.getAllUsers);
router.get(
  "/:id",
  auth,
  roleCheck(["Admin", "Executive"]),
  userController.getUserById
);
router.put("/:id", auth, roleCheck(["Admin"]), userController.updateUser);
router.delete("/:id", auth, roleCheck(["Admin"]), userController.deleteUser);

module.exports = router;
