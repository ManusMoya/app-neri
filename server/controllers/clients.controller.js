const clientsService = require("../services/clients.service");

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function listClients(req, res, next) {
  try {
    const clients = await clientsService.listClients(req.query.search || "");
    res.json({ status: "ok", data: clients });
  } catch (error) {
    next(error);
  }
}

async function getClient(req, res, next) {
  try {
    const client = await clientsService.getClientById(req.params.id);

    if (!client) {
      throw notFound("Cliente no encontrado.");
    }

    res.json({ status: "ok", data: client });
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const client = await clientsService.createClient(req.body);
    res.status(201).json({ status: "ok", data: client });
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await clientsService.updateClient(req.params.id, req.body);

    if (!client) {
      throw notFound("Cliente no encontrado.");
    }

    res.json({ status: "ok", data: client });
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await clientsService.deleteClient(req.params.id);

    if (!client) {
      throw notFound("Cliente no encontrado.");
    }

    res.json({ status: "ok", data: client });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createClient,
  deleteClient,
  getClient,
  listClients,
  updateClient,
};
