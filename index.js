const express = require('express');

const app = express();

app.get('/', (req, res) => {

    res.send('Hello, Students! Our CI/CD Pipeline is working');

});


app.get('/products', (req, res) => {

    const products = [

        {
            id: 1,
            name: 'Product 1',
            price: 10
        },

        {
            id: 2,
            name: 'Product 2',
            price: 20
        },

        {
            id: 3,
            name: 'Product 3',
            price: 30
        }

    ];

    res.json(products);

});


const port = 4000;


app.listen(port, () => {

    console.log(`Server is running on http://localhost:${port}`);

});
