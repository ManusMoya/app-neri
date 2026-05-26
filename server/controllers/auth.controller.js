const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ status: "ok", data: result });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ status: "ok", data: result });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);

    if (!user) {
      const error = new Error("Usuario no encontrado.");
      error.statusCode = 404;
      throw error;
    }

    res.json({ status: "ok", data: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
  register,
};
