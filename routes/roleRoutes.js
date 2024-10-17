const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const auth = require("../middleware/auth");
const roleCheck = require("../middleware/roleCheck");

router.post("/", auth, roleCheck(["Admin"]), roleController.createRole);
router.get("/", auth, roleCheck(["Admin"]), roleController.getAllRoles);
router.put("/:id", auth, roleCheck(["Admin"]), roleController.updateRole);
router.delete("/:id", auth, roleCheck(["Admin"]), roleController.deleteRole);

module.exports = router;
