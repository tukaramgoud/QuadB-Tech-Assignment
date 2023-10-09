const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "QuadBTech.db");
let database = null;
const initializeAndDbAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log(`server is running on http://localhost:3000`);
    });
  } catch (error) {
    console.log(`Database error is ${error}`);
    process.exit(1);
  }
};
initializeAndDbAndServer();

app.post("/login/", async (request, response) => {
  const { name, password } = request.body;
  // check user
  const userDetailsQuery = `select * from Users where name = '${name}';`;
  const userDetails = await database.get(userDetailsQuery);
  console.log(userDetails);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      password,
      userDetails.password
    );
    if (isPasswordValid) {
      //get JWT Token
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "vivek_secret_key");
      response.send({ jwtToken }); //Scenario 3
    } else {
      response.status(400);
      response.send(`Invalid password`); //Scenario 2
    }
  } else {
    response.status(400);
    response.send("Invalid user"); //Scenario 1
  }
});

//            Authentication with Token

function authenticationToken(request, response, next) {
  let jwtToken;
  const authHeader = request.headers.authorization;
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "vivek_secret_key", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send(`Invalid JWT Token`); // Scenario 1
      } else {
        next(); //Scenario 2
      }
    });
  } else {
    response.status(401);
    response.send(`Invalid JWT Token`); //Scenario 1
  }
}

//Check User Details
app.get("/details/:userId", async (request, response) => {
  const { userId } = request.params;
  const userQuery = `select * from users where id = ${userId};`;
  const userResponse = await database.all(userQuery);
  response.send(userResponse);
});

//insert User POST API

app.post("/insert", authenticationToken, async (request, response) => {
  const {
    id,
    name,
    image,
    email,
    total_orders,
    created_at,
    last_logged_in,
    password,
  } = request.body;
  const createDistrictQuery = `insert into Users(name, email, password, image, total_orders, created_at, last_logged_in) 
  values('${name}','${email}','${password}','${image}','${total_orders}','${created_at}','${last_logged_in}');`;
  const createDistrict = await database.run(createDistrictQuery);
  response.send(`User Successfully Added`);
});

//Update User

app.put("/update/:Id/", authenticationToken, async (request, response) => {
  const { Id } = request.params;
  const {
    name,
    email,
    password,
    image,
    total_orders,
    created_at,
    last_logged_in,
  } = request.body;
  const updateUserQuery = `update Users set
    name = '${name}',
    email =' ${email}',
    password = ${password},
    image = '${image}',
    total_orders = ${total_orders},
    created_at = '${created_at}',
    last_logged_in = '${last_logged_in}' where id = ${Id};`;

  const updateUserResponse = await database.run(updateUserQuery);
  response.send("User Details Updated");
});

// GET URL

app.get("/image/:id", async (request, response) => {
  const { id } = request.params;
  const urlQuery = `select image from Users where id=${id};`;
  const responseQuery = await database.get(urlQuery);
  response.send(responseQuery);
});

//DELETE USER

app.delete("/delete/:id", async (request, response) => {
  const { id } = request.params;
  const deleteQuery = `delete from Users where id=${id};`;
  await database.run(deleteQuery);
  response.send("User Details are Deleted");
});

///SEE TABLE DETAILS
app.get("/details", async (request, response) => {
  const Query = `select * from Users;`;
  const result = await database.all(Query);
  response.send(result);
});
