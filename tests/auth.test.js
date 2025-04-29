const request = require("supertest");
const app = require("../server");
const prisma = require("../db");
const jwt = require("jsonwebtoken");

describe("Authentication API", () => {
  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        username: "testuser_reg",
        password: "password123",
        email: "test_reg@example.com",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.message).toBe("User registered successfully");

      const dbUser = await prisma.user.findUnique({
        where: { username: newUser.username },
        select: { username: true, email: true },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe(newUser.username);
    });

    it("should return 409 if username already exists during registration", async () => {
      const existingUser = {
        username: "testuser_conflict",
        password: "password123",
      };
      await request(app).post("/api/auth/register").send(existingUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send(existingUser);

      expect(response.statusCode).toBe(409);
      expect(response.body.message).toBe("Username already taken");
    });

    it("should return 400 if required fields are missing during registration", async () => {
      const incompleteUser = { username: "missing_password" };
      const response = await request(app)
        .post("/api/auth/register")
        .send(incompleteUser);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Username and password are required");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send({
        username: "testuser_login",
        password: "password123",
        email: "test_login@example.com",
      });
    });

    it("should log in an existing user successfully", async () => {
      const loginCredentials = {
        username: "testuser_login",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginCredentials);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.message).toBe("Login successful");
    });

    it("should return 401 for invalid login credentials (wrong password)", async () => {
      const loginAttempt = {
        username: "testuser_login",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginAttempt);

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 401 for invalid login credentials (user not found)", async () => {
      const loginAttempt = {
        username: "nonexistentuser",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginAttempt);

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should return 400 if required fields are missing during login", async () => {
      const incompleteLogin = { username: "testuser_login" };
      const response = await request(app)
        .post("/api/auth/login")
        .send(incompleteLogin);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Username and password are required");
    });
  });

  describe("GET /api/auth/me", () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      const registrationResponse = await request(app)
        .post("/api/auth/register")
        .send({
          username: "me_testuser",
          password: "password123",
          email: "me_test@example.com",
        });
      validToken = registrationResponse.body.token;
      testUser = await prisma.user.findUnique({
        where: { username: "me_testuser" },
        select: { id: true, username: true, email: true },
      });
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/auth/me");
      expect(response.statusCode).toBe(401);
      expect(response.body.message).toMatch(/no token provided/);
    });

    it("should return 401 if token is invalid (e.g., malformed)", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken123");
      expect(response.statusCode).toBe(401);
      expect(response.body.message).toMatch(
        /token error: invalid signature|token error: jwt malformed/
      );
    });

    it("should return 200 and user data (excluding password) if token is valid", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty("id", testUser.id);
      expect(response.body).toHaveProperty("username", testUser.username);
      expect(response.body).toHaveProperty("email", testUser.email);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 401 if user associated with token no longer exists", async () => {
      const tempUser = await prisma.user.create({
        data: { username: "temp_user", password: "hashed_password" },
        select: { id: true, username: true },
      });
      const tempToken = jwt.sign(
        { userId: tempUser.id, username: tempUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      await prisma.user.delete({ where: { id: tempUser.id } });

      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${tempToken}`);

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe("Not authorized, user not found");
    });
  });
});
