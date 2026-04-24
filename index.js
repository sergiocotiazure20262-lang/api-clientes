//Carregar a biblioteca do Express (Web)
const express = require('express');
const swagger = require('swagger-ui-express');
const swaggerDoc = require('swagger-jsdoc');
const { Pool } = require('pg');

//Carregando as variáveis de ambiente do arquivo .env
require('dotenv').config();

//Inicializando a aplicação do Express
const app = express();

//Configurando o Express para trabalhar em modo 'json'
app.use(express.json());

//Conectando no banco de dados do PostgreSQL (Pool)
const pool = new Pool({ //Ler as variáveis de ambiente
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});

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

//Criando uma tabela no banco de dados para salvar os clientes
async function inicializarBanco() {
    //Verificar se o banco de dados não possui uma tabela de cliente
    //e caso não tenha a tabela iremos criar a tabela
    await pool.query(`
            CREATE TABLE IF NOT EXISTS clientes(
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100),
                email VARCHAR(50) UNIQUE
            )
        `);

    //Cadastrar 2 clientes incialmente na tabela
    await pool.query(`
            INSERT INTO clientes (nome, email)
            VALUES
                ('Ana Maria', 'anamaria@gmail.com'),
                ('João Pedro', 'joaopedro@gmail.com')
            ON CONFLICT (email) DO NOTHING
        `);
}

/**
 * @swagger
 * /api/clientes:
 *    get:
 *       summary: Retorna uma lista com todos os clientes cadastrados.
 *       responses:
 *           200:
 *             description: lista de clientes
 */
app.get('/api/clientes', async (req, res) => {

    //Consultar todos os clientes cadastrados no banco de dados
    const result = await pool.query('SELECT ID, NOME, EMAIL FROM CLIENTES ORDER BY ID');

    //Retornar (response) todos os clientes cadastrados em formato JSON
    res.json(result.rows);
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
app.get('/api/clientes/:id', async (req, res) => {

    //Capturar o ID enviado no path da requisição (uri do endpoint)
    const id = parseInt(req.params.id);

    //Consultar o cliente no banco de dados através do ID
    const result = await pool.query('SELECT ID, NOME, EMAIL FROM CLIENTES WHERE ID = $1', [id]);

    //Verificando se algum registro foi encontrado
    if(result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
    }
    else {
        return res.status(404).json({
            mensagem : 'Cliente não encontrado.'
        });
    }
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
app.post('/api/clientes', async (req, res) => {

    //Capturar os dados recebidos do cliente
    const { nome } = req.body; //Nome do cliente
    const { email } = req.body; //Email do cliente

    //Verificar se os campos estão vazios
    if(!nome || !email) {
        return res.status(400).json({ //HTTP 400 - BAD REQUEST
            mensagem: 'Nome e email são obrigatórios.'
        })
    }

    //Verificar se o email informado já está cadastrado para algum cliente
    const emailJaExiste = await pool.query(
        'SELECT 1 FROM CLIENTES WHERE EMAIL = $1 LIMIT 1', [email]
    );

    if(emailJaExiste.rowCount > 0) {
        return res.status(409).json({ //HTTP 409 - CONFLICT
            mensagem: 'Já existe um cliente com este email.'
        });
    }

    //Cadastrar o cliente no banco de dados
    const result = await pool.query(
        'INSERT INTO CLIENTES(NOME, EMAIL) VALUES($1, $2) RETURNING ID, NOME, EMAIL',
        [nome, email]
    );

    //Retornar os dados do cliente cadastrado
    res.status(201).json(result.rows[0]);
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
app.put('/api/clientes/:id', async (req, res) => {

    //Capturando o id enviado na URI (path) da requisição
    const id = parseInt(req.params.id);

    //Capturando o nome e email enviados no corpo da requisição
    const { nome } = req.body;
    const { email } = req.body;

    //Verificar se o nome ou email estão vazios
    if(!nome || !email) {
        return res.status(400).json({ //HTTP 400 - BAD REQUEST
            mensagem: 'Nome e email são obrigatórios.'
        })
    }

    //Verificar se o email já está cadastrado para outro cliente
    const emailJaExiste = await pool.query(
        'SELECT 1 FROM CLIENTES WHERE EMAIL = $1 AND ID <> $2 LIMIT 1',
        [email, id]
    );

    if(emailJaExiste.rowCount > 0) {
        return res.status(409).json({ //HTTP 409 - CONFLICT
            mensagem: 'Já existe um outro cliente com este email.'
        });
    }

    //Atualizando o cliente no banco de dados
    const result = await pool.query(
        'UPDATE CLIENTES SET NOME = $1, EMAIL = $2 WHERE id = $3 RETURNING ID, NOME, EMAIL',
        [nome, email, id]
    );
    
    //Verificar se algum cliente foi alterado
    if(result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
    }
    else {
        return res.status(404).json({
            mensagem : 'Cliente não encontrado para edição.'
        });
    }
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
app.delete("/api/clientes/:id", async (req, res) => {

    //Capturar o ID enviado no path da uri
    const id = parseInt(req.params.id);

    //Executando a exclusão no banco de dados
    const result = await pool.query(
        'DELETE FROM CLIENTES WHERE ID = $1 RETURNING ID, NOME, EMAIL',
        [id]
    );

    //Verificar se algum cliente foi excluído
    if(result.rows.length > 0) {
        res.status(200).json(result.rows[0]);
    }
    else {
          return res.status(404).json({
            mensagem : 'Cliente não encontrado para exclusão.'
        });
    }
});

//Executar a conexão e incialização do banco de dados
inicializarBanco()
    .then(() => { //Executa caso o 'inicializarBanco' dê sucesso!
        //Executar o servidor da aplicação
        app.listen(3000, () => {
            console.log('Servidor rodando em http://localhost:3000');
            console.log('Swagger rodando em http://localhost:3000/docs');
            console.log('PostgreSQL conectado na porta 5432');
        });
    })
    .catch((error) => { //Executa caso o 'inicializarBanco' dê erro!
        console.log('Erro ao inicializar o banco de dados: ', error.message);
    });