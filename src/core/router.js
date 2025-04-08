const url = require('url');

class Router {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      PATCH: [],
      DELETE: []
    };
  }

  register(method, path, handler) {
    this.routes[method].push({ path, handler });
  }

  handle(req, res) {
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;

    const route = this._matchRoute(req.method, parsedUrl.pathname);

    if (route) {
      req.params = route.params;

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

      try {
        route.handler(req, res);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }

  _matchRoute(method, requestPath) {
    const routes = this.routes[method] || [];

    for (const { path, handler } of routes) {
      const routeParts = path.split('/').filter(Boolean);
      const requestParts = requestPath.split('/').filter(Boolean);

      if (routeParts.length !== requestParts.length) continue;

      const params = {};
      let matched = true;

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = requestParts[i];
        } else if (routeParts[i] !== requestParts[i]) {
          matched = false;
          break;
        }
      }

      if (matched) return { handler, params };
    }

    return null;
  }
}

module.exports = Router;