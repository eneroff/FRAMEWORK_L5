const http = require('http');
const Router = require('./router');
const { parse } = require('querystring');
const url = require('url');

class ErrorHandler {
  static handle(error, res) {
    console.error('[Error]', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error');
  }
}

class MinimalExpress {
  constructor() {
    this.router = new Router();
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  get(path, handler) {
    this.router.register('GET', path, handler);
  }

  post(path, handler) {
    this.router.register('POST', path, handler);
  }

  put(path, handler) {
    this.router.register('PUT', path, handler);
  }

  patch(path, handler) {
    this.router.register('PATCH', path, handler);
  }

  delete(path, handler) {
    this.router.register('DELETE', path, handler);
  }

  handleRequest(req, res) {
    this._bodyParser(req, () => {
      this._middlewareRunner(req, res, () => {
        try {
          this.router.handle(req, res);
        } catch (err) {
          ErrorHandler.handle(err, res);
        }
      });
    });
  }

  _bodyParser(req, callback) {
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        req.body = parse(body);
        callback();
      });
    } else {
      req.body = {};
      callback();
    }
  }

  _middlewareRunner(req, res, done) {
    let index = 0;
    const next = () => {
      if (index < this.middlewares.length) {
        const mw = this.middlewares[index++];
        try {
          mw(req, res, next);
        } catch (err) {
          ErrorHandler.handle(err, res);
        }
      } else {
        done();
      }
    };
    next();
  }

  listen(port, callback) {
    const server = http.createServer((req, res) => this.handleRequest(req, res));
    server.listen(port, callback);
  }
}

module.exports = MinimalExpress;