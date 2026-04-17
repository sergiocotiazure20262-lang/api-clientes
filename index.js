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
 * /api/clientes/{id}:
 *    get:
 *      summary: Busca cliente por ID
 *      parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *              type: integer
 *      responses:
 *          200:
 *             description: Cliente encontrado
 *          404:
 *             description: Cliente não encontrado
 */
app.get('/api/clientes/:id', (req, res) => {

    //Capturar o ID enviado no path da requisição (uri do endpoint)
    const id = parseInt(req.params.id);

    //Buscar o cliente pelo id
    const cliente = clientes.find(c => c.id == id);

    //Verificando se o cliente não foi encontrado
    if(!cliente) {
        return res.status(404).json({
            mensagem : "Cliente não encontrado. Verifique o ID informado."
        });
    }

    //Retornar os dado do cliente
    res.json(cliente);
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

/**
 * @swagger
 * /api/clientes/{id}:
 *     put:
 *        summary: Atualiza um cliente no sistema
 *        parameters:
 *           - in: path
 *             name: id
 *             required: true
 *             schema:
 *                type: integer
 *        requestBody:
 *           required: true
 *           content:
 *               application/json:
 *                  schema:
 *                     type: object
 *                     properties:
 *                         nome:
 *                            type: string
 *                         email:
 *                            type: string
 *        responses:
 *             200:
 *                 description: Cliente atualizado com sucesso
 *             404:
 *                 description: Cliente não encontrado
 */
app.put('/api/clientes/:id', (req, res) => {

    //Capturando o id enviado na URI (path) da requisição
    const id = parseInt(req.params.id);

    //Capturando o nome e email enviados no corpo da requisição
    const { nome } = req.body;
    const { email } = req.body;

    //Buscar o cliente pelo ID
    const cliente = clientes.find(c => c.id == id);

    //Verificar se o cliente não foi encontrado
    if(!cliente) {
        return res.status(404).json({
            mensagem: "Cliente não encontrado para edição."
         });
    }

    //Modificar os dados do cliente
    cliente.nome = nome;
    cliente.email = email;

    //Retornar os dados do cliente atualizado
    res.json(cliente);
});

/**
 * @swagger
 * /api/clientes/{id}:
 *    delete:
 *       summary: Remove um cliente do sistema
 *       parameters:
 *           - in: path
 *             name: id
 *             required: true
 *             schema:
 *               type: integer
 *       responses:
 *            200:
 *               description: Cliente excluído com sucesso
 *            404:
 *               description: Cliente não encontrado
 */
app.delete("/api/clientes/:id", (req, res) => {

    //Capturar o ID enviado no path da uri
    const id = parseInt(req.params.id);

    //Verificar se o cliente existe através do ID
    const existe = clientes.some(c => c.id == id);

    if(!existe) {
        return res.status(404).json({ mensagem : "Cliente não encontrado para exclusão." });
    }

    //Excluir o cliente
    clientes = clientes.filter(c => c.id !== id);

    //Retornar resposta
    res.json({
        mensagem: "Cliente excluído com sucesso."
    });
});


//Executar o servidor da aplicação
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
    console.log('Swagger rodando em http://localhost:3000/docs');
});