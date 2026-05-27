function notFound(entityName) {
  const error = new Error(`${entityName} no encontrado.`);
  error.statusCode = 404;
  return error;
}

function createCrudController(entityName, service) {
  return {
    async list(req, res, next) {
      try {
        const rows = await service.list(req.query, req.user.id);
        res.json({ status: "ok", data: rows });
      } catch (error) {
        next(error);
      }
    },

    async get(req, res, next) {
      try {
        const row = await service.getById(req.params.id, req.user.id);

        if (!row) {
          throw notFound(entityName);
        }

        res.json({ status: "ok", data: row });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const row = await service.create(req.body, req.user.id);
        res.status(201).json({ status: "ok", data: row });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const row = await service.update(req.params.id, req.body, req.user.id);

        if (!row) {
          throw notFound(entityName);
        }

        res.json({ status: "ok", data: row });
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const row = await service.remove(req.params.id, req.user.id);

        if (!row) {
          throw notFound(entityName);
        }

        res.json({ status: "ok", data: row });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createCrudController,
};
