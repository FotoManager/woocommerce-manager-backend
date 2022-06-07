//Start a server with Express

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const dotenv = require('dotenv');
dotenv.config();

const port = process.env.PORT || 3000;
const WooCommerceAPI = require('woocommerce-api');
//cors config of server
const cors = require('cors');
app.use(cors());
//Allow body 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use(express.static(__dirname + '/public'));
const WooCommerce = new WooCommerceAPI({
    url: process.env.WOO_HOST,
    consumerKey: process.env.WOO_CONSUMER_KEY,
    consumerSecret: process.env.WOO_CONSUMER_SECRET,
    wpAPI: true,
    version: 'wc/v2'
});

//List products WooCommerce API
app.get('/inventory/:page', (req, res) => { 
    
    WooCommerce.get(`products?per_page=100&page=${req.params.page}`, (err, data) => {
        if (err) {
            res.status(503).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});


app.get('/products/var/:id', (req, res) => {

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

app.put('/products/:id', (req, res) => {
    const { product } = req.body;

    WooCommerce.put(`products/${req.params.id}`, product, (err, data) => {
        if (err) {
            res.status(503).send(err);
        } else {
            res.send(data);
        }
    });
});

app.put('/products/:parentId/variation/:id', (req, res) => {
    const { product } = req.body;

    WooCommerce.put(`products/${req.params.parentId}/variations/${req.params.id}`, product, (err, data) => {
        if (err) {
            res.status(503).send(err);
        } else {
            res.send(data);
        }
    });
});

app.get('/product/:id', (req, res) => {
    const { id } = req.params;

    WooCommerce.get(`products/${id}`, (err, data) => {
        if(err){
            res.status(500).send(err);
        }
        res.status(200).send(data.body);
    })
});

app.get('/categories', (req, res) => { 
    WooCommerce.get("products/categories/", (err, data) => {
        if (err) {
            res.status(500).json({
                message: err.message
            })
        } else {
            res.status(200).send(data.body)
        }
    })
});

app.post('/product/variations/:parentId', (req, res) => {
    const { parentId } = req.params;
    WooCommerce.get(`products/${parentId}/variations`, (err, data) => {
        if (err) {
            res.status(500).json({
                message: err.message
            })
        } else {
            res.status(200).send(data.body)
        }
    })
});

//Start the server
server.listen(port, () => {
    console.log('Server listening at port %d', port);
});

