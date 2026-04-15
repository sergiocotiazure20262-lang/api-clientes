//Carregar a biblioteca do Express (Web)
const express = require('express');
const swagger = require('swagger-ui-express');
const swaggerDoc = require('swagger-jsdoc');

//Inicializando a aplicação do Express
const app = express();

//Configurando o Express para trabalhar em modo 'json'
app.use(express.json());

//Configurar o Swagger
const options = {
    definition : {
        openapi : '3.0.0',
        info : {
            title : 'API clientes - COTI Informática',
            version : '1.0.0',
            description : 'API para gerenciamento de dados de clientes'
        },
        servers : [
            { url : 'http://localhost:3000' }
        ]
    },
    apis : ['./index.js']
};

//Executando a documentação do Swagger
const specs = swaggerDoc(options);
app.use('/docs', swagger.serve, swagger.setup(specs));

//Estrutura de dados para armazenar os clientes em memória
let clientes = [ //array de objetos
    { id : 1, nome : 'Ana Maria', email : 'anamaria@gmail.com' },
    { id : 2, nome : 'João Pedro', email : 'joaopedro@gmail.com' }
];

/**
 * @swagger
 * /api/clientes:
 *    get:
 *       summary: Retorna uma lista com todos os clientes cadastrados.
 *       responses:
 *           200:
 *             description: lista de clientes
 */
app.get('/api/clientes', (req, res) => {
    //Retornar (response) todos os clientes cadastrados em formato JSON
    res.json(clientes);
});

/**
 * @swagger
 * /api/clientes:
 *    post:
 *      summary: Cria um novo cliente no sistema
 *      requestBody:
 *         required: true
 *         content:
 *              application/json:
 *                schema:
 *                   type: object
 *                   properties:
 *                       nome:
 *                           type: string
 *                       email:
 *                           type: string
 *      responses:
 *         201:
 *           description: Cliente cadastrado com sucesso
 */
app.post('/api/clientes', (req, res) => {

    //Capturar os dados recebidos do cliente
    const { nome } = req.body; //Nome do cliente
    const { email } = req.body; //Email do cliente

    //Criando um novo cliente
    const novoCliente = {
        id: clientes[clientes.length - 1].id + 1, //Id sequencial
        nome,
        email
    };

    //Adicionando o cliente na lista / array
    clientes.push(novoCliente);

    //Retornar os dados do cliente cadastrado
    res.status(201).json(novoCliente);
});

//Executar o servidor da aplicação
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
    console.log('Swagger rodando em http://localhost:3000/docs');
});