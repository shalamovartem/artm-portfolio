process.chdir(__dirname);
process.env.NODE_ENV = "production";
const next = require("next");
const http = require("node:http");
const app = next({ dev: false, dir: __dirname });
app
  .prepare()
  .then(() =>
    http
      .createServer(app.getRequestHandler())
      .listen(process.env.PORT || 3000, process.env.HOST, () =>
        console.log("Portfolio server ready"),
      ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
