// tests/auth.test.js
const request = require("supertest");
const app = require("../server"); // Import your Express app instance
const prisma = require("../db"); // Import Prisma client for cleanup

// --- Test Suite for Authentication ---
describe("Authentication API", () => {
  // Clean up the database before each test to ensure isolation
  beforeEach(async () => {
    // Order matters: delete dependent records first
    await prisma.comment.deleteMany();
    await prisma.review.deleteMany();
    await prisma.user.deleteMany();
    // You might not need to delete items if they aren't directly related to auth tests
    // await prisma.item.deleteMany();
  });

  // Clean up Prisma connection after all tests in this file
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- Test Case for User Registration ---
  it("should register a new user successfully", async () => {
    const newUser = {
      username: "testuser_reg",
      password: "password123",
      email: "test_reg@example.com",
    };

    const response = await request(app) // Use supertest to wrap your app
      .post("/api/auth/register") // Target the endpoint
      .send(newUser); // Send the user data

    // Assertions using Jest's expect()
    expect(response.statusCode).toBe(201); // Check status code
    expect(response.body).toHaveProperty("token"); // Check if token exists in response
    expect(response.body.message).toBe("User registered successfully");

    // Optional: Verify user was actually created in the DB (without password)
    const dbUser = await prisma.user.findUnique({
      where: { username: newUser.username },
      select: { username: true, email: true }, // Don't select password!
    });
    expect(dbUser).not.toBeNull();
    expect(dbUser.username).toBe(newUser.username);
  });

  // --- Test Case for User Login ---
  it("should log in an existing user successfully", async () => {
    // 1. Need to register a user first to log them in
    const registeredUser = {
      username: "testuser_login",
      password: "password123",
      email: "test_login@example.com",
    };
    await request(app).post("/api/auth/register").send(registeredUser);

    // 2. Now try to log in
    const loginCredentials = {
      username: registeredUser.username,
      password: registeredUser.password,
    };

    const response = await request(app)
      .post("/api/auth/login")
      .send(loginCredentials);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body.message).toBe("Login successful");
  });

  // --- Test Case for Registration Conflict ---
  it("should return 409 if username already exists during registration", async () => {
    const existingUser = {
      username: "testuser_conflict",
      password: "password123",
    };
    // Register the user once
    await request(app).post("/api/auth/register").send(existingUser);

    // Try to register again with the same username
    const response = await request(app)
      .post("/api/auth/register")
      .send(existingUser);

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe("Username already taken");
  });

  // --- Test Case for Invalid Login Credentials ---
  it("should return 401 for invalid login credentials", async () => {
    const loginAttempt = {
      username: "nonexistentuser",
      password: "wrongpassword",
    };

    const response = await request(app)
      .post("/api/auth/login")
      .send(loginAttempt);

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  // Add more tests for missing fields (400 Bad Request), etc.
});
