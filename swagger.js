import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Talent by Design API",
      version: "1.0.0",
      description: "API documentation for Talent by Design application",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
      {
        url: "https://backend-tbd.onrender.com",
        description: "Production development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Update this path to match your project
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;