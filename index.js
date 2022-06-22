//Start a server with Express

const express = require("express");
const app = express();
const server = require("http").createServer(app);
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const timeout = require("connect-timeout");
const bd = require('./bd');
//import fs
const fs = require("fs");
//import axios
const axios = require("axios");
dotenv.config();

const port = process.env.PORT || 3000;
const WooCommerceAPI = require("woocommerce-api");
//cors config of server
const cors = require("cors");

const multer = require("multer");

const upload = multer();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin", "Access-Control-Allow-Origin"],

}));
app.use(timeout(30000));

const haltOnTimedout = (req, res, next) => {
    if (!req.timedout) next();
}
app.use(haltOnTimedout);


//Allow body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
const WooCommerce = new WooCommerceAPI({
  url: process.env.WOO_HOST,
  consumerKey: process.env.WOO_CONSUMER_KEY,
  consumerSecret: process.env.WOO_CONSUMER_SECRET,
  wpAPI: true,
  version: "wc/v2",
});

//List products WooCommerce API.
app.get("/inventory/", (req, res) => {
  
  const page = req.query.page || 1;
  const offset = (page - 1) * 50;
  const search = req.query.search || "";

  const pageQuery = `&page=${page}`;
  const searchQuery = `&search=${search}`;
  const query = `&offset=${offset}`;

  WooCommerce.get( 
    `products?per_page=50${pageQuery}${query}${searchQuery}`,
    (err, data) => {
        
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        } else {
            return res.status(200).send(data);
        }
    }
  );
  
});

app.get("/products/var/:id", (req, res) => {
  // const data = {
  //     attributes: [
  //         {
  //             id: 0,
  //             name: "Presentación",
  //             options: ['GRIS (Caja x 12 Unidades)', 'NEGRO (Caja x 12 Unidades)', 'BLANCO (Caja x 12 Unidades)', 'AZUL (Caja x 12 Unidades)'],
  //             position: 0,
  //             variation: true,
  //             visible: true
  //         }
  //     ],
  // }
  // WooCommerce.put("products/7429", data, (err, data) => {
  //     if(err) {
  //         res.status(503).send(err);
  //     } else {
  //         res.send(req.params.id);
  //         // const variation = {
  //         //     regular_price: "9.00",
  //         //     attributes: [
  //         //       {
  //         //         id: 0,
  //         //         name: "Presentación",
  //         //         option: "AZUL (Caja x 12 Unidades)"
  //         //       }
  //         //     ]
  //         //   };
  //         // WooCommerce.post("products/7429/variations", variation, (err, data) => {
  //         //     if(err) {
  //         //         res.status(503).send(err);
  //         //     } else {
  //         //         //console.log(data);
  //         //         res.send(data.body);
  //         //     }
  //         // });
  //     }
  // });
});

app.put("/products/:id", upload.single("images"), (req, res) => {
  const product = req.body;
  const images = req.file;
  
  product.categories = JSON.parse(product.categories);
  product.attributes = JSON.parse(product.attributes);
  product.tags = JSON.parse(product.tags);

  const headers = {};

  if (!images) {
    WooCommerce.put(`products/${req.params.id}`, product, (err, data) => {
      if (err) {
        res.status(503).send(err);
      } else {
        res.status(201).send(data);
      }
    });
} else {
    headers["Content-Type"] = "multipart/form-data";
    headers["Accept"] = "application/json";
    headers["Content-Disposition"] = "attachment; filename=" + images.originalname;
    axios.defaults.headers.common["Authorization"] = process.env.JWT_SECRET;
    axios.defaults.headers.post["Content-Type"] = "multipart/form-data";

    axios
    .post(process.env.MEDIA_HOST, images.buffer, {
      headers,
    })
    .then((response) => {
        product["images"] = [{ "id": response.data.id }];
        WooCommerce.put(`products/${req.params.id}`, product, (err, data) => {
          if (err) {
            res.status(503).send(err);
          } else {
            res.status(201).send(data);
          }
        });
    });
  }
});

app.put("/products/:parentId/variation/:id", (req, res) => {
    const { product } = req.body;
    
    WooCommerce.put(
    `products/${req.params.parentId}/variations/${req.params.id}`,
    product,
    (err, data) => {
      if (err) {
        res.status(503).send(err);
      } else {
        res.send(data);
      }
    }
  );
});

app.get("/product/:id", (req, res) => {
  const { id } = req.params;

  WooCommerce.get(`products/${id}`, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    res.status(200).send(data.body);
  });
});

app.delete("/product/:id", (req, res) => {
  const { id } = req.params;
  WooCommerce.delete(`products/${id}`, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    res.status(200).send(data.body);
  });
}); 

app.get("/product/attributes/:id", (req, res) => {
    const { id } = req.params;
  
    WooCommerce.get(`products/${id}`, (err, data) => {
      if (err) {
        res.status(500).send(err);
      }
      
      const { images, attributes } = JSON.parse(data.body)

      res.status(200).send({ images, attributes });
    }); 
});

app.post("/products", upload.single("images"), (req, res) => {
    const product = req.body;
    const images = req.file;
    
    product.categories = JSON.parse(product.categories);
    product.tags = JSON.parse(product.tags);
    if(product.attributes)
      product.attributes = JSON.parse(product.attributes);
  
    const headers = {};
    headers["Content-Type"] = "multipart/form-data";
    headers["Accept"] = "application/json";
    headers["Content-Disposition"] = "attachment; filename=" + images.originalname;
    axios.defaults.headers.common["Authorization"] =process.env.JWT_SECRET;
    axios.defaults.headers.post["Content-Type"] = "multipart/form-data";

    axios
    .post(process.env.MEDIA_HOST, images.buffer, {
    headers,
    })
    .then((response) => {
        product["images"] = [{ "id": response.data.id }];
        WooCommerce.post(`products`, product, (err, data) => {
        if (err) {
            res.status(503).send(err);
        } else {
            res.status(201).send(data);
        }
        });
    });
    
});

app.post("/products/:parentId/variation/", upload.single("images"), (req, res) => {
    const product = req.body;
    const images = req.file;
    const { parentId } = req.params;
    
    product.categories = JSON.parse(product.categories);
    product.attributes = JSON.parse(product.attributes);
  
    const headers = {};
    headers["Content-Type"] = "multipart/form-data";
    headers["Accept"] = "application/json";
    headers["Content-Disposition"] = "attachment; filename=" + images.originalname;
    axios.defaults.headers.common["Authorization"] =process.env.JWT_SECRET;
    axios.defaults.headers.post["Content-Type"] = "multipart/form-data";

    axios
    .post(process.env.MEDIA_HOST, images.buffer, {
    headers,
    })
    .then((response) => {
        product["images"] = [{ "id": response.data.id }]; 
        WooCommerce.post(`products/${parentId}/variations`, product, (err, data) => {
        if (err) {
            res.status(503).send(err);
        } else {
            res.status(201).send(data);
        }
        });
    });
    
});

app.get("/categories", (req, res) => {
  WooCommerce.get("products/categories/", (err, data) => {
    if (err) {
      res.status(500).json({
        message: err.message,
      });
    } else {
      res.status(200).send(data.body);
    }
  });
});

app.get("/tags/", (req, res) => {

  const page = req.query.page || 1;
  const offset = (page - 1) * 50;
  const search = req.query.search || "";

  const pageQuery = `&page=${page}`;
  const searchQuery = `&search=${search}`;
  const query = `&offset=${offset}`;

  WooCommerce.get(`products/tags?per_page=20${pageQuery}${query}${searchQuery}`, (err, data) => {
    if (err) {
      res.status(500).json({
        message: err.message,
      });
    } else {
      res.status(200).send(data);
    }
  });
});

app.delete("/tag/:id", (req, res) => {
  const { id } = req.params;
  WooCommerce.delete(`products/tags/${id}`,{
    force: true
  }, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }
    res.status(200).send(data.body);
  });
});

app.post("/tag/", (req, res) => {
  
  const content = {
    name: req.body.tag
  }

  WooCommerce.post(`products/tags/`, content, (err, data) => {
    if (err) {
      res.status(500).send({
        err,
        body: content
      });
    }
    res.status(200).send({ 
      response: data.body, 
      body: content
    });
  });
});

app.post("/product/variations/:parentId", (req, res) => {
  const { parentId } = req.params;
  WooCommerce.get(`products/${parentId}/variations`, (err, data) => {
    if (err) {
      res.status(500).json({
        message: err.message,
      });
    } else {
      res.status(200).send(data.body);
    }
  });
});

/*
Database connection
*/
app.get('/db/user/:user', (req, res) =>{
  const { user } = req.params;
  const response = bd.signIn(user);
  response()
  .then((data) => res.status(200).send(data))
  .catch((error) => res.status(500).send({error: 'Ha ocurrido un error en la base de datos.'}) ); 
})

app.post('/db/new/user', (req, res) =>{
  const response = bd.signUp(req);
  response()
  .then((data) => res.status(200).send(data))
  .catch((error) => res.status(500).send({error: 'No fue posible registrar el usuario.'}) ); 
})

//Start the server
server.listen(port, () => {
  console.log("Server listening at port %d", port);
});
