const fs = require("fs");
const os = require("os");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");
const { execSync } = require("child_process");
const Handlebars = require("handlebars");

const config = {
  port: process.env.PORT || 30000,
  servicesConfigPath: process.env.SERVICES_CONFIG || "/etc/s_a_b/services.json",
  templatesPath: process.env.TEMPLATES_PATH || "/etc/s_a_b/templates/",
  tempFolderPath: undefined,
};

fs.mkdtemp(path.join(os.tmpdir(), "shoutrrr_alertmanager_bridge"), (err, folder) => {
  if (err) throw err;
  console.log("created temp folder: " + folder);
  config.tempFolderPath = folder;
});
console.log("Reading services from: " + config.servicesConfigPath);
let servicesJSON = JSON.parse(fs.readFileSync(config.servicesConfigPath));

const app = new Koa();
app.use(bodyParser());
const router = new Router();

function cleanShellOutput(source) {
  return source.trimEnd("\r\n").replaceAll('"', "");
}

function logIncomingRequest(ctx) {
  const incoming = {
    url: ctx.URL,
    headers: ctx.headers,
    body: ctx.request.body,
  };
  const serialized = JSON.stringify(incoming, null, 2);
  const now = new Date();
  const logFileName = path.join(
    config.tempFolderPath,
    `req-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.log`
  );
  fs.writeFileSync(logFileName, serialized);
}

router
  .get("/", (ctx, next) => {
    ctx.body = "hello world";
  })
  .post("/shoutrrr_alert/:service", (ctx, next) => {
    logIncomingRequest(ctx);
    //Get service data from JSON
    let service = servicesJSON.filter(function (item) { return item.name === ctx.params.service; })[0];

    if (service !== undefined) { // Cool! We have a configured service
      let templateSourceOriginal = fs.readFileSync(config.templatesPath + service.template).toString();
      let alertN = 0;
      for (const x of ctx.request.body.alerts) {
        let templateSource = templateSourceOriginal.replaceAll(/{{(?!reqBody)/g, `{{alerts.[${alertN}].`);
        templateSource = templateSource.replaceAll('reqBody.', "");
        let template = Handlebars.compile(templateSource);
        alertN++;
        let url = new URL(service.url);
        let search_params = url.searchParams;

        // Remove CRLF from query
        Object.keys(ctx.query).reduce((acc, key) => {
          acc[key] = cleanShellOutput(ctx.query[key]);
          return acc;
        }, {});

        // Set URL query values per receivers URL
        Object.entries(ctx.query).forEach(([key, value]) => {
          search_params.set(key, value);
        });

        // Dinamically replace values in Shoutrrr service URL
        service.replaceInURL.forEach((rip) => {
          if (rip.byAlert) {
            search_params.set(rip.shoutrrrProp, x[rip.by]);
          } else {
            search_params.set(rip.shoutrrrProp, ctx.request.body[rip.by]);
          }
        });
        
        url.search = search_params.toString();
        url = (decodeURIComponent(url));
        var html = template(ctx.request.body).replaceAll('"', "\\\"");

        console.log(`Sending to ${url}\n${html}`);
        try {
          execSync(`shoutrrr send -m "${html}" -u "${url}"`);
          ctx.body = "tnx alertmanager";
        } catch (error) {
          console.log(`Error\n ${error}`);
          ctx.body = `Error sending shoutrrr command:\n${error}`;
          ctx.status = 500
          break;
        }
      };

    } else {
      console.log(`No service "${ctx.params.service}" found in ${config.servicesConfigPath}`);
      ctx.body = `No service "${ctx.params.service}" found in ${config.servicesConfigPath}`;
      ctx.status = 404
    }
  });

app.use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
