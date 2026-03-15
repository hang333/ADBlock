import { Hono } from "hono";
import { fetch } from "@nsnanocat/util";
import { Request } from "./process/Request.mjs";
import { Response } from "./process/Response.mjs";
/***************** Processing *****************/
export default new Hono().all("/:rest{.*}", async c => {
    const url = new URL(c.req.url);
    switch (true) {
        case url.hostname.startsWith("test."): {
            url.hostname = "app.bilibili.com";
            break;
        }
        default: {
            const [host, ...path] = c.req.param("rest").split("/");
            url.protocol = "https:";
            url.hostname = host;
            url.port = "443";
			url.pathname = path.join("/");
        }
    }
    let $request = {
        method: c.req.method,
        url: url.toString(),
        headers: c.req.header(),
        body: await c.req.arrayBuffer().then(r => r.byteLength ? r : undefined),
    };
    let $response;
    ({ $request, $response } = await Request($request));
    if (!$response) {
        delete $request.headers["host"];
        delete $request.headers["cf-connecting-ip"];
        $response = await fetch($request);
        $response = await Response($request, $response);
    };
    Object.keys($response.headers).map(k => c.header(k, $response.headers[k]));
    delete $response.headers["content-length"];
    delete $response.headers["transfer-encoding"];
    return c.body($response.body);
});
