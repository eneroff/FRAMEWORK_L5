const http = require('http');
const { EventEmitter } = require('events');
const url = require('url');
const qs = require('querystring');

class MinimalExpress extends EventEmitter {
  constructor() {
    super();
    this.routes = {
      GET: {},
      POST: {},
      PUT: {},
      PATCH: {},
      DELETE: {},
    };
    this.middlewares = [];
  }

  get(path, handler) {
    this.routes.GET[path] = handler;
  }

  post(path, handler) {
    this.routes.POST[path] = handler;
  }

  put(path, handler) {
    this.routes.PUT[path] = handler;
  }

  patch(path, handler) {
    this.routes.PATCH[path] = handler;
  }

  delete(path, handler) {
    this.routes.DELETE[path] = handler;
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    req.params = parsedUrl.pathname.split('/').filter(Boolean);
    req.query = parsedUrl.query;

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        req.body = qs.parse(body);
        this.executeMiddlewares(req, res, () => this.handleRoute(req, res));
      });
    } else {
      req.body = {};
      this.executeMiddlewares(req, res, () => this.handleRoute(req, res));
    }
  }

  executeMiddlewares(req, res, next) {
    let index = 0;
    const nextMiddleware = () => {
      if (index < this.middlewares.length) {
        this.middlewares[index](req, res, () => {
          index++;
          nextMiddleware();
        });
      } else {
        next();
      }
    };
    nextMiddleware();
  }

handleRoute(req, res) {
    const methodRoutes = this.routes[req.method];
    const routeHandler = methodRoutes[req.url];

    res.send = (data) => {
      res.setHeader('Content-Type', 'text/html');
      res.end(data);
    };
  
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
  
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
  
    if (routeHandler) {
      try {
        routeHandler(req, res);
      } catch (error) {
        this.handleError(error, res);
      }
    } else {
      res.status(404).send('Not Found');
    }
  }

  handleError(error, res) {
    res.status(500);
    res.send('Internal Server Error');
    console.error(error);
  }

  listen(port, callback) {
    const server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    server.listen(port, callback);
  }
}

module.exports = MinimalExpress;